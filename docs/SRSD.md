# DigiPicks — Software Requirements Specification Document (SRSD)

**Product Name:** DigiPicks
**Version:** 1.0
**Last Updated:** 2026-05-09
**Companion Document:** [PRD.md](./PRD.md)

---

## 1. System Overview

DigiPicks is a realtime sports intelligence and creator economy platform focused on:

- Sports creators
- Premium subscriptions
- AI-powered insights
- Realtime event awareness
- Performance analytics
- Community collaboration
- Livestream engagement

The platform combines:

- Public discovery surfaces
- Creator dashboards
- Subscriber feeds
- Realtime sports intelligence
- AI-powered analytics
- Trust & verification systems
- Community tooling

---

## 2. System Architecture

### Frontend

- React
- Vite
- TypeScript
- Convex React
- Internal reusable component library (`@digipicks/ds`)
- Design-token-driven styling (`@digipicks/tokens`)

### Backend

- Convex realtime backend
- Convex functions/actions
- Convex database
- Realtime subscriptions
- WebSocket synchronization

---

## 3. Architectural Principles

### AP-001 — Realtime-First

All critical user-facing data shall support realtime synchronization where applicable.

### AP-002 — Component-First UI

The system shall use the internal reusable component library as the only approved UI composition layer.

### AP-003 — Design Token Enforcement

The system shall use centralized design tokens for all styling and visual behavior. Inline CSS and uncontrolled styling shall not be used.

### AP-004 — Thin Route Pages

Application pages shall compose reusable components and shall not contain direct business logic or uncontrolled visual implementation.

### AP-005 — Backend Source of Truth

Convex shall act as the primary source of truth for:

- Subscriptions
- Notifications
- Grading
- Analytics
- Permissions
- Realtime updates

---

## 4. Functional Modules

### FM-001 — Public Discovery

The system shall provide:

- Homepage with trending creators and featured picks
- Creator discovery with filtering, search, and sorting
- Sports events grouped by league with realtime status
- Live intelligence surfaces
- Featured/trending picks section

### FM-002 — Creator System

The system shall support:

- Creator onboarding via application form
- Creator verification with manual review workflow
- Creator monetization through subscription tiers
- Creator analytics (performance, subscribers, earnings)

### FM-003 — Realtime Publishing

The system shall allow creators to:

- Publish picks with event linking
- Publish premium and free content
- Schedule posts for future publication
- Distribute realtime updates to subscribers
- Save drafts before publishing

### FM-004 — Sports Intelligence

The system shall provide:

- Realtime odds from external providers
- Line movement tracking
- Event intelligence (status, scores, markets)
- Market update synchronization

### FM-005 — AI Intelligence

The system shall support:

- AI-generated summaries of pick reasoning
- Confidence scoring per pick
- Trend analysis across creator history
- Recommendation systems for subscriber discovery

### FM-006 — Community Layer

The system shall provide:

- Live chat within creator communities
- Realtime discussions linked to events
- Creator-subscriber direct messaging
- Livestream-linked interactions

### FM-007 — Livestream Integration

The system shall support:

- Twitch stream embeds
- YouTube Live embeds
- Kick integration
- Realtime livestream notifications
- Stream-linked community rooms

### FM-008 — Grading & Analytics

The system shall support:

- Grading lifecycle (pending → win/loss/push)
- Historical analytics with rolling windows
- ROI tracking per creator
- Streak tracking and record display
- Creator performance metrics (win rate, units, CLV)

### FM-009 — Monetization

The system shall support:

- Subscription tiers (free, premium, VIP)
- Premium content gating
- Referral systems
- Creator earnings tracking
- Payment processing (Stripe, with future Nordic providers)

### FM-010 — Notifications & Automation

The system shall support:

- Push notifications (web push)
- Discord integration for pick delivery
- Telegram integration for pick delivery
- Intelligent alerts (new picks, grading, line movement)
- Realtime delivery with retry handling

### FM-011 — Administration

The system shall support:

- Content moderation queue
- Creator application review workflow
- Fraud prevention rules
- Dispute resolution process
- Audit logging for all admin actions
- Compliance operations (GDPR export/delete)

---

## 5. Federated Event Engine — Expanded Requirements

### FR-EVT-001 — Provider-Agnostic Event Ingestion

The system shall support event ingestion from multiple external providers and normalize them into a common DigiPicks event model.

**Providers include:**

- SportsDataIO
- The Odds API
- API-SPORTS
- Sportradar
- Custom webhook sources

### FR-EVT-002 — Sport-Specific Source Support

The system shall support sport-specific event sources, including:

- Cricket-focused match sources (e.g. ESPNcricinfo-style coverage with live scores, scorecards, commentary, ball-by-ball context)
- Federation fixture lists (e.g. Norwegian Cricket Federation)
- Local league schedules
- Manually curated datasets

### FR-EVT-003 — Creator-Created Events

The system shall allow approved creators to create custom events when no provider event exists.

**Examples:**

- Local cricket league match
- Norwegian league match
- FIFA/eFootball tournament
- Private creator challenge
- Livestream prediction event
- Friendly/private matchup

### FR-EVT-004 — Admin Review for Custom Events

The system shall support moderation/review rules for creator-created events, especially when events are:

- Public
- Monetized
- Connected to paid picks

### FR-EVT-005 — Unified Event Behavior

All event types shall support the same platform capabilities where applicable:

- Picks attachment
- Odds (provider-sourced or manual)
- Grading
- Feeds
- Notifications
- Livestreams
- AI summaries
- Community rooms
- Analytics

### Event Source Types

```typescript
type EventSourceType =
  | "provider"       // Global data provider (SportsDataIO, Odds API)
  | "sport_source"   // Sport-specific media (ESPNcricinfo)
  | "federation"     // Federation/league source (Norwegian Cricket Federation)
  | "platform"       // DigiPicks editorial or admin-created
  | "creator"        // Creator-submitted event
  | "community";     // Prediction battle, challenge, competition
```

### Canonical Event Model

```typescript
type DigiPicksEvent = {
  id: string;
  sourceType: EventSourceType;
  providerName?: string;        // e.g. "the-odds-api", "espncricinfo"
  externalEventId?: string;     // Provider's native ID
  sourceUrl?: string;           // Link to source coverage

  createdByUserId?: string;     // For creator/community events
  reviewedByAdminId?: string;   // For moderated events

  title: string;
  sport: string;
  league?: string;
  competition?: string;

  participants: {
    name: string;
    type: "team" | "player" | "creator" | "custom";
  }[];

  startTime: number;
  endTime?: number;

  status:
    | "draft"
    | "scheduled"
    | "live"
    | "completed"
    | "cancelled"
    | "disputed";

  visibility: "public" | "premium" | "private";

  verificationStatus:
    | "unverified"
    | "creator_submitted"
    | "source_verified"
    | "admin_verified";

  resultSource:
    | "provider"
    | "manual_creator"
    | "manual_admin"
    | "community_confirmed";

  metadata?: Record<string, unknown>;
};
```

### Coverage Matrix

| Category | Examples |
|---|---|
| Global sports | EPL, Champions League, IPL, Grand Slams, Serie A |
| Niche sports | Table tennis, darts, esports, MMA |
| Local leagues | Norwegian cricket, regional football |
| Creator events | Livestream predictions, private matchups |
| Community events | Prediction battles, creator challenges |
| Tournaments | FIFA/eFootball, fantasy leagues |

---

## 6. Non-Functional Requirements

### NFR-001 — Performance

- Realtime updates must feel immediate (< 100ms perceived latency)
- Public pages must load in < 2 seconds (LCP)
- Feeds must support incremental/cursor-based loading
- Analytics queries must scale independently

### NFR-002 — Reliability

- Async retry mechanisms required for external provider calls
- Grading synchronization must handle provider downtime gracefully
- Notification delivery must include retry handling
- Event feed must be resilient to partial provider failures

### NFR-003 — Security

- Secure sessions required (httpOnly, sameSite)
- RBAC required for all mutations
- MFA support required for creator and admin accounts
- Audit logging required for all admin and moderation actions
- Rate limiting required on public APIs

### NFR-004 — Accessibility

- WCAG 2.1 AA compliance required
- Keyboard navigation required for all interactive elements
- Screen-reader support required
- Charts must have accessible alternatives

### NFR-005 — Scalability

The architecture must support growth in:

- Creators (1,000+)
- Subscribers (100,000+)
- Realtime event volume (1,000+ concurrent)
- Odds updates (10,000+ per minute during peak)
- Feed activity (high-frequency during live events)
- Notifications (burst delivery during grading)
- Livestream concurrency (multiple concurrent streams)

### NFR-006 — Data Integrity

- Pick grading history must be immutable once finalized
- Creator performance records must be independently verifiable
- Subscription state must be consistent with payment provider state
- Audit logs must be append-only

---

## 7. Data Model Summary

### Core Tables

| Table | Purpose |
|---|---|
| `users` | All platform users with role, locale, preferences |
| `creators` | Creator profiles with stats, verification, pricing |
| `picks` | Published picks with event linking, odds, grading |
| `events` | Sports events from federated sources |
| `subscriptions` | User-creator subscription relationships |
| `applications` | Creator verification applications |
| `notifications` | Platform notifications |
| `messages` | Creator-subscriber messaging |
| `audit` | Admin action audit trail |
| `categories` | Sport/league categorization |
| `files` | Uploaded media |

### Planned Tables

| Table | Purpose | Phase |
|---|---|---|
| `savedPicks` | User's saved/bookmarked picks | Phase 1 |
| `payouts` | Creator earnings and payout tracking | Phase 2 |
| `channels` | Creator community channels | Phase 3 |
| `oddsSnapshots` | Historical odds for line movement | Phase 5 |
| `streams` | Livestream metadata and status | Phase 6 |

---

## 8. Integration Points

| System | Purpose | Protocol |
|---|---|---|
| Stripe | Payment processing | Webhooks + API |
| The Odds API | Live odds and events | REST polling + cron |
| SportsDataIO | Extended event data | REST polling |
| ESPNcricinfo | Cricket match data | Scraping / RSS |
| Twitch API | Stream status | REST + Webhooks |
| YouTube Data API | Stream status | REST |
| Discord Webhooks | Pick notifications | Outbound webhooks |
| Telegram Bot API | Pick notifications | Outbound API |
| OpenAI / Anthropic | AI summaries and scoring | Actions API |

---

## 9. Glossary

| Term | Definition |
|---|---|
| **Pick** | A creator's published prediction on a sports event outcome |
| **Grading** | The process of marking a pick as win, loss, or push after the event concludes |
| **CLV** | Closing Line Value — the difference between the odds at pick time and the closing odds |
| **Units** | Standardized bet sizing measurement used to normalize performance across creators |
| **Edge** | A creator's analytical advantage in a specific market or sport |
| **Niche** | A creator's declared specialty area (e.g. "EPL Goalscorer Props") |
| **Federated Event** | An event sourced from any of the supported source types, normalized to the common event model |
