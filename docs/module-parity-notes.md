# Module parity notes (Phase D)

Spot-check of M01–M25 acceptance narratives against the codebase on `integration/digipicks-1-0`. See [`requirements-traceability-matrix.md`](requirements-traceability-matrix.md) for sign-off status.

## Shipped (no blocking gaps)

| Module                              | Evidence                                               |
| ----------------------------------- | ------------------------------------------------------ |
| M02–M12, M14–M19, M21–M23, M24, M25 | Convex modules + routes present; see matrix            |
| M20                                 | OAuth, interactions, outbound, inbound cron, studio UI |
| M04/M23                             | `events.ts`, creator events, admin review              |
| M05                                 | Dashboard create/publish, picks table                  |
| M07                                 | Stripe checkout, webhooks, subscriptions               |
| M17                                 | `/admin/*` portal, disputes, applications              |

## Partial (ticket before calling “done”)

| Module        | Gap                                          | Suggested ticket                                                    |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| M01           | **Support** role not in `users.role` union   | `ENG-001` — add read-only support role + admin UI or defer post-MVP |
| M13           | Visual “alert rule builder” vs prefs toggles | `ENG-002` — M13 alert-builder UX or document as N/A                 |
| M13/FM-010    | Browser push not end-to-end                  | `ENG-003` — service worker + `pushSubscriptions`                    |
| Cross-cutting | Authz spot-check on new mutations            | `ENG-004` — quarterly permissions audit                             |

## Deferred (approved waivers)

| Item                                    | Rationale                                                  |
| --------------------------------------- | ---------------------------------------------------------- |
| M20 slash-command bot                   | Full vision in discord-integration.md; MVP is cron + panel |
| Component / visual regression tests     | No Storybook runner; adopt in v1.1                         |
| E2E journeys 3–9                        | Require Convex + Stripe + seeded users in CI               |
| Legal page copy                         | Template text; legal review before prod                    |
| Sportradar / custom federation webhooks | FR-EVT optional providers; env-specific                    |

## BPMN (optional)

| Flow                                  | Status  | Notes                                            |
| ------------------------------------- | ------- | ------------------------------------------------ |
| BPMN-001–003 Registration / subscribe | N/A     | Covered by auth + Stripe; diagrams are reference |
| BPMN-007 Pick publishing              | Shipped | Creator studio + feed                            |
| BPMN-009 Custom event                 | Shipped | M23 admin review                                 |
| BPMN-011 Disputes                     | Shipped | Admin dispute queue + public trust page          |
| BPMN-012–014 Odds / grading / AI      | Shipped | Crons + grader + ai modules                      |

No BPMN file blocks release when matrix rows are resolved.
