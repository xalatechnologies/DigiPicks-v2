import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { withRetry } from './shared/retry';

// =============================================================================
// Telegram Bot delivery (PRD M14, FM-010).
//
// Each user opts in by linking a Telegram chat through the bot. The link
// flow: user pastes a per-account `telegramLinkCode` to the bot, the
// /start handler in users.confirmTelegramLink writes telegramChatId.
//
// Required env vars:
//   - TELEGRAM_BOT_TOKEN  bot HTTP API token from @BotFather
// =============================================================================

const TG_API = 'https://api.telegram.org';

export const sendToChat = internalAction({
  args: {
    chatId: v.string(),
    text: v.string(),
    /** Markdown formatting variant — defaults to MarkdownV2. */
    parseMode: v.optional(
      v.union(v.literal('Markdown'), v.literal('MarkdownV2'), v.literal('HTML')),
    ),
    disablePreview: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.log('TELEGRAM_BOT_TOKEN not set — skipping Telegram dispatch');
      return { ok: false as const, reason: 'not-configured' };
    }

    const url = `${TG_API}/bot${token}/sendMessage`;
    const params = new URLSearchParams({
      chat_id: args.chatId,
      text: args.text,
      parse_mode: args.parseMode ?? 'MarkdownV2',
      disable_web_page_preview: String(args.disablePreview ?? false),
    });

    try {
      const res = await withRetry(
        () =>
          fetch(`${url}?${params.toString()}`, {
            method: 'POST',
          }),
        { label: 'telegram sendMessage', maxAttempts: 3 },
      );
      const json = (await res.json()) as { ok: boolean; description?: string };
      if (!json.ok) {
        console.warn(
          `Telegram sendMessage failed for chat ${args.chatId}: ${json.description}`,
        );
        return { ok: false as const, reason: json.description ?? 'unknown' };
      }
      return { ok: true as const };
    } catch (err) {
      console.error(
        `Telegram dispatch error for chat ${args.chatId}:`,
        err instanceof Error ? err.message : err,
      );
      return { ok: false as const, reason: 'fetch-failed' };
    }
  },
});

/** MarkdownV2 escaper — Telegram requires every reserved char escaped. */
export function escapeMarkdownV2(s: string): string {
  return s.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}
