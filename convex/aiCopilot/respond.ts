import { v } from 'convex/values';
import { action, type ActionCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import { rateLimiter } from '../shared/rateLimit';
import { withRetry } from '../shared/retry';
import {
  buildSystemPrompt,
  COPILOT_MODEL,
  MAX_ITERATIONS,
  MAX_OUTPUT_TOKENS,
  MAX_PARALLEL_TOOLS,
} from './prompt';
import { TOOL_DEFINITIONS, executeTool, type ToolExecution } from './tools';

// =============================================================================
// AI Copilot — multi-turn responder action (M24).
//
// Single entry point the UI calls after `appendUserMessage`. Drives a
// streaming Anthropic call, runs any tool_use blocks the model emits,
// and finalizes the assistant turn into the empty streaming row that the
// UI is already subscribed to.
//
// Architectural invariants:
//   - Always exits via `_finalizeStreamingTurn` once a streaming row is
//     opened — no row may be left with `streaming: true`.
//   - All Anthropic calls retried on 5xx via `withRetry`.
//   - Rate-limited via the per-user `aiCopilot` bucket. A denied turn
//     records the refusal as an assistant message so the UI shows context.
// =============================================================================

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const TOOL_RESULT_PREVIEW_LIMIT = 500;

// ─── Anthropic wire shapes ─────────────────────────────────────────────────

type AnthropicTextBlock = { type: 'text'; text: string };
type AnthropicToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};
type AnthropicToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};
type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock | AnthropicToolResultBlock;

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

interface FinalAnthropicResponse {
  content: AnthropicContentBlock[];
  stop_reason: string | null;
  model: string;
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

interface ToolCallRecord {
  toolName: string;
  args: unknown;
  resultPreview?: string;
  durationMs: number;
  error?: string;
}

interface CitationEntry {
  kind: string;
  id: string;
  label: string;
  tool?: string;
  sampleSize?: number;
  at?: number;
}

interface ModelMetadata {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
}

// ─── Action ─────────────────────────────────────────────────────────────────

export const respond = action({
  args: {
    conversationId: v.id('aiConversations'),
    userMessageId: v.optional(v.id('aiMessages')),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    messageId: Id<'aiMessages'>;
    stopReason: string;
  }> => {
    // 1. Identity + ownership.
    const me: Doc<'users'> | null = await ctx.runQuery(internal.ai._meForSuggest, {});
    if (!me) throw new Error('Unauthorized');

    const loaded = await ctx.runQuery(internal.aiCopilot.queries._loadForRespond, {
      conversationId: args.conversationId,
    });
    const conv = loaded.conversation;
    if (!conv) throw new Error('Conversation not found');
    if (conv.userId !== me._id) throw new Error('Forbidden');

    // 2. Per-user rate limit. A denied turn lands as an assistant message
    //    so the user sees the cap with context, not a silent failure.
    const limit = await rateLimiter.limit(ctx, 'aiCopilot', {
      key: me._id,
      throws: false,
    });
    if (!limit.ok) {
      const messageId = await ctx.runMutation(internal.aiCopilot.mutations._appendAssistantTurn, {
        conversationId: args.conversationId,
        body: "You've used your copilot allowance for this hour — try again later.",
        modelMetadata: { model: COPILOT_MODEL },
        toolCalls: [],
        iter: 1,
        stopReason: 'rate_limited',
      });
      return { messageId, stopReason: 'rate_limited' };
    }

    // 3. Open the streaming row up front so the UI has a target the moment
    //    the action returns the messageId. Everything after this point must
    //    finalize via `_finalizeStreamingTurn`.
    const streamingMessageId: Id<'aiMessages'> = await ctx.runMutation(
      internal.aiCopilot.mutations._startStreamingTurn,
      {
        conversationId: args.conversationId,
        iter: 1,
      },
    );

    try {
      const result = await runToolLoop(ctx, conv, loaded.messages, streamingMessageId);
      await ctx.runMutation(internal.aiCopilot.mutations._finalizeStreamingTurn, {
        messageId: streamingMessageId,
        body: result.body,
        citations: result.citations.length > 0 ? result.citations : undefined,
        modelMetadata: result.modelMetadata,
        toolCalls: result.toolCalls,
        stopReason: result.stopReason,
      });
      return { messageId: streamingMessageId, stopReason: result.stopReason };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected copilot error';
      await ctx.runMutation(internal.aiCopilot.mutations._finalizeStreamingTurn, {
        messageId: streamingMessageId,
        body: "I hit an unexpected error and couldn't complete that response. Please try again in a moment.",
        modelMetadata: { model: COPILOT_MODEL },
        toolCalls: [],
        stopReason: 'error',
      });
      console.error('[aiCopilot.respond] failed:', message);
      return { messageId: streamingMessageId, stopReason: 'error' };
    }
  },
});

// ─── Tool loop ─────────────────────────────────────────────────────────────

interface LoopResult {
  body: string;
  citations: CitationEntry[];
  toolCalls: ToolCallRecord[];
  modelMetadata: ModelMetadata;
  stopReason: string;
}

async function runToolLoop(
  ctx: ActionCtx,
  conv: Doc<'aiConversations'>,
  history: Doc<'aiMessages'>[],
  streamingMessageId: Id<'aiMessages'>,
): Promise<LoopResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      body: 'The copilot is not configured in this environment (missing ANTHROPIC_API_KEY).',
      citations: [],
      toolCalls: [],
      modelMetadata: { model: COPILOT_MODEL },
      stopReason: 'error',
    };
  }

  const systemPrompt = buildSystemPrompt(conv.persona);
  const messages = buildSeedMessages(history);

  const aggregateToolCalls: ToolCallRecord[] = [];
  const modelMetadata: ModelMetadata = { model: COPILOT_MODEL };

  for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
    const response = await callAnthropic({
      apiKey,
      systemPrompt,
      messages,
      streamingMessageId,
      ctx,
    });

    modelMetadata.model = response.model;
    if (response.usage.input_tokens !== undefined) {
      modelMetadata.inputTokens = response.usage.input_tokens;
    }
    if (response.usage.output_tokens !== undefined) {
      modelMetadata.outputTokens = response.usage.output_tokens;
    }
    if (response.usage.cache_read_input_tokens !== undefined) {
      modelMetadata.cacheReadTokens = response.usage.cache_read_input_tokens;
    }

    const toolUses = response.content.filter(
      (b): b is AnthropicToolUseBlock => b.type === 'tool_use',
    );
    const textOut = response.content
      .filter((b): b is AnthropicTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    if (response.stop_reason === 'tool_use' && toolUses.length > 0) {
      // Echo the assistant's tool_use blocks back so Anthropic sees the
      // tool_result blocks in the next turn as a response to its own call.
      messages.push({ role: 'assistant', content: response.content });

      const resultBlocks: AnthropicToolResultBlock[] = [];
      // Cap parallel fan-out so a single iteration can't spawn an
      // unbounded number of concurrent ctx.runQuery calls.
      for (let i = 0; i < toolUses.length; i += MAX_PARALLEL_TOOLS) {
        const slice = toolUses.slice(i, i + MAX_PARALLEL_TOOLS);
        const executed = await Promise.all(slice.map((tu) => executeTool(ctx, tu.name, tu.input)));
        slice.forEach((tu, idx) => {
          const exec = executed[idx];
          aggregateToolCalls.push(recordExecution(tu.name, tu.input, exec));
          if (exec.error) {
            resultBlocks.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify({ error: exec.error }),
              is_error: true,
            });
          } else {
            resultBlocks.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify(exec.result),
            });
          }
        });
      }

      messages.push({ role: 'user', content: resultBlocks });
      continue;
    }

    // Terminal turn — extract citations from the model's output and return.
    const { body, citations } = parseOutputAndCitations(textOut);
    return {
      body: body.trim() || "I don't have enough data to answer that yet.",
      citations,
      toolCalls: aggregateToolCalls,
      modelMetadata,
      stopReason: response.stop_reason ?? 'end_turn',
    };
  }

  // Max iterations exhausted without an end_turn.
  return {
    body: "I couldn't complete this in time — try narrowing the question or asking about one creator at a time.",
    citations: [],
    toolCalls: aggregateToolCalls,
    modelMetadata,
    stopReason: 'max_iters',
  };
}

// ─── Anthropic call (streaming SSE) ────────────────────────────────────────

interface AnthropicCallArgs {
  apiKey: string;
  systemPrompt: string;
  messages: AnthropicMessage[];
  streamingMessageId: Id<'aiMessages'>;
  ctx: ActionCtx;
}

async function callAnthropic(args: AnthropicCallArgs): Promise<FinalAnthropicResponse> {
  return await withRetry(() => callAnthropicOnce(args), {
    maxAttempts: 3,
    label: 'aiCopilot.anthropic',
    shouldRetry: (err) => {
      if (!(err instanceof Error)) return false;
      const msg = err.message;
      // Retry on 5xx + transient network. Do NOT retry on 4xx — those are
      // configuration / auth errors that won't fix themselves.
      return (
        /\b(500|502|503|504|520|521|522|524)\b/.test(msg) ||
        /timeout|fetch failed|network|econnreset/i.test(msg)
      );
    },
  });
}

async function callAnthropicOnce(args: AnthropicCallArgs): Promise<FinalAnthropicResponse> {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': args.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: COPILOT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: 'text',
          text: args.systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: TOOL_DEFINITIONS,
      messages: args.messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errBody.slice(0, 300)}`);
  }

  return await consumeStream(res, args.streamingMessageId, args.ctx);
}

/**
 * Consume Anthropic's SSE stream, patch streamingBuffer on each text_delta,
 * and reconstruct the final response shape from the accumulated events.
 *
 * We deliberately don't use any SSE library — Convex actions ship plain
 * `fetch`, and the stream format is small enough to parse inline.
 */
async function consumeStream(
  res: Response,
  streamingMessageId: Id<'aiMessages'>,
  ctx: ActionCtx,
): Promise<FinalAnthropicResponse> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('Anthropic returned an empty stream');
  const decoder = new TextDecoder();

  let model = COPILOT_MODEL;
  let stopReason: string | null = null;
  const usage: FinalAnthropicResponse['usage'] = {};

  type BlockState =
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; partialJson: string };
  const blocks: Record<number, BlockState> = {};

  let buffered = '';
  // Best-effort streaming patches don't need to wait on each other, so we
  // chain them through this promise and await it once at the end.
  let pendingPatches: Promise<unknown> = Promise.resolve();

  const handleEvent = (event: string, data: string) => {
    if (!data) return;
    let parsed: any;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }

    if (event === 'message_start' && parsed.message) {
      model = parsed.message.model ?? model;
      const u = parsed.message.usage ?? {};
      if (u.input_tokens !== undefined) usage.input_tokens = u.input_tokens;
      if (u.cache_read_input_tokens !== undefined) {
        usage.cache_read_input_tokens = u.cache_read_input_tokens;
      }
    } else if (event === 'content_block_start') {
      const idx = parsed.index as number;
      const cb = parsed.content_block;
      if (cb?.type === 'text') {
        blocks[idx] = { type: 'text', text: '' };
      } else if (cb?.type === 'tool_use') {
        blocks[idx] = {
          type: 'tool_use',
          id: cb.id,
          name: cb.name,
          partialJson: '',
        };
      }
    } else if (event === 'content_block_delta') {
      const idx = parsed.index as number;
      const delta = parsed.delta;
      const block = blocks[idx];
      if (!block) return;
      if (delta?.type === 'text_delta' && block.type === 'text') {
        block.text += delta.text;
        // Best-effort streaming patch — swallow errors so a transient
        // mutation hiccup never aborts the SSE stream.
        const chunk = delta.text as string;
        pendingPatches = pendingPatches.then(() =>
          ctx
            .runMutation(internal.aiCopilot.mutations._appendStreamChunk, {
              messageId: streamingMessageId,
              chunk,
            })
            .catch(() => {}),
        );
      } else if (delta?.type === 'input_json_delta' && block.type === 'tool_use') {
        block.partialJson += delta.partial_json ?? '';
      }
    } else if (event === 'message_delta') {
      if (parsed.delta?.stop_reason !== undefined) {
        stopReason = parsed.delta.stop_reason;
      }
      const u = parsed.usage ?? {};
      if (u.output_tokens !== undefined) usage.output_tokens = u.output_tokens;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    let separator: number;
    while ((separator = buffered.indexOf('\n\n')) !== -1) {
      const rawEvent = buffered.slice(0, separator);
      buffered = buffered.slice(separator + 2);
      let eventName = 'message';
      const dataLines: string[] = [];
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }
      handleEvent(eventName, dataLines.join('\n'));
    }
  }

  await pendingPatches;

  // Reassemble final blocks in their original order.
  const indices = Object.keys(blocks)
    .map((k) => Number(k))
    .sort((a, b) => a - b);
  const content: AnthropicContentBlock[] = [];
  for (const idx of indices) {
    const block = blocks[idx];
    if (block.type === 'text') {
      content.push({ type: 'text', text: block.text });
    } else {
      let input: Record<string, unknown> = {};
      try {
        input = block.partialJson ? JSON.parse(block.partialJson) : {};
      } catch {
        input = { _parseError: true, _raw: block.partialJson };
      }
      content.push({
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input,
      });
    }
  }

  return {
    content,
    stop_reason: stopReason,
    model,
    usage,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function buildSeedMessages(history: Doc<'aiMessages'>[]): AnthropicMessage[] {
  // Translate persisted messages into Anthropic's shape. We only emit
  // user / assistant text turns from the transcript — tool_use / tool_result
  // pairings live inside the live action invocation, not across turns.
  const out: AnthropicMessage[] = [];
  for (const m of history) {
    if (m.streaming) continue; // skip the row currently being streamed into
    if (m.role === 'user' && m.body) {
      out.push({ role: 'user', content: m.body });
    } else if (m.role === 'assistant' && m.body) {
      out.push({ role: 'assistant', content: m.body });
    }
  }
  return out;
}

function recordExecution(toolName: string, args: unknown, exec: ToolExecution): ToolCallRecord {
  const preview = (() => {
    try {
      const json = JSON.stringify(exec.error ? { error: exec.error } : exec.result);
      return json.length > TOOL_RESULT_PREVIEW_LIMIT
        ? json.slice(0, TOOL_RESULT_PREVIEW_LIMIT) + '…'
        : json;
    } catch {
      return undefined;
    }
  })();
  return {
    toolName,
    args,
    resultPreview: preview,
    durationMs: exec.durationMs,
    error: exec.error,
  };
}

const CITATION_FENCE_RE = /```citations\s*([\s\S]*?)```/i;

interface ParsedOutput {
  body: string;
  citations: CitationEntry[];
}

function parseOutputAndCitations(raw: string): ParsedOutput {
  const match = raw.match(CITATION_FENCE_RE);
  if (!match) return { body: raw, citations: [] };

  const fenceContent = match[1].trim();
  const body = (raw.slice(0, match.index!) + raw.slice(match.index! + match[0].length)).trim();

  let citations: CitationEntry[] = [];
  try {
    const parsed = JSON.parse(fenceContent);
    if (Array.isArray(parsed)) {
      citations = parsed.map(normalizeCitation).filter((c): c is CitationEntry => c !== null);
    }
  } catch {
    citations = [];
  }
  return { body, citations };
}

function normalizeCitation(raw: unknown): CitationEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const kind = typeof obj.kind === 'string' ? obj.kind : null;
  const id = typeof obj.id === 'string' ? obj.id : null;
  const label = typeof obj.label === 'string' ? obj.label : null;
  if (!kind || !id || !label) return null;
  const out: CitationEntry = { kind, id, label };
  if (typeof obj.tool === 'string') out.tool = obj.tool;
  if (typeof obj.sampleSize === 'number' && Number.isFinite(obj.sampleSize)) {
    out.sampleSize = obj.sampleSize;
  }
  if (typeof obj.at === 'number' && Number.isFinite(obj.at)) out.at = obj.at;
  return out;
}
