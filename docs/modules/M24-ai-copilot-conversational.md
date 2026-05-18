# M24 — AI Copilot & Conversational Intelligence

## Purpose

The conversational layer beyond per-pick analysis (M12). Customers ask questions about creators, events, and outcomes; creators get studio-side drafting and performance context. **Status: shipped** (backend + subscriber and creator UIs). Optional enhancements (streaming UX, admin tool-trace UI) remain incremental.

## Target Roles

Customer · Creator · Admin · System

## Core Features (shipped)

- Customer-side copilot at `/account/copilot` (`apps/web/src/account/pages/Copilot.tsx`)
- Creator-side copilot at `/dashboard/copilot` (`apps/web/src/dashboard/pages/Copilot.tsx`, export `CreatorCopilot`)
- Multi-turn conversation history per user (`aiConversations`, `aiMessages`, `aiToolCalls` in [`convex/schema.ts`](../../convex/schema.ts))
- Tool-use against Convex data via `convex/aiCopilot/respond.ts` and related modules
- Optional “Show tool trace” in UI for power users
- Rate limiting and governance patterns extend platform primitives (see `aiCopilot` mutations/actions)

## Planned / incremental enhancements

- Response streaming via Anthropic + Convex action streaming (if not already wired end-to-end)
- Dedicated admin observability UI for tool-call traces (data may exist in `aiToolCalls`)
- Stronger citation footnotes in the DS chat surface for every statistical claim

## User Stories

- As a customer, I want to ask "Who's the best NFL creator with 65%+ win rate this month?" and get a grounded answer.
- As a creator, I want to ask "What's my CLV trend?" and get a summary tied to real pick data.
- As an admin, I want the copilot to flag suspicious creator behavior in plain language (future depth).
- As the system, I want copilot responses grounded in Convex queries with trace metadata where enabled.

## Backend / Convex Build (shipped)

**Tables** — see `convex/schema.ts`: `aiConversations`, `aiMessages`, `aiToolCalls` (names may match `aiCopilot` module conventions).

**Module folder:** `convex/aiCopilot/` — queries, mutations, tools, scrub, respond pipeline.

**Actions** — e.g. `aiCopilot.respond.respond` orchestrates model + tool loop.

## Frontend Build (shipped)

**Pages**

- `apps/web/src/account/pages/Copilot.tsx` — subscriber chat
- `apps/web/src/dashboard/pages/Copilot.tsx` — creator studio (`CreatorCopilot`)

**Components**

- `CopilotChat` from `@digipicks/ds` for the transcript UI

## Testing

**Unit / integration**

- `convex/aiCopilot/scrub.test.ts` and related tests — expand as behavior grows.

**E2E (deferred platform-wide)**

- Customer and creator copilot happy paths should join the golden journeys in [`docs/functionality-index.md`](../functionality-index.md).

## Governance / Rules

- **Citations and honesty.** Assertions should align with tool results; expand templates as product tightens copy.
- **Per-user rate limiting.** Conversational sessions must not bypass existing rate-limit buckets.
- **PII scrubbing.** `scrub` pipeline — see `convex/aiCopilot/scrub.ts`.

## Build Status

**Shipped**

- Schema + `aiCopilot` Convex module + account and dashboard routes + DS chat.

**Next (optional)**

- Streaming responses, admin trace dashboard, stricter citation UI.
