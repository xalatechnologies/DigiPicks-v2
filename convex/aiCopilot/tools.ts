import type { ActionCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { internal, api } from '../_generated/api';

// =============================================================================
// AI Copilot tool definitions + dispatcher (M24).
//
// `TOOL_DEFINITIONS` is the JSON-schema array shipped to Anthropic on every
// /v1/messages call. `executeTool` is the dispatcher the respond action
// calls when the model emits a tool_use block.
//
// Each tool wraps a single Convex query call, captures its duration, and
// returns either `{ result, sampleSize?, durationMs }` or
// `{ error, durationMs }`. The dispatcher never throws — errors are
// returned as `tool_result` blocks with `is_error: true` so the model can
// recover instead of cratering the whole loop.
// =============================================================================

export interface ToolInputSchema {
  type: 'object';
  properties: Record<
    string,
    { type: string; description?: string; minimum?: number; maximum?: number }
  >;
  required: string[];
  additionalProperties?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'lookupCreator',
    description:
      'Look up a creator by their handle (with or without leading "@"). Returns the creator id, profile, and trust score. Call this first when given a handle.',
    input_schema: {
      type: 'object',
      properties: {
        handle: {
          type: 'string',
          description: 'Creator handle, e.g. "@sharpedge" or "sharpedge".',
        },
      },
      required: ['handle'],
      additionalProperties: false,
    },
  },
  {
    name: 'creatorPerformance',
    description:
      "Get a creator's rolling-window record: wins, losses, pushes, pending, win-rate, and sample size. Always specify windowDays explicitly (default 30 if uncertain). Use the creatorId returned by lookupCreator.",
    input_schema: {
      type: 'object',
      properties: {
        creatorId: {
          type: 'string',
          description: 'creators._id from lookupCreator.',
        },
        windowDays: {
          type: 'number',
          description: 'Rolling window in days (1-365).',
          minimum: 1,
          maximum: 365,
        },
      },
      required: ['creatorId', 'windowDays'],
      additionalProperties: false,
    },
  },
  {
    name: 'eventDetails',
    description:
      'Fetch the canonical record for a specific event by id. Returns sport, league, teams, status, and times. Use only when an eventId is already in scope.',
    input_schema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'events._id of the target event.',
        },
      },
      required: ['eventId'],
      additionalProperties: false,
    },
  },
  {
    name: 'creatorTrust',
    description:
      'Read the cached 0-100 trust score and signal breakdown for a creator. Cheaper than creatorPerformance; use when the user asks specifically about trust.',
    input_schema: {
      type: 'object',
      properties: {
        creatorId: {
          type: 'string',
          description: 'creators._id whose trust score to read.',
        },
      },
      required: ['creatorId'],
      additionalProperties: false,
    },
  },
];

// ─── Dispatcher ────────────────────────────────────────────────────────────

export interface ToolExecution {
  result: unknown;
  sampleSize?: number;
  durationMs: number;
  error?: string;
}

export async function executeTool(
  ctx: ActionCtx,
  name: string,
  rawArgs: unknown,
): Promise<ToolExecution> {
  const started = Date.now();
  try {
    if (!isObject(rawArgs)) {
      return failure(started, 'Tool arguments must be an object');
    }

    if (name === 'lookupCreator') {
      const handle = stringArg(rawArgs, 'handle');
      if (!handle) return failure(started, 'handle is required');
      const normalized = handle.startsWith('@') ? handle : `@${handle}`;
      const creator = await ctx.runQuery(api.creators.getByHandle, {
        handle: normalized,
      });
      if (!creator) {
        return {
          result: { found: false, handle: normalized },
          durationMs: Date.now() - started,
        };
      }
      return {
        result: {
          found: true,
          id: creator._id,
          handle: creator.handle,
          name: creator.name,
          niche: creator.niche,
          sports: creator.sports,
          verified: creator.verified,
          trustScore: creator.trustScore ?? null,
          subscriberCount: creator.subscriberCount,
        },
        durationMs: Date.now() - started,
      };
    }

    if (name === 'creatorPerformance') {
      const creatorId = stringArg(rawArgs, 'creatorId');
      const windowDays = numberArg(rawArgs, 'windowDays');
      if (!creatorId) return failure(started, 'creatorId is required');
      if (windowDays === undefined) {
        return failure(started, 'windowDays is required');
      }
      if (windowDays < 1 || windowDays > 365) {
        return failure(started, 'windowDays must be between 1 and 365');
      }
      const perf = await ctx.runQuery(internal.aiCopilot.queries._creatorPerformance, {
        creatorId: creatorId as Id<'creators'>,
        windowDays,
      });
      return {
        result: perf,
        sampleSize: perf.sampleSize,
        durationMs: Date.now() - started,
      };
    }

    if (name === 'eventDetails') {
      const eventId = stringArg(rawArgs, 'eventId');
      if (!eventId) return failure(started, 'eventId is required');
      const event = await ctx.runQuery(internal.aiCopilot.queries._eventDetails, {
        eventId: eventId as Id<'events'>,
      });
      return {
        result: event,
        durationMs: Date.now() - started,
      };
    }

    if (name === 'creatorTrust') {
      const creatorId = stringArg(rawArgs, 'creatorId');
      if (!creatorId) return failure(started, 'creatorId is required');
      const trust = await ctx.runQuery(api.trust.get, {
        creatorId: creatorId as Id<'creators'>,
      });
      return {
        result: trust ?? { found: false },
        durationMs: Date.now() - started,
      };
    }

    return failure(started, `Unknown tool: ${name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed';
    return failure(started, message);
  }
}

// ─── Arg helpers (lightweight runtime checks) ─────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function stringArg(args: Record<string, unknown>, key: string): string | undefined {
  const raw = args[key];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function numberArg(args: Record<string, unknown>, key: string): number | undefined {
  const raw = args[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function failure(started: number, error: string): ToolExecution {
  return {
    result: { error },
    durationMs: Date.now() - started,
    error,
  };
}
