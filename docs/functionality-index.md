Below is the DigiPicks functionality backlog, aligned with the PRD/SRSD, going all-in with React/Vite + Convex + custom component library + design tokens.

⸻

DigiPicks — Prioritized Functionality, Roles, User Stories & Technical Build Plan

1. Authentication, Identity & Roles

Target roles: Visitor, Customer, Creator, Admin, Support

User stories

- As a visitor, I want to create an account so I can follow creators and access premium content.
- As a creator, I want to log in and access my creator studio.
- As an admin, I want secure access with MFA so platform operations are protected.

Backend / Convex

- Tables: users, sessions, roles, userProfiles, authAccounts
- Functions:
  - auth.register
  - auth.login
  - auth.logout
  - users.getCurrentUser
  - auth.resolveUserRole
- Support role-based access at function level.
- Store role claims and verification state in Convex.

Frontend

- Pages:
  - login
  - register
  - onboarding
  - role-based redirect
- Components:
  - AuthLayout
  - LoginForm
  - RegisterForm
  - MfaChallenge
  - RoleRedirectGuard
- Must use custom component library only.

Tests

- Unit: validation, role resolution, auth guards
- Integration: login/register/session flow
- E2E:
  - visitor registers
  - creator logs in and reaches creator studio
  - admin-only route blocks customer

⸻

2. Realtime Convex Platform Foundation

Target roles: System-wide

User stories

- As a customer, I want feeds and alerts to update live.
- As a creator, I want subscribers to see new picks immediately.
- As an admin, I want operational changes to propagate instantly.

Backend / Convex

- Use Convex queries for realtime reads.
- Use mutations for domain writes.
- Use actions for external APIs.
- Use cron jobs for scheduled sync.
- Key shared patterns:
  - createdAt, updatedAt
  - audit metadata
  - status fields
  - soft delete
  - permission checks

Frontend

- Use Convex React hooks for live data.
- Avoid duplicating business logic in UI.
- Route pages only compose reusable blocks.

Tests

- Unit: domain validation
- Integration: mutation/query consistency
- E2E:
  - publish pick in creator view
  - customer feed updates without refresh

⸻

3. Custom Component Library & Design Token System

Target roles: Developers, Designers, all end users indirectly

User stories

- As a developer, I want reusable components so DigiPicks stays consistent.
- As a user, I want a polished and accessible interface.
- As a product owner, I want design tokens so styling is governed centrally.

Technical requirements

- No inline CSS.
- No inline styles.
- No page-level utility styling as primary UI implementation.
- All UI must use the DigiPicks custom component library.
- All styling must use design tokens.

Frontend

- Component categories:
  - layout primitives
  - dashboard shells
  - cards
  - forms
  - tables
  - charts
  - badges
  - modals
  - tabs
  - empty states
  - loading states
  - notification components
  - event cards
  - pick cards
  - creator cards
- Tokens:
  - color
  - spacing
  - typography
  - radius
  - elevation
  - status
  - chart palette
  - breakpoints

Backend

- Optional theme/config table:
  - designTokens
  - themeSettings
- Useful later for dark mode, branding, experiments.

Tests

- Unit: component props and variants
- Accessibility: keyboard navigation, labels, focus states
- Visual regression: component snapshots
- E2E:
  - main flows render using approved components
  - no broken responsive layouts

⸻

4. Provider-Agnostic Event Engine

Target roles: Visitor, Customer, Creator, Admin, System

User stories

- As a customer, I want to browse global sports events.
- As a creator, I want to create a custom FIFA tournament or local cricket match.
- As an admin, I want to review public custom events before they are monetized.
- As a system, I want to normalize events from multiple providers.

Backend / Convex

- Tables:
  - events
  - eventParticipants
  - eventSources
  - eventProviderMappings
  - eventReviewQueue
- Source types:
  - provider
  - sport_source
  - federation
  - platform
  - creator
  - community
- Functions:
  - events.createCustomEvent
  - events.importProviderEvents
  - events.search
  - events.updateStatus
  - events.reviewCustomEvent
- Support:
  - ESPN-style cricket references
  - Norwegian federation/local league events
  - private creator events
  - FIFA/eSports tournaments
  - livestream events

Frontend

- Components:
  - EventCard
  - EventSearch
  - EventCreateForm
  - EventSourceBadge
  - EventStatusBadge
  - EventTimeline
- Pages:
  - events discovery
  - event detail
  - creator event creation
  - admin event review

Tests

- Unit: event validation, source normalization
- Integration: provider import, creator event creation
- E2E:
  - creator creates custom event
  - admin approves event
  - creator attaches pick to event
  - customer sees event in feed

⸻

5. Picks & Publishing Engine

Target roles: Creator, Customer, Admin

User stories

- As a creator, I want to publish a premium pick tied to an event.
- As a creator, I want to save drafts and schedule posts.
- As a customer, I want to read picks I am entitled to.
- As an admin, I want to moderate misleading content.

Backend / Convex

- Tables:
  - posts
  - picks
  - pickOddsSnapshots
  - postDrafts
  - postAccessRules
- Functions:
  - posts.createDraft
  - posts.publish
  - picks.create
  - picks.attachToEvent
  - picks.lockAfterCutoff
  - posts.moderate
- Rules:
  - Event-linked picks lock after cutoff.
  - Premium content requires entitlement.
  - Published pick history must remain auditable.

Frontend

- Components:
  - PickComposer
  - PostEditor
  - EventPicker
  - AccessLevelSelector
  - OddsSnapshotInput
  - PublishPreview
- Pages:
  - creator posts
  - create pick
  - post detail
  - admin moderation queue

Tests

- Unit: pick validation, cutoff rules
- Integration: publish + entitlement + feed distribution
- E2E:
  - creator publishes premium pick
  - non-subscriber sees locked state
  - subscriber sees full content
  - late edit after event cutoff is blocked

⸻

6. Access Control & Entitlements

Target roles: Customer, Creator, Admin, System

User stories

- As a customer, I want premium content unlocked immediately after subscribing.
- As a creator, I want to map posts to specific subscription tiers.
- As an admin, I want to override access in support cases.

Backend / Convex

- Tables:
  - entitlements
  - accessRules
  - subscriptionAccess
  - manualAccessOverrides
- Functions:
  - access.canViewPost
  - access.grantEntitlement
  - access.revokeEntitlement
  - access.applyBillingStatus
  - access.adminOverride
- All access decisions must happen in Convex.

Frontend

- Components:
  - PremiumLock
  - EntitlementBadge
  - AccessRuleEditor
  - SubscriptionRequiredCTA
- UI receives access result from backend, not local calculation.

Tests

- Unit: entitlement rules
- Integration: billing status changes update access
- E2E:
  - canceled subscription removes future access
  - admin override restores access
  - expired customer cannot open premium post

⸻

7. Subscription, Billing & Monetization

Target roles: Customer, Creator, Admin, Support

User stories

- As a creator, I want to create paid subscription plans.
- As a customer, I want to subscribe and manage billing.
- As a support operator, I want to fix billing/access mismatches.

Backend / Convex

- Tables:
  - subscriptionPlans
  - subscriptions
  - billingCustomers
  - invoices
  - paymentEvents
  - creatorEarnings
- Functions:
  - plans.create
  - subscriptions.checkout
  - subscriptions.cancel
  - billing.handleWebhook
  - earnings.calculate
- Use idempotency for payment events.

Frontend

- Components:
  - PricingCard
  - CheckoutPanel
  - SubscriptionList
  - BillingHistory
  - CreatorEarningsSummary

Tests

- Unit: plan validation, billing status mapping
- Integration: webhook → subscription → entitlement
- E2E:
  - customer subscribes
  - content unlocks
  - customer cancels
  - renewal/end-date shown correctly

⸻

8. Creator Verification & Trust System

Target roles: Applicant Creator, Creator, Admin, Support

User stories

- As a creator, I want to apply with profile, niche, proof, and links.
- As an admin, I want to approve, reject, or request more information.
- As a customer, I want to see verified creators clearly.

Backend / Convex

- Tables:
  - creatorApplications
  - creatorProfiles
  - verificationRecords
  - creatorTrustScores
- Functions:
  - applications.submit
  - applications.review
  - creators.setVerificationStatus
  - trust.recalculateCreatorScore

Frontend

- Components:
  - CreatorApplicationForm
  - VerificationBadge
  - AdminApplicationReview
  - TrustScoreCard
- Pages:
  - apply as creator
  - creator profile
  - admin review queue

Tests

- Unit: application validation
- Integration: approval creates creator profile
- E2E:
  - applicant submits application
  - admin approves
  - creator badge appears publicly

⸻

9. Pick Grading & Performance Tracking

Target roles: Creator, Customer, Admin, System

User stories

- As a customer, I want to see whether picks won or lost.
- As a creator, I want transparent performance analytics.
- As an admin, I want regrading to be audited.

Backend / Convex

- Tables:
  - pickGrades
  - gradeHistory
  - creatorPerformance
  - customerTrackedPicks
- Grade states:
  - pending
  - win
  - loss
  - push
  - void
  - cancelled
  - disputed
- Functions:
  - grading.gradePick
  - grading.regradePick
  - performance.recalculateCreator
  - results.getCustomerResults

Frontend

- Components:
  - GradeBadge
  - PerformanceSummary
  - CreatorStatsPanel
  - CustomerResultsDashboard
  - GradeHistoryTimeline

Tests

- Unit: grading rules, metric calculations
- Integration: grade update triggers performance recalculation
- E2E:
  - pick graded as win
  - creator win rate updates
  - customer tracked results update
  - regrade creates audit history

⸻

10. Customer Feed & Discovery

Target roles: Customer, Visitor, Creator

User stories

- As a customer, I want a realtime feed from creators I follow or subscribe to.
- As a visitor, I want to browse creators and public picks.
- As a customer, I want to save posts and track plays.

Backend / Convex

- Tables:
  - feeds
  - feedItems
  - follows
  - savedItems
  - trackedPicks
- Functions:
  - feed.getPersonalized
  - feed.getPublic
  - saved.savePost
  - tracked.trackPick
- Feed ranking can start with chronological + priority weights.

Frontend

- Components:
  - FeedList
  - PickCard
  - CreatorCard
  - SavedButton
  - TrackPickButton
  - TrendingPanel

Tests

- Unit: feed filtering, access-aware feed logic
- Integration: published pick enters correct feeds
- E2E:
  - customer follows creator
  - creator publishes
  - feed updates live
  - customer saves post

⸻

11. Realtime Odds Intelligence

Target roles: Customer, Creator, Admin, System

User stories

- As a creator, I want to attach odds snapshots to picks.
- As a customer, I want to see line movement and market context.
- As the system, I want to support multiple odds providers without lock-in.

Backend / Convex

- Tables:
  - oddsProviders
  - oddsMarkets
  - oddsSnapshots
  - lineMovements
  - providerSyncLogs
- Functions:
  - odds.syncProvider
  - odds.getEventMarkets
  - odds.recordSnapshot
  - odds.detectMovement
- Provider adapters:
  - The Odds API
  - SportsDataIO
  - API-SPORTS
  - future enterprise providers

Frontend

- Components:
  - OddsTable
  - LineMovementChart
  - MarketBadge
  - OddsSnapshotCard

Tests

- Unit: odds normalization
- Integration: provider sync → normalized odds
- E2E:
  - event displays odds
  - line movement updates live
  - creator selects odds when publishing pick

⸻

12. AI Intelligence Engine

Target roles: Customer, Creator, Admin, System

User stories

- As a customer, I want AI summaries explaining why a pick is interesting.
- As a creator, I want AI-assisted writing and market context.
- As an admin, I want AI to flag suspicious creator behavior.

Backend / Convex

- Tables:
  - aiInsights
  - aiScores
  - aiPromptRuns
  - aiModerationFlags
- Functions/actions:
  - ai.generatePickSummary
  - ai.calculateConfidenceScore
  - ai.generateEventInsight
  - ai.detectAnomaly
- Store AI output with trace metadata:
  - model
  - input references
  - generatedAt
  - confidence
  - disclaimer state

Frontend

- Components:
  - AIInsightCard
  - ConfidenceScore
  - RiskBadge
  - AISummaryPanel
  - CreatorAIAssistPanel

Tests

- Unit: AI output schema validation
- Integration: pick publish triggers AI summary
- E2E:
  - creator requests AI assist
  - AI summary appears on pick
  - customer sees confidence/risk card

⸻

13. Notifications & Smart Alerts

Target roles: Customer, Creator, Admin, System

User stories

- As a customer, I want alerts when subscribed creators post.
- As a creator, I want subscribers notified when I go live.
- As a customer, I want odds movement alerts.

Backend / Convex

- Tables:
  - notifications
  - notificationPreferences
  - alertRules
  - deliveryLogs
- Functions:
  - notifications.create
  - notifications.markRead
  - alerts.createRule
  - alerts.evaluateRules
- Delivery channels:
  - in-app
  - email
  - Discord
  - Telegram
  - push later

Frontend

- Components:
  - NotificationBell
  - NotificationCenter
  - AlertRuleBuilder
  - PreferenceToggle

Tests

- Unit: preference filtering, alert rule evaluation
- Integration: publish pick → notification created
- E2E:
  - customer enables new-pick alerts
  - creator publishes
  - customer receives notification live

⸻

14. Community & Realtime Interaction

Target roles: Customer, Creator, Admin

User stories

- As a customer, I want to join live event discussions.
- As a creator, I want a private community for subscribers.
- As an admin, I want to moderate abusive chat.

Backend / Convex

- Tables:
  - communityRooms
  - roomMembers
  - messages
  - reactions
  - moderationFlags
- Functions:
  - rooms.create
  - rooms.join
  - messages.send
  - messages.moderate
  - rooms.getLiveMessages

Frontend

- Components:
  - LiveRoom
  - ChatMessageList
  - MessageComposer
  - ReactionBar
  - ModerationActionMenu

Tests

- Unit: room access rules
- Integration: subscriber-only room enforcement
- E2E:
  - customer joins event room
  - sends message
  - creator replies
  - admin removes flagged message

⸻

15. Livestream Integrations

Target roles: Creator, Customer, Admin

User stories

- As a creator, I want to attach a livestream to an event or pick session.
- As a customer, I want to watch live analysis and chat in the same experience.
- As an admin, I want to review stream metadata if it is public or monetized.

Backend / Convex

- Tables:
  - livestreams
  - streamSessions
  - streamEventLinks
  - streamNotifications
- Functions:
  - streams.create
  - streams.linkToEvent
  - streams.startSession
  - streams.notifySubscribers

Frontend

- Components:
  - LivestreamEmbed
  - StreamCard
  - LiveNowBadge
  - StreamLinkedChat
  - CreatorStreamPanel

Tests

- Unit: stream URL validation
- Integration: stream linked to event/room
- E2E:
  - creator schedules stream
  - customer receives live notification
  - stream room opens with chat

⸻

16. Creator Analytics Dashboard

Target roles: Creator, Admin

User stories

- As a creator, I want to see revenue, subscribers, engagement, and pick performance.
- As an admin, I want to monitor creator quality and risk.

Backend / Convex

- Tables:
  - creatorAnalyticsSnapshots
  - engagementEvents
  - revenueMetrics
  - retentionMetrics
- Functions:
  - analytics.getCreatorOverview
  - analytics.recalculateDaily
  - analytics.getSubscriberTrends

Frontend

- Components:
  - AnalyticsDashboard
  - MetricCard
  - RevenueChart
  - SubscriberTrendChart
  - PickPerformanceTable

Tests

- Unit: metric calculations
- Integration: engagement events update analytics
- E2E:
  - creator opens dashboard
  - metrics render correctly
  - date filter changes chart data

⸻

17. Admin Operations, Moderation & Fraud Prevention

Target roles: Admin, Support

User stories

- As an admin, I want to review creators, content, events, and disputes.
- As support, I want to resolve billing and access issues.
- As platform operator, I want every sensitive action audited.

Backend / Convex

- Tables:
  - adminActions
  - auditLogs
  - moderationCases
  - supportCases
  - fraudSignals
- Functions:
  - admin.reviewCreator
  - admin.moderateContent
  - admin.resolveDispute
  - audit.record
  - fraud.flagCreator

Frontend

- Components:
  - AdminShell
  - ReviewQueue
  - ModerationCaseCard
  - AuditTimeline
  - SupportActionPanel

Tests

- Unit: admin permission checks
- Integration: moderation action updates public visibility
- E2E:
  - admin suspends creator
  - creator content becomes hidden
  - audit log is created

⸻

18. Saved Library, Watchlists & Tracking

Target roles: Customer

User stories

- As a customer, I want to save creators and picks.
- As a customer, I want to track plays I care about.
- As a customer, I want watchlists for events or odds movement.

Backend / Convex

- Tables:
  - savedItems
  - watchlists
  - trackedPicks
  - trackedEvents
- Functions:
  - library.save
  - library.remove
  - watchlists.create
  - tracking.trackPick

Frontend

- Components:
  - SavedLibrary
  - WatchlistPanel
  - TrackedPickCard
  - SavedCreatorGrid

Tests

- Unit: duplicate save prevention
- Integration: saved item visibility with entitlement checks
- E2E:
  - customer saves pick
  - appears in library
  - customer removes it

⸻

19. Referral, Promotion & Growth Tools

Target roles: Creator, Admin

User stories

- As a creator, I want referral links so I can grow my audience.
- As a creator, I want promo campaigns for subscription offers.
- As an admin, I want to monitor referral abuse.

Backend / Convex

- Tables:
  - referralLinks
  - promoCampaigns
  - discountCodes
  - referralEvents
- Functions:
  - referrals.createLink
  - promos.create
  - promos.validate
  - growth.getCreatorStats

Frontend

- Components:
  - ReferralLinkManager
  - PromoCampaignForm
  - GrowthDashboard

Tests

- Unit: promo validation
- Integration: referral attribution
- E2E:
  - creator creates promo link
  - customer subscribes through link
  - referral attribution appears

⸻

20. External Integrations: Discord, Telegram, Streaming, Data Providers

Target roles: Creator, Customer, Admin, System

User stories

- As a creator, I want to send premium alerts to Discord.
- As a customer, I want Telegram alerts for new picks.
- As the platform, I want provider adapters that can be replaced safely.

Backend / Convex

- Tables:
  - integrations
  - integrationAccounts
  - webhookDeliveries
  - providerCredentials
- Functions/actions:
  - integrations.connectDiscord
  - integrations.sendDiscordAlert
  - integrations.connectTelegram
  - providers.syncEvents
  - providers.syncOdds

Frontend

- Components:
  - IntegrationCard
  - ConnectedAccountPanel
  - WebhookStatusList

Tests

- Unit: integration payload validation
- Integration: notification creates webhook delivery
- E2E:
  - creator connects Discord
  - publishes pick
  - Discord delivery status logged

⸻

Cross-Cutting Technical Standards

Backend standards

All Convex functions should enforce:

- authentication
- authorization
- input validation
- audit logging for sensitive actions
- idempotency where needed
- soft-delete where appropriate
- status-based lifecycle transitions

Frontend standards

All React/Vite pages must:

- use custom component library
- use design tokens
- remain thin
- avoid business logic duplication
- consume Convex queries/mutations/actions
- avoid inline CSS and uncontrolled styling

Test strategy

Minimum test layers:

- Unit tests for validation and domain logic
- Component tests for UI behavior
- Integration tests for Convex flows
- E2E tests for real user journeys
- Accessibility tests for major screens
- Visual regression tests for component library
- Permission tests for role-based access
- Realtime tests for live updates

Highest-priority E2E journeys

1. Visitor registers → becomes customer
2. Creator applies → admin approves → creator publishes
3. Customer subscribes → premium content unlocks
4. Creator publishes pick → customer feed updates live
5. Pick is graded → creator/customer analytics update
6. Creator creates custom event → admin approves → pick attaches
7. Customer saves/tracks pick → results dashboard updates
8. Creator starts livestream → subscribers notified
9. Admin suspends content → access removed and audit logged
10. Odds update arrives → event market updates live
