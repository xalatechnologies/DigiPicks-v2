import { v } from 'convex/values';
import { action, internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc } from '../_generated/dataModel';
import { requireAdmin } from '../shared/permissions';

// =============================================================================
// Discord GDPR helpers — admin-gated export + bounded delete by `authorHash`.
//
// We only ever stored hashed authors (see inbound.ts), so an "export by
// authorHash" returns every row whose hash matches — which is the unit of
// data subject we have. The matching delete cascades across imports for the
// same hash; bounded to MAX_PER_RUN; self-schedules if more remain.
// =============================================================================

const MAX_DELETE_PER_RUN = 500;

export const _exportByHash = internalQuery({
  args: { authorHash: v.string() },
  handler: async (ctx, args): Promise<Doc<'discordMessageImports'>[]> => {
    const all = await ctx.db.query('discordMessageImports').take(5000);
    return all.filter((r) => r.authorHash === args.authorHash);
  },
});

export const _deleteByHashBatch = internalMutation({
  args: { authorHash: v.string() },
  handler: async (ctx, args): Promise<{ deleted: number; more: boolean }> => {
    const all = await ctx.db.query('discordMessageImports').take(2000);
    const matches = all
      .filter((r) => r.authorHash === args.authorHash)
      .slice(0, MAX_DELETE_PER_RUN);
    for (const r of matches) {
      await ctx.db.delete(r._id);
    }
    // Cheap "are there more?" check: if we deleted exactly the cap, assume
    // more rows might exist for this hash and signal a re-run.
    return {
      deleted: matches.length,
      more: matches.length === MAX_DELETE_PER_RUN,
    };
  },
});

/** Admin-only: dump the imports we hold for a given author hash. */
export const exportUserDiscordData = action({
  args: { authorHash: v.string() },
  handler: async (ctx, args): Promise<Doc<'discordMessageImports'>[]> => {
    await ctx.runQuery(internal.discord.gdpr._adminGate, {});
    const rows: Doc<'discordMessageImports'>[] = await ctx.runQuery(
      internal.discord.gdpr._exportByHash,
      { authorHash: args.authorHash },
    );
    await ctx.runMutation(internal.audit.log, {
      entityType: 'discord_gdpr',
      entityId: args.authorHash,
      action: 'discord.gdpr.export',
      metadata: { records: rows.length },
    });
    return rows;
  },
});

/**
 * Admin-only bounded delete. Deletes up to MAX_DELETE_PER_RUN (500) rows in
 * this invocation; if more remain, schedules `_continueDeleteUserDiscordData`
 * to keep working without busting the per-mutation document budget.
 */
export const deleteUserDiscordData = action({
  args: { authorHash: v.string() },
  handler: async (ctx, args): Promise<{ deleted: number; scheduledMore: boolean }> => {
    await ctx.runQuery(internal.discord.gdpr._adminGate, {});
    const result = await ctx.runMutation(internal.discord.gdpr._deleteByHashBatch, {
      authorHash: args.authorHash,
    });
    if (result.more) {
      await ctx.scheduler.runAfter(0, internal.discord.gdpr._continueDeleteUserDiscordData, {
        authorHash: args.authorHash,
      });
    }
    await ctx.runMutation(internal.audit.log, {
      entityType: 'discord_gdpr',
      entityId: args.authorHash,
      action: 'discord.gdpr.delete',
      metadata: { deleted: result.deleted, scheduledMore: result.more },
    });
    return { deleted: result.deleted, scheduledMore: result.more };
  },
});

/** Internal action: continue deleting until exhausted. */
export const _continueDeleteUserDiscordData = internalAction({
  args: { authorHash: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const result = await ctx.runMutation(internal.discord.gdpr._deleteByHashBatch, {
      authorHash: args.authorHash,
    });
    if (result.more) {
      await ctx.scheduler.runAfter(0, internal.discord.gdpr._continueDeleteUserDiscordData, args);
    }
  },
});

/**
 * Admin-only gate used by the actions above. Implemented as an internalQuery
 * so we can use the standard `requireAdmin` helper (which needs a query/
 * mutation ctx, not an action ctx).
 */
export const _adminGate = internalQuery({
  args: {},
  handler: async (ctx): Promise<true> => {
    await requireAdmin(ctx);
    return true;
  },
});
