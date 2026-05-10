# DigiPicks — BPMN Workflows

This folder is the **single source of truth** for DigiPicks workflows. Each
file describes one core workflow as architecture documentation, not just
business documentation. They reflect Convex realtime semantics
(queries / mutations / actions / scheduled fanout) — not REST request
chains.

> **Authoring rule:** one BPMN per workflow. No mega-diagrams. If a
> workflow needs more than ~25 nodes to express clearly, split it.

---

## Documentation standard

Every file in this folder uses the same structure:

1. **Purpose** — one sentence: what workflow this represents.
2. **Trigger** — what kicks it off (UI action, cron, webhook, event).
3. **Preconditions** — required system state (auth, role, data).
4. **Actors / Swimlanes** — every participant. Convex backend, AI engine,
   notification service, and external providers count as actors.
5. **Main flow** — Mermaid `flowchart TD` with swimlanes via
   `subgraph`. Happy path only.
6. **Alternative flows** — failures, retries, manual review branches.
7. **Postconditions** — resulting system state (which tables changed,
   which entitlements granted/revoked, which audit rows written).
8. **Realtime events** — which Convex queries auto-update as a result.
9. **AI interactions** — optional Claude calls (model, tool-use loop, etc.).
10. **Module mapping** — links to the modules in
    [`docs/modules/`](../modules/) that own this workflow.

---

## Mermaid conventions

- Use `flowchart TD` for branching workflows.
- Use `sequenceDiagram` only when the timeline is the point (rare).
- Each actor gets one `subgraph` — that subgraph is the swimlane.
- Convex tables are drawn as `[(tableName)]` (cylinders).
- Convex actions / cron jobs are drawn as `{{action.name}}`.
- External services use `[/External: name/]`.
- Dotted arrows (`-.->`) represent **scheduled / async fanout**
  (`ctx.scheduler.runAfter`, cron triggers).
- Solid arrows represent synchronous mutations / queries inside the
  same request.

---

## Index

### Visitor & customer

| ID                                               | Title                           | Priority |
| ------------------------------------------------ | ------------------------------- | -------- |
| [BPMN-001](./BPMN-001-visitor-registration.md)   | Visitor registration flow       | High     |
| [BPMN-002](./BPMN-002-visitor-to-subscriber.md)  | Visitor → subscriber conversion | Critical |
| [BPMN-003](./BPMN-003-subscription-lifecycle.md) | Customer subscription lifecycle | Critical |
| [BPMN-004](./BPMN-004-feed-consumption.md)       | Customer feed consumption       | High     |
| [BPMN-005](./BPMN-005-watchlists-tracking.md)    | Customer tracking & watchlists  | High     |

### Creator

| ID                                             | Title                              | Priority |
| ---------------------------------------------- | ---------------------------------- | -------- |
| [BPMN-006](./BPMN-006-creator-verification.md) | Creator application & verification | Critical |
| [BPMN-007](./BPMN-007-pick-publishing.md)      | Creator pick publishing            | Critical |
| [BPMN-008](./BPMN-008-livestream.md)           | Creator livestream workflow        | High     |
| [BPMN-009](./BPMN-009-custom-event.md)         | Creator custom event creation      | Critical |

### Admin

| ID                                   | Title                                | Priority |
| ------------------------------------ | ------------------------------------ | -------- |
| [BPMN-010](./BPMN-010-moderation.md) | Moderation & review workflow         | High     |
| [BPMN-011](./BPMN-011-disputes.md)   | Fraud detection & dispute resolution | High     |

### System / AI

| ID                                                   | Title                         | Priority |
| ---------------------------------------------------- | ----------------------------- | -------- |
| [BPMN-012](./BPMN-012-odds-sync.md)                  | Realtime odds synchronization | High     |
| [BPMN-013](./BPMN-013-pick-grading.md)               | Pick grading workflow         | Critical |
| [BPMN-014](./BPMN-014-ai-intelligence.md)            | AI intelligence pipeline      | High     |
| [BPMN-015](./BPMN-015-notification-orchestration.md) | Notification orchestration    | Critical |

### Architecture

| ID                                        | Title                    | Priority |
| ----------------------------------------- | ------------------------ | -------- |
| [BPMN-016](./BPMN-016-event-lifecycle.md) | Realtime event lifecycle | Critical |

---

## Linking from PRD / SRSD / modules

When a module doc in [`docs/modules/`](../modules/) references a workflow,
it should link back here by ID. Likewise, every BPMN file ends with a
**Module mapping** section pointing back at `M01–M25`. This keeps the
two-way mapping explicit and makes onboarding traceable.

---

## How to render

GitHub renders Mermaid blocks natively. For local previews:

```bash
# any of:
npx -y @mermaid-js/mermaid-cli -i docs/bpmn/BPMN-007-pick-publishing.md -o /tmp/bpmn-007.svg
# or open in VS Code with the Mermaid Preview extension
```

---

## Why we do not author BPMN XML

Hand-authoring BPMN 2.0 XML in a repo is high-friction and the rendering
toolchain is heavier than it needs to be. Mermaid `flowchart` blocks
capture the swimlane semantics we care about (actors, gateways, async
fanout) with zero extra build step, and they live as plain text alongside
the code that implements them. If a future business analyst needs true
BPMN 2.0 XML, the Mermaid sources in this folder are easy to translate.
