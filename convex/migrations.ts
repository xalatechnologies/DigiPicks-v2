import { internalMutation, mutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { requireAdmin } from './shared/permissions';

/**
 * Legacy columns on `users` only (pre–Convex Auth). Unrelated to:
 * - `creators.status` (creator profile lifecycle)
 * - `subscriptions.status` (billing / entitlement)
 * - `teamLogos.displayName` (sports metadata)
 *
 * Subscriber vs creator personas are NOT separate tables — they share `users`
 * (`role`, optional `creatorId`) with `subscriptions` linking subscriberId →
 * creatorId. This migration never touches those tables or rewrites persona keys.
 */
const LEGACY_USER_FIELD_KEYS = [
  'displayName',
  'emailVerified',
  'lastLoginAt',
  'metadata',
  'mfaEnabled',
  'passwordHash',
  'phoneVerified',
  'status',
] as const;

type LegacyUserFieldKey = (typeof LEGACY_USER_FIELD_KEYS)[number];

function userHasLegacyFields(user: Record<string, unknown>): boolean {
  return LEGACY_USER_FIELD_KEYS.some((key) => user[key] !== undefined);
}

/** Copy only fields on the current `users` validator — omit legacy keys entirely. */
function sanitizeUserDocument(user: Doc<'users'>): Omit<Doc<'users'>, '_id' | '_creationTime'> {
  const raw = user as Doc<'users'> & Record<string, unknown>;
  // Fill display name only when `name` was never set — never overwrite an existing name.
  const name =
    user.name ??
    (typeof raw.displayName === 'string' && raw.displayName.trim() !== ''
      ? raw.displayName.trim()
      : undefined);

  return {
    name,
    image: user.image,
    email: user.email,
    emailVerificationTime: user.emailVerificationTime,
    phone: user.phone,
    phoneVerificationTime: user.phoneVerificationTime,
    isAnonymous: user.isAnonymous,
    // Persona: pass through exactly — never derive from legacy `status` or `metadata`.
    role: user.role,
    locale: user.locale,
    isActive: user.isActive,
    creatorId: user.creatorId,
    stripeCustomerId: user.stripeCustomerId,
    discordId: user.discordId,
    discordUsername: user.discordUsername,
    notifyPrefs: user.notifyPrefs,
    telegramChatId: user.telegramChatId,
    telegramLinkCode: user.telegramLinkCode,
    telegramLinkedAt: user.telegramLinkedAt,
    mfaSecret: user.mfaSecret,
    mfaEnrolledAt: user.mfaEnrolledAt,
    mfaLastVerifiedAt: user.mfaLastVerifiedAt,
    mfaRecoveryCodes: user.mfaRecoveryCodes,
    emailVerificationTokenHash: user.emailVerificationTokenHash,
    emailVerificationSentAt: user.emailVerificationSentAt,
    emailVerificationExpiresAt: user.emailVerificationExpiresAt,
  };
}

/** Abort replace if persona fields would change (should never happen). */
function personaFieldsMatch(
  before: Doc<'users'>,
  after: Omit<Doc<'users'>, '_id' | '_creationTime'>,
): boolean {
  const nameOk =
    before.name == null || before.name === ''
      ? true // may backfill from legacy displayName only when name was empty
      : before.name === after.name;
  return (
    before.role === after.role &&
    before.creatorId === after.creatorId &&
    before.isActive === after.isActive &&
    nameOk
  );
}

function legacyKeysPresent(user: Record<string, unknown>): LegacyUserFieldKey[] {
  return LEGACY_USER_FIELD_KEYS.filter((key) => user[key] !== undefined);
}

/**
 * One-off: delete all events so the cron + seed can repopulate.
 */
export const clearEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query('events').collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    return { deleted: events.length };
  },
});

/**
 * Seed high-profile upcoming events across Soccer, Cricket, Tennis.
 */
export const seedEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const DAY = 86400000;

    const events = [
      // ── Soccer · Champions League ──────────────────────────────────
      {
        sport: 'Soccer',
        league: 'Champions League',
        home: 'Inter Milan',
        away: 'Paris Saint-Germain',
        time: '9:00 PM CET',
        startsAt: now + DAY * 2,
        creatorCount: 42,
        pickCount: 68,
        featured: true,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Soccer',
        league: 'Champions League',
        home: 'Arsenal',
        away: 'Bayern Munich',
        time: '9:00 PM CET',
        startsAt: now + DAY * 3,
        creatorCount: 38,
        pickCount: 54,
        featured: true,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      // ── Soccer · EPL ───────────────────────────────────────────────
      {
        sport: 'Soccer',
        league: 'EPL',
        home: 'Liverpool',
        away: 'Chelsea',
        time: '12:30 PM GMT',
        startsAt: now + DAY,
        creatorCount: 28,
        pickCount: 42,
        featured: true,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Soccer',
        league: 'EPL',
        home: 'Fulham',
        away: 'Bournemouth',
        time: '3:00 PM GMT',
        startsAt: now + DAY,
        creatorCount: 12,
        pickCount: 18,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Soccer',
        league: 'EPL',
        home: 'Brighton',
        away: 'Wolves',
        time: '3:00 PM GMT',
        startsAt: now + DAY,
        creatorCount: 8,
        pickCount: 11,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Soccer',
        league: 'EPL',
        home: 'Nottingham Forest',
        away: 'Crystal Palace',
        time: '3:00 PM GMT',
        startsAt: now + DAY,
        creatorCount: 6,
        pickCount: 9,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Soccer',
        league: 'EPL',
        home: 'Everton',
        away: 'Southampton',
        time: '5:30 PM GMT',
        startsAt: now + DAY,
        creatorCount: 5,
        pickCount: 7,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      // ── Soccer · La Liga ───────────────────────────────────────────
      {
        sport: 'Soccer',
        league: 'La Liga',
        home: 'Real Madrid',
        away: 'Barcelona',
        time: '9:00 PM CET',
        startsAt: now + DAY * 4,
        creatorCount: 48,
        pickCount: 72,
        featured: true,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Soccer',
        league: 'La Liga',
        home: 'Atlético Madrid',
        away: 'Sevilla',
        time: '4:15 PM CET',
        startsAt: now + DAY * 2,
        creatorCount: 9,
        pickCount: 14,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Soccer',
        league: 'La Liga',
        home: 'Real Sociedad',
        away: 'Athletic Bilbao',
        time: '6:30 PM CET',
        startsAt: now + DAY * 2,
        creatorCount: 7,
        pickCount: 10,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      // ── Soccer · Bundesliga ────────────────────────────────────────
      {
        sport: 'Soccer',
        league: 'Bundesliga',
        home: 'Leverkusen',
        away: 'Dortmund',
        time: '5:30 PM CET',
        startsAt: now + DAY * 3,
        creatorCount: 14,
        pickCount: 22,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Soccer',
        league: 'Bundesliga',
        home: 'Bayern Munich',
        away: 'RB Leipzig',
        time: '6:30 PM CET',
        startsAt: now + DAY * 5,
        creatorCount: 18,
        pickCount: 28,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      // ── Cricket · IPL ──────────────────────────────────────────────
      {
        sport: 'Cricket',
        league: 'IPL',
        home: 'Mumbai Indians',
        away: 'Chennai Super Kings',
        time: '7:30 PM IST',
        startsAt: now + DAY,
        creatorCount: 22,
        pickCount: 34,
        featured: true,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Cricket',
        league: 'IPL',
        home: 'Royal Challengers',
        away: 'Kolkata Knight Riders',
        time: '3:30 PM IST',
        startsAt: now + DAY * 2,
        creatorCount: 16,
        pickCount: 24,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Cricket',
        league: 'IPL',
        home: 'Delhi Capitals',
        away: 'Rajasthan Royals',
        time: '7:30 PM IST',
        startsAt: now + DAY * 3,
        creatorCount: 10,
        pickCount: 15,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Cricket',
        league: 'IPL',
        home: 'Gujarat Titans',
        away: 'Punjab Kings',
        time: '7:30 PM IST',
        startsAt: now + DAY * 4,
        creatorCount: 8,
        pickCount: 11,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      // ── Cricket · T20 International ────────────────────────────────
      {
        sport: 'Cricket',
        league: 'T20 International',
        home: 'India',
        away: 'England',
        time: '2:00 PM IST',
        startsAt: now + DAY * 6,
        creatorCount: 28,
        pickCount: 40,
        featured: true,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      // ── Tennis · Italian Open ──────────────────────────────────────
      {
        sport: 'Tennis',
        league: 'ATP Italian Open',
        home: 'Sinner',
        away: 'Alcaraz',
        time: '2:30 PM CET',
        startsAt: now + DAY * 2,
        creatorCount: 8,
        pickCount: 12,
        featured: true,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Tennis',
        league: 'ATP Italian Open',
        home: 'Djokovic',
        away: 'Medvedev',
        time: '8:00 PM CET',
        startsAt: now + DAY * 2,
        creatorCount: 6,
        pickCount: 9,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Tennis',
        league: 'WTA Italian Open',
        home: 'Świątek',
        away: 'Gauff',
        time: '12:00 PM CET',
        startsAt: now + DAY * 2,
        creatorCount: 5,
        pickCount: 7,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
      {
        sport: 'Tennis',
        league: 'ATP Italian Open',
        home: 'Rune',
        away: 'Fritz',
        time: '4:00 PM CET',
        startsAt: now + DAY * 3,
        creatorCount: 3,
        pickCount: 5,
        featured: false,
        status: 'upcoming' as const,
        gameStatus: 'Upcoming',
      },
    ];

    let count = 0;
    for (const event of events) {
      await ctx.db.insert('events', {
        ...event,
        title: `${event.home} vs ${event.away}`,
        sourceType: 'platform',
        visibility: 'public',
        verificationStatus: 'admin_verified',
        resultSource: 'manual_admin',
        participants: [
          { name: event.home, type: 'team' as const },
          { name: event.away, type: 'team' as const },
        ],
      });
      count++;
    }
    return { seeded: count };
  },
});

/**
 * Phase 1 — Backfill federated event fields onto pre-migration rows.
 *
 * Idempotent: skips rows that already have `sourceType` set. Self-reschedules
 * via the scheduler when more pages remain. Run once from the Convex dashboard
 * after the schema-widen deploy lands.
 *
 * Provider-style defaults are applied to rows with an `externalId` (came from
 * The Odds API); platform-style defaults are applied to rows without one
 * (legacy seed events).
 */
export const backfillFederatedEvents = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('events')
      .order('asc')
      .paginate({ numItems: 200, cursor: args.cursor ?? null });

    let patched = 0;
    for (const event of result.page) {
      if (event.sourceType !== undefined) continue;

      const fromProvider = Boolean(event.externalId);
      const patch: Record<string, unknown> = {
        sourceType: fromProvider ? 'provider' : 'platform',
        visibility: 'public',
        verificationStatus: fromProvider ? 'source_verified' : 'admin_verified',
        resultSource: fromProvider ? 'provider' : 'manual_admin',
      };
      if (fromProvider) patch.providerName = 'the-odds-api';
      if (event.title === undefined) {
        patch.title = `${event.home} vs ${event.away}`;
      }
      if (event.participants === undefined) {
        patch.participants = [
          { name: event.home, type: 'team' as const },
          { name: event.away, type: 'team' as const },
        ];
      }
      await ctx.db.patch(event._id, patch);
      patched++;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillFederatedEvents, {
        cursor: result.continueCursor,
      });
    }

    return {
      patched,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

// =============================================================================
// M20 — Backfill `discordIntegrations` + `discordChannelSyncs` stub rows for
// every creator that still uses the legacy `creators.discordWebhookUrl`
// field. Idempotent: skips creators that already have an integration.
//
// Reversible — leaves `creators.discordWebhookUrl` untouched so a rollback
// is just deleting the stub rows. Bounded to 500 creators per call to stay
// inside the per-mutation document budget.
// =============================================================================

/**
 * Dev/staging: remove legacy `users` columns from an older DigiPicks schema so
 * `npx convex dev` can enforce the current validator.
 *
 * Scope: `users` rows only. Does not read/write `creators`, `subscriptions`,
 * `applications`, or any other table. Document `_id` is unchanged so subscriber
 * and creator foreign keys stay valid.
 *
 *   npx convex run migrations:stripLegacyUserFields '{"dryRun": true}'
 *   npx convex run migrations:stripLegacyUserFields
 */
export const stripLegacyUserFields = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query('users').collect();
    const dryRun = args.dryRun ?? false;
    let scanned = 0;
    let cleaned = 0;
    let skipped = 0;
    const brokenCreatorLinks: string[] = [];
    const skippedUserIds: string[] = [];
    const samples: Array<{
      userId: string;
      legacyKeys: LegacyUserFieldKey[];
      role: Doc<'users'>['role'];
      creatorId?: string;
      subscriptionCount: number;
    }> = [];

    const subscriptionCounts = new Map<string, number>();
    for (const sub of await ctx.db.query('subscriptions').collect()) {
      const key = sub.subscriberId as string;
      subscriptionCounts.set(key, (subscriptionCounts.get(key) ?? 0) + 1);
    }

    for (const user of users) {
      scanned++;
      const raw = user as Record<string, unknown>;
      if (!userHasLegacyFields(raw)) continue;

      if (user.creatorId) {
        const creator = await ctx.db.get(user.creatorId);
        if (!creator) {
          brokenCreatorLinks.push(user._id);
        }
      }

      const sanitized = sanitizeUserDocument(user);
      if (!personaFieldsMatch(user, sanitized)) {
        skipped++;
        skippedUserIds.push(user._id);
        continue;
      }

      if (samples.length < 10) {
        samples.push({
          userId: user._id,
          legacyKeys: legacyKeysPresent(raw),
          role: user.role,
          creatorId: user.creatorId,
          subscriptionCount: subscriptionCounts.get(user._id) ?? 0,
        });
      }

      cleaned++;
      if (dryRun) continue;
      await ctx.db.replace(user._id, sanitized);
    }

    return {
      scanned,
      cleaned,
      skipped,
      dryRun,
      brokenCreatorLinks,
      skippedUserIds,
      samples,
      note:
        'Only legacy keys on users were removed. creators/subscriptions untouched. ' +
        'Legacy users.status is not mapped to isActive (unrelated to creator or subscription status).',
    };
  },
});

/** Admin-only one-shot migration. Run from the Convex dashboard. */
export const migrateLegacyDiscordWebhooks = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const creators = await ctx.db.query('creators').take(500);
    const dryRun = args.dryRun ?? false;

    let scanned = 0;
    let migrated = 0;
    let skipped = 0;

    for (const creator of creators) {
      scanned++;
      if (!creator.discordWebhookUrl) {
        skipped++;
        continue;
      }
      if (!creator.discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        skipped++;
        continue;
      }
      // Already migrated?
      const existing = await ctx.db
        .query('discordIntegrations')
        .withIndex('by_creator', (q) => q.eq('creatorId', creator._id))
        .first();
      if (existing) {
        skipped++;
        continue;
      }
      // Need a users _id for connectedByUserId.
      const owner = await ctx.db
        .query('users')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
        .first();
      if (!owner) {
        skipped++;
        continue;
      }

      if (dryRun) {
        migrated++;
        continue;
      }

      const now = Date.now();
      const integrationId = await ctx.db.insert('discordIntegrations', {
        creatorId: creator._id,
        guildId: `legacy:${creator._id}`,
        guildName: `${creator.name} (legacy webhook)`,
        status: 'connected',
        botInstalled: false,
        connectedByUserId: owner._id,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert('discordChannelSyncs', {
        integrationId,
        creatorId: creator._id,
        channelId: 'legacy',
        channelName: 'Legacy webhook',
        syncDirection: 'outbound',
        isEnabled: true,
        createdAt: now,
        updatedAt: now,
      });
      migrated++;
    }

    return { scanned, migrated, skipped, dryRun };
  },
});
