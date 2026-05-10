# M24 — AI Copilot & Conversational Intelligence

## Purpose
The next-generation AI surface beyond per-pick analysis (M12). A
conversational copilot that answers customer questions about creators,
events, and outcomes — and a creator-side assistant that helps draft,
analyze, and recap. **Status: planned. Foundation in place; copilot UI
+ multi-turn chat layer not yet built.**

## Target Roles
Customer · Creator · Admin · System (planned)

## Core Features (planned)
- Customer-side copilot: "How is [Creator] performing in NFL spreads this season?"
- Creator-side copilot: "Draft a recap of my last 10 picks"
- Multi-turn conversation history (per-user)
- Tool-use against live Convex queries (creators / picks / events / odds / trust)
- Streaming responses via Anthropic + Convex action streaming
- Per-conversation rate limiting (extends `stripeCheckout` bucket pattern)
- Confidence + caveat templates ("based on the last 30 days of graded picks…")

## User Stories
- As a customer, I want to ask "Who's the best NFL creator with 65%+ win rate this month?" and get a real answer.
- As a creator, I want to ask "What's my CLV trend?" and get a chart-backed summary.
- As an admin, I want the copilot to flag suspicious creator behavior in plain language.
- As the system, I want every copilot response to cite the underlying Convex query + timestamp.

## Backend / Convex Build (planned)
**Tables**
- `aiConversations` (userId, role, createdAt, lastMessageAt, summary, archivedAt)
- `aiMessages` (conversationId, role: 'user' | 'assistant' | 'tool', body, toolCall?, toolResult?, modelMetadata, createdAt)
- `aiToolCalls` (messageId, toolName, args, durationMs, error?, createdAt)

**Queries**
- `ai.copilot.listConversations` — user's chat history
- `ai.copilot.messages` — paginated by conversationId
- `ai.copilot.context` — pre-loads creator/event facts for grounding

**Mutations**
- `ai.copilot.startConversation`
- `ai.copilot.appendUserMessage`
- `ai.copilot._appendAssistantTurn` (internal — written by the action)
- `ai.copilot.archiveConversation`

**Actions**
- `ai.copilot.respond` — streams Anthropic response; iterates tool-use loop:
  - `lookupCreator(handle)` → `api.creators.getByHandle`
  - `creatorPerformance(creatorId, windowDays)` → derived from `picks.byCreator`
  - `eventDetails(eventId)` → `api.events.byId`
  - `creatorTrust(creatorId)` → `api.trust.get`
- Tool results re-fed to the model until completion or max iterations

## Frontend Build (planned)
**Pages**
- `apps/web/src/account/pages/Copilot.tsx` — customer chat UI
- `apps/web/src/dashboard/pages/CopilotStudio.tsx` — creator-side variant

**Components**
- `CopilotChat` (extends `ChatPanel` patterns), `ToolCallTrace` (debug-mode admin), `CitationFootnote`

## Testing (planned)
**Unit**
- Tool-call argument validators
- Citation injection into assistant responses

**Integration**
- Multi-turn loop: user asks → tool calls → assistant final → conversation persisted
- Rate-limit overflow → friendly "slow down" response

**E2E**
- Customer asks "Top NFL creators this month" → response cites top creators with win rate + sample size
- Creator asks "Last 5 graded picks" → response renders the picks with grades

## Governance / Rules (planned)
- **Citations mandatory.** Every assertion in an assistant response cites the Convex query + timestamp + sample size.
- **No fabricated stats.** If a tool call returns insufficient data, the model must say so explicitly.
- **Skeptical templates.** Confidence claims always paired with sample-size context ("based on 14 graded picks…").
- **Per-user rate limiter.** Conversational sessions can fan many tool calls — bucket by user, throttle aggressively.
- **Admin observability.** Tool-call traces stored in `aiToolCalls` for debugging + audit.
- **PII scrubbing.** User messages summarized before storage if they contain emails / payment info — hashed for retention.

## Build Status
**Today**
- `ai.analyzePick` + `ai.suggestPick` provide single-shot analysis (M12)
- Anthropic infrastructure live; prompt-cache configured
- Conversation table + multi-turn loop **not yet built**

**Next**
- Schema for `aiConversations` + `aiMessages` + `aiToolCalls`
- `ai.copilot.respond` action with tool-use loop
- DS `CopilotChat` surface
