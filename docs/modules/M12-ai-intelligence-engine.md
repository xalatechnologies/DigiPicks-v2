# M12 — AI Intelligence Engine

## Purpose
Anthropic-backed analysis embedded across the platform. Persists a tight
summary, confidence score, and reasoning on every published pick. Provides
a co-write surface for creators while drafting. Future: trend detection,
anomaly flags, copilot.

## Target Roles
Creator · Customer · Admin · System

## Core Features
- Async pick analysis via `ai.analyzePick` (scheduled by `picks.create` on publish)
- Pre-publish co-write via `ai.suggestPick` (rate-limited)
- Persists `aiSummary`, `aiConfidence` (0–100), `aiReasoning`, `aiModel`, `aiAnalyzedAt`
- Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) — cost-efficient summarization
- Prompt-cached system prompt (cache_control: ephemeral) shared between both actions
- Strict JSON output enforced via the system prompt
- Quiet no-op when `ANTHROPIC_API_KEY` is missing — never breaks `picks.create` chain

## User Stories
- As a customer, I want a one-sentence AI take on every pick so I can scan fast.
- As a creator, I want AI to suggest a summary + confidence I can edit before publishing.
- As a customer, I want a confidence gauge that's calibrated independently of the creator's claim.
- As an admin, I want to know the AI is skeptical and never recommends gambling.

## Backend / Convex Build
**Tables**
- `picks.{aiSummary, aiConfidence, aiReasoning, aiAnalyzedAt, aiModel}` (extends picks)

**Queries**
- `ai._pickForAi` (internal) — fetch pick for the analyzer
- `ai._meForSuggest` (internal) — auth check for the public action

**Mutations**
- `picks._setAiAnalysis` (internal) — persist analyzer output

**Actions**
- `ai.analyzePick` (internal) — full pick analysis; called via scheduler on publish + scheduled-publish cron
- `ai.suggestPick` (public) — pre-publish co-write; rate-limited (5/10min) via `stripeCheckout` bucket

**Helpers** — `convex/shared/aiParse.ts`
- `parseAnalysis(text)` — robust JSON extraction with markdown-fence stripping

## Frontend Build
**Pages**
- `apps/web/src/dashboard/pages/CreatePick.tsx` — `AIAssistPanel` above the analysis textarea

**Components**
- `AIAssistPanel` (surface — empty / busy / populated states with Use / Re-roll / Dismiss)
- `AISummary` (surface — render the persisted summary on PickCard)
- `ConfidenceGauge` (atom — role=meter, ARIA-valuetext)
- `ConfidenceBar` (atom — compact variant)

## Testing
**Unit** — `convex/aiParse.test.ts`
- `parseAnalysis` handles strict JSON, JSON-in-markdown-fences, malformed output

**Integration**
- `picks.create` (status=published) → scheduler triggers `analyzePick` → `_setAiAnalysis` patches the pick
- Missing `ANTHROPIC_API_KEY` → `analyzePick` returns `{ skipped: true }` without throwing

**E2E**
- Creator opens CreatePick → sketch a pick → click "Suggest" → AIAssistPanel populates with summary + confidence + reasoning
- Click "Use suggestion" → body field pre-fills + creator confidence maps from numeric score (≥75 High, ≥50 Medium, else Low)

## Governance / Rules
- **Skeptical by design.** The system prompt says: confidence > 75 only if reasoning is clearly strong; if the body is thin, lower confidence and explain.
- **Never gambling advice.** System prompt: state analysis as analysis. Customer-facing UI labels AI output as "AI take" — distinct from creator's own claim.
- **Rate-limited per user** (5/10min) so Anthropic spend stays predictable. The same bucket is reused by Stripe checkout — both are spend vectors.
- **Graceful degradation.** Missing API key → quiet no-op return shape so the scheduler chain never blows up.
- **Prompt cache.** `cache_control: ephemeral` on the system block — both `analyzePick` and `suggestPick` share the same cached prompt to lower input-token cost.
