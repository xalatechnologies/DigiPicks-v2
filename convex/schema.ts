import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import {
  role,
  listingStatus,
  listingType,
  paymentMode,
  creatorStatus,
  pickAccess,
  pickConfidence,
  pickStatus,
  pickGrade,
  subscriptionPlan,
  subscriptionStatus,
  applicationStatus,
  eventStatus,
  eventSourceType,
  eventVisibility,
  eventVerificationStatus,
  eventResultSource,
  eventParticipantType,
  orderStatus,
  paymentProvider,
  payoutStatus,
  channelType,
} from './shared/validators';

// =============================================================================
// DigiPicks Schema v2 — Production SaaS Foundation
//
// Domain tables: creators, picks, events, subscriptions, applications
// Platform tables: users, tenants, memberships, categories, listings,
//                  listingMedia, favorites, conversations, messages,
//                  orders, notifications, auditLogs
// =============================================================================

export default defineSchema({
  // Convex Auth managed tables
  ...authTables,
  // ═══════════════════════════════════════════════════════════════════════════
  // PLATFORM — Users, tenants, memberships
  // ═══════════════════════════════════════════════════════════════════════════

  // Override authTables.users with our custom fields merged with auth-required fields
  users: defineTable({
    // ── Convex Auth required fields ──
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // ── DigiPicks custom fields ──
    role: v.optional(role),
    locale: v.optional(v.union(v.literal('nb'), v.literal('en'))),
    isActive: v.optional(v.boolean()),
    creatorId: v.optional(v.id('creators')),
    stripeCustomerId: v.optional(v.string()),
    // ── Discord (OAuth identity) ──
    discordId: v.optional(v.string()),
    discordUsername: v.optional(v.string()),
    // ── Notification delivery preferences (Phase 9, FM-010) ──
    // Per-channel toggles + Telegram chat link. Discord webhook is per-creator
    // (creators.discordWebhookUrl), not per-user.
    notifyPrefs: v.optional(
      v.object({
        push: v.optional(v.boolean()),
        telegram: v.optional(v.boolean()),
        /** Email channel — default off (opt-in, since email is unsolicited
         *  from the user's view). Lifecycle kinds (welcome / subscription_*)
         *  bypass this toggle so transactional mails always send. */
        email: v.optional(v.boolean()),
        // Per-kind toggles — default true.
        pickPublished: v.optional(v.boolean()),
        pickGraded: v.optional(v.boolean()),
        lineMoved: v.optional(v.boolean()),
        /** Quiet hours — when set, push + telegram dispatches inside the
         *  window are deferred to the next allowed minute. Email + in-app
         *  inbox still fire immediately. Times are HH:MM (24h) in the
         *  user's timezone (`quietHoursTimezone`, defaults to 'UTC').
         *  Lifecycle kinds bypass quiet hours. */
        quietHoursStart: v.optional(v.string()),
        quietHoursEnd: v.optional(v.string()),
        quietHoursTimezone: v.optional(v.string()),
      }),
    ),
    telegramChatId: v.optional(v.string()),
    telegramLinkCode: v.optional(v.string()),
    telegramLinkedAt: v.optional(v.number()),
    // ── MFA / TOTP (Phase 11). Required for creator + admin roles on
    //    sensitive mutations once enrolled. The secret is the canonical
    //    base32 TOTP secret; lastVerifiedAt drives the recency window.
    mfaSecret: v.optional(v.string()),
    mfaEnrolledAt: v.optional(v.number()),
    mfaLastVerifiedAt: v.optional(v.number()),
    mfaRecoveryCodes: v.optional(v.array(v.string())),
    /** Email verification (BPMN-001). emailVerificationToken is hashed
     *  (sha-256, hex) so a leaked DB row can't be turned into a
     *  one-click takeover. Cleared once verified. */
    emailVerificationTokenHash: v.optional(v.string()),
    emailVerificationSentAt: v.optional(v.number()),
    emailVerificationExpiresAt: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('by_role', ['role'])
    .index('by_creatorId', ['creatorId'])
    .index('by_stripeCustomerId', ['stripeCustomerId'])
    .index('by_discordId', ['discordId'])
    .index('by_telegramLinkCode', ['telegramLinkCode'])
    .index('by_telegramChatId', ['telegramChatId'])
    .index('by_emailVerificationTokenHash', ['emailVerificationTokenHash']),

  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerUserId: v.id('users'),
    isActive: v.boolean(),
    plan: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_ownerUserId', ['ownerUserId']),

  memberships: defineTable({
    tenantId: v.id('tenants'),
    userId: v.id('users'),
    role,
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_tenant_and_user', ['tenantId', 'userId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETPLACE — Categories, listings, media, favorites
  // ═══════════════════════════════════════════════════════════════════════════

  categories: defineTable({
    type: listingType,
    name: v.string(),
    slug: v.string(),
    parentId: v.optional(v.id('categories')),
    sortOrder: v.number(),
    isActive: v.boolean(),
  })
    .index('by_type', ['type'])
    .index('by_slug', ['slug'])
    .index('by_parent', ['parentId']),

  listings: defineTable({
    tenantId: v.optional(v.id('tenants')),
    ownerUserId: v.id('users'),
    type: listingType,
    categoryId: v.id('categories'),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    status: listingStatus,
    paymentMode,
    priceAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    locationName: v.optional(v.string()),
    municipality: v.optional(v.string()),
    county: v.optional(v.string()),
    country: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    attributes: v.optional(v.any()),
    isFeatured: v.boolean(),
    viewCount: v.number(),
    favoriteCount: v.number(),
    publishedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_type_and_status', ['type', 'status'])
    .index('by_ownerUserId', ['ownerUserId'])
    .index('by_tenantId', ['tenantId'])
    .index('by_categoryId', ['categoryId'])
    .index('by_slug', ['slug'])
    .searchIndex('search_listings', {
      searchField: 'title',
      filterFields: ['type', 'status', 'categoryId', 'municipality'],
    }),

  listingMedia: defineTable({
    listingId: v.id('listings'),
    storageId: v.optional(v.id('_storage')),
    url: v.optional(v.string()),
    altText: v.optional(v.string()),
    sortOrder: v.number(),
    isPrimary: v.boolean(),
    createdAt: v.number(),
  }).index('by_listing', ['listingId']),

  favorites: defineTable({
    listingId: v.id('listings'),
    userId: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_listing', ['listingId'])
    .index('by_user_and_listing', ['userId', 'listingId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGING — Conversations & messages
  // ═══════════════════════════════════════════════════════════════════════════

  conversations: defineTable({
    listingId: v.id('listings'),
    buyerUserId: v.id('users'),
    sellerUserId: v.id('users'),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_listing', ['listingId'])
    .index('by_buyer', ['buyerUserId'])
    .index('by_seller', ['sellerUserId']),

  messages: defineTable({
    // Polymorphic message — exactly one target should be set:
    //   conversationId  → legacy listing buyer/seller threads
    //   channelId       → creator community channel (Phase 4)
    //   dmThreadId      → creator <-> subscriber DM (Phase 10)
    conversationId: v.optional(v.id('conversations')),
    channelId: v.optional(v.id('channels')),
    dmThreadId: v.optional(v.id('dmThreads')),
    senderUserId: v.id('users'),
    body: v.string(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
    /**
     * Reactions (Phase 14d). One entry per emoji; userIds carries which
     * users have reacted with it. Add/remove handled by toggleReaction.
     */
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userIds: v.array(v.id('users')),
        }),
      ),
    ),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_channel_and_createdAt', ['channelId', 'createdAt'])
    .index('by_dmThread_and_createdAt', ['dmThreadId', 'createdAt'])
    .index('by_sender', ['senderUserId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // DM THREADS (PRD M12, Phase 10) — one persistent thread per
  // (creator, subscriber) pair. Distinct from `conversations` (listings)
  // and `channels` (community). Created lazily on first send.
  // ═══════════════════════════════════════════════════════════════════════════

  dmThreads: defineTable({
    creatorId: v.id('creators'),
    userId: v.id('users'),
    lastMessageAt: v.optional(v.number()),
    /** Unread badge counters bumped/cleared by send + markRead. */
    unreadForCreator: v.number(),
    unreadForUser: v.number(),
    createdAt: v.number(),
  })
    .index('by_creator', ['creatorId', 'lastMessageAt'])
    .index('by_user', ['userId', 'lastMessageAt'])
    .index('by_creator_and_user', ['creatorId', 'userId']),

  channels: defineTable({
    creatorId: v.id('creators'),
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    type: channelType,
    /** Subscription tier required to read+post. 'public' is open. */
    access: v.optional(v.union(v.literal('public'), v.literal('subscriber'), v.literal('vip'))),
    isActive: v.boolean(),
    /**
     * Phase 14g — stream-linked rooms. When set, the channel is a
     * transient companion to the creator's live stream and is only
     * surfaced in `channels.list` while the creator is live.
     */
    linkedStreamCreatorId: v.optional(v.id('creators')),
    memberCount: v.number(),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_creator', ['creatorId', 'createdAt'])
    .index('by_slug', ['slug'])
    .index('by_type', ['type', 'lastMessageAt'])
    .index('by_linkedStream', ['linkedStreamCreatorId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMERCE — Orders
  // ═══════════════════════════════════════════════════════════════════════════

  orders: defineTable({
    listingId: v.id('listings'),
    buyerUserId: v.id('users'),
    sellerUserId: v.id('users'),
    provider: v.optional(paymentProvider),
    status: orderStatus,
    amount: v.number(),
    currency: v.string(),
    providerReference: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_buyer', ['buyerUserId'])
    .index('by_seller', ['sellerUserId'])
    .index('by_listing', ['listingId'])
    .index('by_status', ['status']),

  // ═══════════════════════════════════════════════════════════════════════════
  // PLATFORM — Notifications & audit
  // ═══════════════════════════════════════════════════════════════════════════

  notifications: defineTable({
    userId: v.id('users'),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    data: v.optional(v.any()),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_read', ['userId', 'readAt']),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id('users')),
    tenantId: v.optional(v.id('tenants')),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    action: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_actor', ['actorUserId'])
    .index('by_tenant', ['tenantId'])
    .index('by_entity', ['entityType', 'entityId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // DIGIPICKS DOMAIN — Creators, picks, events, subscriptions, applications
  // ═══════════════════════════════════════════════════════════════════════════

  creators: defineTable({
    handle: v.string(),
    name: v.string(),
    avatarColor: v.string(),
    avatarMono: v.string(),
    verified: v.boolean(),
    niche: v.string(),
    sports: v.array(v.string()),
    bio: v.string(),
    subscriberCount: v.number(),
    startingPrice: v.number(),
    winRate: v.number(),
    record: v.string(),
    last10: v.string(),
    units: v.string(),
    streak: v.string(),
    tags: v.array(v.string()),
    trending: v.boolean(),
    status: creatorStatus,
    createdAt: v.number(),
    // ── Stripe pricing (Phase 3) ──
    stripePriceIdPremium: v.optional(v.string()),
    stripePriceIdVip: v.optional(v.string()),
    // ── Livestream (Phase 7) ──
    streamPlatform: v.optional(
      v.union(v.literal('twitch'), v.literal('youtube'), v.literal('kick')),
    ),
    streamHandle: v.optional(v.string()),
    /** Live status — populated by streams.poll (Phase 10). */
    streamLive: v.optional(v.boolean()),
    streamLastCheckedAt: v.optional(v.number()),
    streamWentLiveAt: v.optional(v.number()),
    streamTitle: v.optional(v.string()),
    streamViewerCount: v.optional(v.number()),
    // ── Discord webhook (pick delivery) ──
    discordWebhookUrl: v.optional(v.string()),
    // ── Trust score (Phase 11). 0–100 composite; recomputed nightly. ──
    trustScore: v.optional(v.number()),
    trustScoreUpdatedAt: v.optional(v.number()),
    /** Breakdown for the ScoreBadge tooltip. */
    trustSignals: v.optional(
      v.object({
        verification: v.number(),
        winRate: v.number(),
        disputeRatio: v.number(),
        ageDays: v.number(),
        sampleSize: v.number(),
      }),
    ),
    // ── Promoted placement (Phase 15a, PRD §12 revenue) ──
    /** Boost expires at this timestamp. UI rotation reads creators with
     *  promotedUntil > now() ordered by promotedRank desc. */
    promotedUntil: v.optional(v.number()),
    promotedRank: v.optional(v.number()),
    /** Default access tier for newly published picks. */
    defaultPickAccess: v.optional(pickAccess),
    /** Stripe Connect Express account for creator payouts. */
    stripeConnectAccountId: v.optional(v.string()),
    connectStatus: v.optional(
      v.union(
        v.literal('not_started'),
        v.literal('pending'),
        v.literal('restricted'),
        v.literal('active'),
      ),
    ),
    integrationsTelegramEnabled: v.optional(v.boolean()),
    integrationsDiscordEnabled: v.optional(v.boolean()),
    integrationsTelegramMinAccess: v.optional(
      v.union(v.literal('public'), v.literal('subscriber'), v.literal('vip')),
    ),
    integrationsDiscordMinAccess: v.optional(
      v.union(v.literal('public'), v.literal('subscriber'), v.literal('vip')),
    ),
  })
    .index('by_handle', ['handle'])
    .index('by_verified', ['verified'])
    .index('by_trending', ['trending'])
    .index('by_promoted', ['promotedUntil'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['verified', 'status'],
    }),

  picks: defineTable({
    creatorId: v.id('creators'),
    access: pickAccess,
    sport: v.string(),
    league: v.string(),
    eventId: v.optional(v.id('events')),
    eventName: v.string(),
    eventTime: v.string(),
    title: v.string(),
    market: v.string(),
    selection: v.string(),
    odds: v.string(),
    units: v.string(),
    confidence: pickConfidence,
    body: v.optional(v.string()),
    teaser: v.optional(v.string()),
    status: pickStatus,
    grade: v.optional(pickGrade),
    netUnits: v.optional(v.string()),
    gradedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    /** Future-publish timestamp for status='scheduled' rows (Phase 12). */
    publishAt: v.optional(v.number()),
    createdAt: v.number(),
    // ── AI Intelligence (PRD M9, Phase 5) ──
    aiSummary: v.optional(v.string()),
    aiConfidence: v.optional(v.number()),
    aiReasoning: v.optional(v.string()),
    aiAnalyzedAt: v.optional(v.number()),
    aiModel: v.optional(v.string()),
    /** Post-grade neutral one-liner explaining the result. Populated by
     *  internal.ai.gradingExplanation (BPMN-013). Quietly stays undefined
     *  when ANTHROPIC_API_KEY is not configured. */
    gradeExplanation: v.optional(v.string()),
    gradeExplanationAt: v.optional(v.number()),
    /** Trending score (Phase 12) — recomputed nightly. Higher = hotter. */
    trendingScore: v.optional(v.number()),
    trendingComputedAt: v.optional(v.number()),
  })
    .index('by_creator', ['creatorId', 'createdAt'])
    .index('by_sport', ['sport', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
    .index('by_status_and_publishAt', ['status', 'publishAt'])
    .index('by_status_and_trending', ['status', 'trendingScore'])
    .index('by_access', ['access', 'createdAt'])
    .index('by_event_and_status', ['eventId', 'status']),

  events: defineTable({
    sport: v.string(),
    league: v.string(),
    home: v.string(),
    away: v.string(),
    time: v.string(),
    startsAt: v.number(),
    creatorCount: v.number(),
    pickCount: v.number(),
    featured: v.boolean(),
    status: eventStatus,
    // ── Live score fields (populated by cron) ──
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    gameStatus: v.optional(v.string()),
    lastScoreUpdate: v.optional(v.number()),
    externalId: v.optional(v.string()),
    // ── Team logos (backfilled by teamLogos.resolveOne) ──
    homeLogo: v.optional(v.string()),
    awayLogo: v.optional(v.string()),
    // ── Federated event engine (PRD §7.1, SRSD FR-EVT-001 → FR-EVT-005) ──
    sourceType: v.optional(eventSourceType),
    providerName: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    createdByUserId: v.optional(v.id('users')),
    reviewedByAdminId: v.optional(v.id('users')),
    title: v.optional(v.string()),
    endTime: v.optional(v.number()),
    visibility: v.optional(eventVisibility),
    verificationStatus: v.optional(eventVerificationStatus),
    resultSource: v.optional(eventResultSource),
    participants: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: eventParticipantType,
        }),
      ),
    ),
    metadata: v.optional(v.any()),
  })
    .index('by_sport_and_startsAt', ['sport', 'startsAt'])
    .index('by_featured_and_startsAt', ['featured', 'startsAt'])
    .index('by_status_and_startsAt', ['status', 'startsAt'])
    .index('by_external_id', ['externalId'])
    .index('by_sourceType_and_startsAt', ['sourceType', 'startsAt'])
    .index('by_createdByUserId', ['createdByUserId'])
    .index('by_verificationStatus', ['verificationStatus']),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEAM LOGOS — Cached badge URLs from TheSportsDB (populated async)
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // ODDS SNAPSHOTS — Per-bookmaker line history for line-movement analysis
  // ═══════════════════════════════════════════════════════════════════════════

  oddsSnapshots: defineTable({
    eventId: v.id('events'),
    externalEventId: v.optional(v.string()),
    market: v.string(), // 'h2h' | 'spreads' | 'totals'
    book: v.string(), // bookmaker key, e.g. 'fanduel'
    bookTitle: v.string(),
    side: v.string(), // outcome name (team name or 'Over' / 'Under')
    price: v.number(), // decimal odds from The Odds API
    point: v.optional(v.number()), // spread / total line
    capturedAt: v.number(),
  })
    .index('by_event_and_capturedAt', ['eventId', 'capturedAt'])
    .index('by_event_market_book', ['eventId', 'market', 'book', 'capturedAt']),

  teamLogos: defineTable({
    sport: v.string(),
    normalizedName: v.string(), // lowercased, accent-stripped, suffix-stripped
    displayName: v.string(), // original name for reference
    /** Origin URL from TheSportsDB. Kept for traceability; the UI prefers
     *  storageUrl below so the asset is served from our own bucket. */
    badgeUrl: v.optional(v.string()),
    /** Convex Storage id — set once the asset is downloaded into the
     *  bucket. Frontend reads `storageUrl` for the actual <img src=>. */
    storageId: v.optional(v.id('_storage')),
    /** Stable URL over the storage asset, generated via ctx.storage.getUrl
     *  at write time. Refreshed lazily on resolve to handle expiring URLs. */
    storageUrl: v.optional(v.string()),
    /** Asset bytes mime — populated from the upstream Content-Type header. */
    storageMime: v.optional(v.string()),
    source: v.optional(v.string()), // "thesportsdb" / "manual"
    resolvedAt: v.number(),
    notFound: v.optional(v.boolean()), // true when TheSportsDB returned no result
  })
    .index('by_sport_and_normalizedName', ['sport', 'normalizedName'])
    .index('by_storageId', ['storageId']),

  subscriptions: defineTable({
    subscriberId: v.id('users'),
    creatorId: v.id('creators'),
    plan: subscriptionPlan,
    status: subscriptionStatus,
    startedAt: v.number(),
    renewsAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    /** Set when status flips to 'past_due'. Until this timestamp, access
     *  helpers treat the row as still-active so a transient payment hiccup
     *  doesn't yank entitlement on the first failed retry (BPMN-003 §grace
     *  period). Default window is GRACE_PERIOD_DAYS env (3 days). */
    gracePeriodEndsAt: v.optional(v.number()),
  })
    .index('by_creator', ['creatorId'])
    .index('by_subscriber_and_creator', ['subscriberId', 'creatorId'])
    .index('by_stripeSubscriptionId', ['stripeSubscriptionId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // STRIPE EVENTS — Webhook idempotency log (BPMN-003 §preconditions).
  // Stripe re-delivers events on transient failures; the unique index on
  // eventId short-circuits replays so subscription state never double-applies.
  // payloadHash captures sha-256 of the raw body for forensics.
  // ═══════════════════════════════════════════════════════════════════════════

  stripeEvents: defineTable({
    eventId: v.string(),
    type: v.string(),
    payloadHash: v.string(),
    /** Set on the first time this event was processed. Subsequent deliveries
     *  short-circuit by reading this row and returning early. */
    processedAt: v.number(),
    /** Optional summary of what we did with the event — useful for debugging
     *  drift between Stripe state and our subscriptions table. */
    outcome: v.optional(v.string()),
  })
    .index('by_eventId', ['eventId'])
    .index('by_type_and_processed', ['type', 'processedAt']),

  payouts: defineTable({
    creatorId: v.id('creators'),
    amount: v.number(),
    currency: v.string(),
    status: payoutStatus,
    stripePayoutId: v.optional(v.string()),
    periodStart: v.number(),
    periodEnd: v.number(),
    paidAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  })
    .index('by_creator', ['creatorId', 'periodStart'])
    .index('by_status', ['status'])
    .index('by_stripePayoutId', ['stripePayoutId']),

  savedPicks: defineTable({
    userId: v.id('users'),
    pickId: v.id('picks'),
    savedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_pick', ['userId', 'pickId'])
    .index('by_pick', ['pickId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // REFERRALS (PRD M5 / FM-009, Phase 12) — one row per referral code.
  // referredUserId / convertedAt set when the code is redeemed at checkout.
  // ═══════════════════════════════════════════════════════════════════════════

  referrals: defineTable({
    referrerUserId: v.id('users'),
    code: v.string(),
    referredUserId: v.optional(v.id('users')),
    convertedAt: v.optional(v.number()),
    /** Cents earned by the referrer once conversion lands (Stripe webhook). */
    payoutCents: v.optional(v.number()),
    /** Stripe coupon ID used at checkout when the code is applied. */
    stripeCouponId: v.optional(v.string()),
    /** Free-form metadata: platform attributes, campaign tags, etc. */
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_referrer', ['referrerUserId', 'createdAt'])
    .index('by_referred', ['referredUserId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPUTES (PRD M16 / FM-011) — subscriber or creator can open a dispute
  // on a graded pick. Admin reviews and resolves with an outcome.
  // ═══════════════════════════════════════════════════════════════════════════

  disputes: defineTable({
    pickId: v.id('picks'),
    creatorId: v.id('creators'),
    openedByUserId: v.id('users'),
    reason: v.string(),
    detail: v.optional(v.string()),
    status: v.union(
      v.literal('open'),
      v.literal('under_review'),
      v.literal('resolved'),
      v.literal('dismissed'),
    ),
    resolvedByAdminId: v.optional(v.id('users')),
    resolution: v.optional(v.string()),
    /** Free-form audit trail of admin / opener comments. */
    notes: v.array(
      v.object({
        authorUserId: v.id('users'),
        body: v.string(),
        createdAt: v.number(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_pick', ['pickId'])
    .index('by_creator', ['creatorId', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
    .index('by_opener', ['openedByUserId', 'createdAt']),

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICING TIERS (PRD M5 / FM-009) — replaces the hardcoded
  // free|premium|vip enum on subscriptions. One row per offering.
  // ═══════════════════════════════════════════════════════════════════════════

  pricingTiers: defineTable({
    creatorId: v.id('creators'),
    name: v.string(),
    /** Free tier when 0; otherwise priced in cents. */
    priceCents: v.number(),
    interval: v.union(v.literal('month'), v.literal('year'), v.literal('once')),
    perks: v.array(v.string()),
    stripePriceId: v.optional(v.string()),
    archived: v.boolean(),
    sortOrder: v.number(),
    /** 'free' | 'premium' | 'vip' — kept so legacy subs still join cleanly. */
    legacyPlan: v.optional(v.string()),
    /**
     * Phase 16d — Stripe trial period in days. When set, checkout
     * passes `subscription_data[trial_period_days]` to Stripe so the
     * customer's first invoice is delayed.
     */
    trialDays: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_creator', ['creatorId', 'sortOrder'])
    .index('by_stripePriceId', ['stripePriceId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // AI COPILOT (Phase 16f, M24) — multi-turn conversation with tool use.
  // ═══════════════════════════════════════════════════════════════════════════

  aiConversations: defineTable({
    userId: v.id('users'),
    title: v.string(),
    /** 'customer' or 'creator' — drives the system prompt template. */
    persona: v.union(v.literal('customer'), v.literal('creator')),
    archivedAt: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
    messageCount: v.number(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId', 'lastMessageAt'])
    .index('by_user_active', ['userId', 'archivedAt']),

  aiMessages: defineTable({
    conversationId: v.id('aiConversations'),
    role: v.union(v.literal('user'), v.literal('assistant'), v.literal('tool')),
    body: v.string(),
    /** When role='tool' — the tool name + arg payload echoed back. */
    toolName: v.optional(v.string()),
    toolArgs: v.optional(v.any()),
    /** Anthropic tool_use id linking assistant tool_use ↔ tool_result blocks. */
    toolCallId: v.optional(v.string()),
    /** Model + token usage metadata for assistant turns. */
    model: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    cacheReadTokens: v.optional(v.number()),
    stopReason: v.optional(v.string()),
    /** Tool-loop iteration index (0 = user msg, 1+ = assistant turns). */
    iter: v.optional(v.number()),
    /** Streaming flag + buffer for in-progress assistant turns (M24). The
     *  respond action patches `streamingBuffer` while Anthropic streams text
     *  deltas; on completion the buffer is moved into `body` and `streaming`
     *  is cleared so the message becomes its final form. UI subscribes via
     *  useQuery and re-renders on each patch. */
    streaming: v.optional(v.boolean()),
    streamingBuffer: v.optional(v.string()),
    /** PII-scrubbed user-message hash (first 16 hex chars of sha-256). */
    piiHash: v.optional(v.string()),
    /** Citation list — entity refs the assistant grounded its answer on. */
    citations: v.optional(
      v.array(
        v.object({
          kind: v.string(),
          id: v.string(),
          label: v.string(),
          /** Tool that produced the citation (e.g. 'creatorPerformance'). */
          tool: v.optional(v.string()),
          /** Sample size behind the claim — required by skeptical templates. */
          sampleSize: v.optional(v.number()),
          /** Snapshot timestamp of the underlying query. */
          at: v.optional(v.number()),
        }),
      ),
    ),
    createdAt: v.number(),
  }).index('by_conversation', ['conversationId', 'createdAt']),

  // ═══════════════════════════════════════════════════════════════════════════
  // AI TOOL CALLS (M24) — high-cardinality observability table separate from
  // aiMessages. Stores the tool result payload (capped) + duration + error
  // for admin debugging via ToolCallTrace.
  // ═══════════════════════════════════════════════════════════════════════════

  aiToolCalls: defineTable({
    messageId: v.id('aiMessages'),
    conversationId: v.id('aiConversations'),
    toolName: v.string(),
    args: v.optional(v.any()),
    /** First 500 chars of the JSON-stringified result; truncate marker on cut. */
    resultPreview: v.optional(v.string()),
    durationMs: v.number(),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_conversation', ['conversationId', 'createdAt'])
    .index('by_message', ['messageId'])
    .index('by_tool_and_createdAt', ['toolName', 'createdAt']),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISCORD INBOUND (Phase 16e, M20) — guild integrations + channel sync
  // configuration + imported message metadata. The schema lives now;
  // actual Bot API ingestion is gated behind DISCORD_BOT_TOKEN.
  // ═══════════════════════════════════════════════════════════════════════════

  discordIntegrations: defineTable({
    creatorId: v.id('creators'),
    guildId: v.string(),
    guildName: v.string(),
    /** Optional Discord guild icon hash → CDN URL on the client. */
    guildIconHash: v.optional(v.string()),
    status: v.union(v.literal('connected'), v.literal('paused'), v.literal('revoked')),
    /** Whether the DigiPicks Discord bot is installed in this guild. */
    botInstalled: v.optional(v.boolean()),
    /** AES-256-GCM encrypted OAuth tokens (key from DISCORD_OAUTH_ENC_KEY). */
    oauthAccessTokenEnc: v.optional(v.string()),
    oauthRefreshTokenEnc: v.optional(v.string()),
    oauthExpiresAt: v.optional(v.number()),
    /** Discord OAuth scopes granted by the installer. */
    scopes: v.optional(v.array(v.string())),
    /** Surfaced from Discord app config — gates inbound message-content reads. */
    messageContentIntent: v.optional(v.boolean()),
    connectedByUserId: v.id('users'),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_creator', ['creatorId'])
    .index('by_guild', ['guildId'])
    .index('by_status', ['status']),

  discordChannelSyncs: defineTable({
    integrationId: v.id('discordIntegrations'),
    /** Denormalized for fast creator-scoped queries (skip extra hop through
     *  the integration row when fanning outbound deliveries). */
    creatorId: v.optional(v.id('creators')),
    channelId: v.string(),
    channelName: v.string(),
    /** Discord channel type code (0 text, 5 announce, 15 forum, …). */
    channelType: v.optional(v.number()),
    syncDirection: v.union(v.literal('outbound'), v.literal('inbound'), v.literal('two_way')),
    /** Optional link to a DigiPicks entity (event / pick / livestream / creator). */
    linkedEntityType: v.optional(v.string()),
    linkedEntityId: v.optional(v.string()),
    /** Per-channel outbound alert toggles + thresholds. Defaults applied at
     *  configure time; missing object means "all alerts on". */
    alertRules: v.optional(
      v.object({
        newPick: v.optional(v.boolean()),
        pickGraded: v.optional(v.boolean()),
        oddsMovement: v.optional(v.boolean()),
        creatorLive: v.optional(v.boolean()),
        aiInsight: v.optional(v.boolean()),
        announcement: v.optional(v.boolean()),
        /** 'Low' | 'Medium' | 'High' — gate alerts at or above. */
        minConfidence: v.optional(v.string()),
      }),
    ),
    isEnabled: v.boolean(),
    /** Cron stamp — last successful inbound import for this channel. */
    lastImportedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_integration', ['integrationId', 'isEnabled'])
    .index('by_creator_and_direction', ['creatorId', 'syncDirection'])
    .index('by_channel', ['channelId'])
    .index('by_enabled_and_lastImported', ['isEnabled', 'lastImportedAt'])
    .index('by_linked_entity', ['linkedEntityType', 'linkedEntityId']),

  discordMessageImports: defineTable({
    integrationId: v.id('discordIntegrations'),
    channelSyncId: v.optional(v.id('discordChannelSyncs')),
    channelId: v.string(),
    threadId: v.optional(v.string()),
    discordMessageId: v.string(),
    /** Hashed author identifier — never raw Discord user ID. sha-256 over
     *  authorId + DISCORD_AUTHOR_SALT (platform-wide). */
    authorHash: v.string(),
    /** Summarized content; raw never stored by default. */
    contentSummary: v.optional(v.string()),
    rawContentStored: v.boolean(),
    linkedEntityType: v.optional(v.string()),
    linkedEntityId: v.optional(v.string()),
    sentimentScore: v.optional(v.number()),
    reactionCount: v.optional(v.number()),
    replyCount: v.optional(v.number()),
    /** Discord-side timestamp; importedAt is when DigiPicks recorded it. */
    createdAtDiscord: v.optional(v.number()),
    importedAt: v.number(),
  })
    .index('by_integration', ['integrationId'])
    .index('by_channel_and_imported', ['channelId', 'importedAt'])
    .index('by_thread', ['threadId'])
    .index('by_messageId', ['discordMessageId'])
    .index('by_linked_entity', ['linkedEntityType', 'linkedEntityId', 'importedAt']),

  discordSentimentSummaries: defineTable({
    integrationId: v.id('discordIntegrations'),
    channelId: v.string(),
    /** Optional entity binding so customer surfaces (event/pick detail) can
     *  pull "what is the community saying about this match" rollups. */
    linkedEntityType: v.optional(v.string()),
    linkedEntityId: v.optional(v.string()),
    windowStart: v.number(),
    windowEnd: v.number(),
    messageCount: v.number(),
    /** Aggregate score in [-1, 1]; positive is bullish on the linked entity. */
    avgSentiment: v.number(),
    /** Volume × sentiment magnitude — a "loudness" indicator for hot threads. */
    heatScore: v.optional(v.number()),
    /** Top recurring themes/keywords (≤5) extracted by the summarizer. */
    topThemes: v.optional(v.array(v.string())),
    summary: v.string(),
    /** Anthropic model that produced the summary, for audit + cost attribution. */
    aiModel: v.optional(v.string()),
    generatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_channel_and_window', ['channelId', 'windowStart'])
    .index('by_entity_and_generated', ['linkedEntityType', 'linkedEntityId', 'generatedAt'])
    .index('by_integration', ['integrationId', 'generatedAt']),

  discordDeliveryLogs: defineTable({
    /** Null for legacy webhook-URL deliveries (pre-integration migration). */
    integrationId: v.optional(v.id('discordIntegrations')),
    creatorId: v.optional(v.id('creators')),
    channelId: v.optional(v.string()),
    /** Masked webhook URL (last 6 chars) for legacy/per-creator deliveries. */
    webhookUrlMasked: v.optional(v.string()),
    eventType: v.string(),
    /** Source entity that triggered the delivery (pick / event / stream / …). */
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('sent'),
      v.literal('failed'),
      v.literal('retrying'),
    ),
    /** Number of send attempts so the retry cron knows when to give up. */
    attemptCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    /** Discord message ID returned on success — enables thread linking later. */
    discordMessageId: v.optional(v.string()),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_integration_and_created', ['integrationId', 'createdAt'])
    .index('by_creator_and_created', ['creatorId', 'createdAt'])
    .index('by_status', ['status', 'createdAt']),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISCORD THREAD LINKS (M20) — explicit two-way binding between a Discord
  // thread and a DigiPicks entity. A pick page renders the linked thread
  // summary; new replies bump messageCount + lastActivityAt.
  // ═══════════════════════════════════════════════════════════════════════════

  discordThreadLinks: defineTable({
    integrationId: v.id('discordIntegrations'),
    threadId: v.string(),
    channelId: v.string(),
    threadName: v.optional(v.string()),
    linkedEntityType: v.union(
      v.literal('event'),
      v.literal('pick'),
      v.literal('creator'),
      v.literal('livestream'),
    ),
    linkedEntityId: v.string(),
    createdByUserId: v.id('users'),
    isActive: v.boolean(),
    messageCount: v.number(),
    lastActivityAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_thread', ['threadId'])
    .index('by_entity', ['linkedEntityType', 'linkedEntityId'])
    .index('by_integration', ['integrationId', 'isActive']),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISCORD WEBHOOK EVENTS (M20) — raw inbound interaction/event ingest queue.
  // Discord posts here on /discord/interactions; processIncomingEvent dequeues
  // and dispatches to the appropriate handler. payloadHash de-duplicates
  // retries from Discord.
  // ═══════════════════════════════════════════════════════════════════════════

  discordWebhookEvents: defineTable({
    integrationId: v.optional(v.id('discordIntegrations')),
    discordEventId: v.string(),
    /** 'INTERACTION_CREATE' | 'MESSAGE_CREATE' | 'THREAD_CREATE' | … */
    eventType: v.string(),
    guildId: v.optional(v.string()),
    channelId: v.optional(v.string()),
    /** sha-256 of the raw body for replay/idempotency. */
    payloadHash: v.string(),
    processedAt: v.optional(v.number()),
    processingError: v.optional(v.string()),
    receivedAt: v.number(),
  })
    .index('by_eventId', ['discordEventId'])
    .index('by_processed', ['processedAt', 'receivedAt'])
    .index('by_payloadHash', ['payloadHash']),

  // ═══════════════════════════════════════════════════════════════════════════
  // COUPON CODES (Phase 16d, M19) — admin-issued promotional codes.
  // Distinct from referral codes (which are per-user). Maps to a Stripe
  // coupon ID; checkout attaches it as a subscription discount.
  // ═══════════════════════════════════════════════════════════════════════════

  couponCodes: defineTable({
    code: v.string(),
    /** Stripe coupon ID (created in Stripe dashboard or via API). */
    stripeCouponId: v.string(),
    /** Display-only — actual discount enforced by Stripe. */
    percentOff: v.optional(v.number()),
    amountOffCents: v.optional(v.number()),
    /** Cap on total redemptions across all users. 0 = unlimited. */
    maxRedemptions: v.number(),
    redemptionCount: v.number(),
    /** Hard expiry (ms epoch); 0 = no expiry. */
    expiresAt: v.number(),
    createdByUserId: v.id('users'),
    archived: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_archived', ['archived', 'createdAt']),

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOWED CREATORS (PRD M15) — the second half of the saved library.
  // Picks live in `savedPicks`; creators live here.
  // ═══════════════════════════════════════════════════════════════════════════

  followedCreators: defineTable({
    userId: v.id('users'),
    creatorId: v.id('creators'),
    followedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_creator', ['creatorId'])
    .index('by_user_and_creator', ['userId', 'creatorId']),

  // ═══════════════════════════════════════════════════════════════════════════
  // WATCHLISTS (PRD M14, M15, Phase 14c) — user-defined alert rules. Each
  // row carries a filter object that gets matched against newly published
  // picks; a hit fires an extra notify.dispatch for the watchlist owner.
  // ═══════════════════════════════════════════════════════════════════════════

  watchlists: defineTable({
    userId: v.id('users'),
    name: v.string(),
    filter: v.object({
      sport: v.optional(v.string()),
      league: v.optional(v.string()),
      creatorIds: v.optional(v.array(v.id('creators'))),
      market: v.optional(v.string()),
      /** 'Low' / 'Medium' / 'High' — match picks at or above this. */
      minConfidence: v.optional(v.string()),
      /** 'free' / 'premium' / 'vip' — match picks at this access tier. */
      access: v.optional(v.string()),
      /** Case-insensitive substring match against pick body/title/teaser. */
      bodyContains: v.optional(v.string()),
      /** Line-movement watch — fire when shifts ≥ this percent. */
      lineMoveAbovePercent: v.optional(v.number()),
    }),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_active', ['isActive']),

  // ═══════════════════════════════════════════════════════════════════════════
  // PUSH SUBSCRIPTIONS — Web push (VAPID) endpoints registered by browsers.
  // One row per (userId, endpoint). Removed on 410 Gone or explicit unsub.
  // ═══════════════════════════════════════════════════════════════════════════

  pushSubscriptions: defineTable({
    userId: v.id('users'),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_endpoint', ['endpoint']),

  applications: defineTable({
    name: v.string(),
    handle: v.string(),
    email: v.string(),
    sport: v.string(),
    niche: v.string(),
    existingFollowing: v.optional(v.string()),
    priceHint: v.optional(v.string()),
    proofCount: v.number(),
    winClaim: v.optional(v.string()),
    status: applicationStatus,
    reviewedBy: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    /** BPMN-006 §AI authenticity. Advisory score (0..100) produced by
     *  internal.ai.scoreApplicationAuthenticity. Never auto-suspends —
     *  surfaced to admins in the review queue alongside the freeform
     *  reasoning. Quietly stays undefined when ANTHROPIC_API_KEY is unset. */
    aiAuthenticityScore: v.optional(v.number()),
    aiAuthenticityReasoning: v.optional(v.string()),
    aiAuthenticityScoredAt: v.optional(v.number()),
  })
    .index('by_status', ['status', 'submittedAt'])
    .index('by_email', ['email']),

  // ═══════════════════════════════════════════════════════════════════════════
  // BILLING CASES (admin finance — Stitch zip 90)
  // ═══════════════════════════════════════════════════════════════════════════

  billingCases: defineTable({
    caseNumber: v.string(),
    subscriberId: v.id('users'),
    creatorId: v.id('creators'),
    subscriptionId: v.optional(v.id('subscriptions')),
    amountCents: v.number(),
    issueType: v.union(
      v.literal('content'),
      v.literal('accidental'),
      v.literal('subscription'),
      v.literal('chargeback'),
    ),
    status: v.union(
      v.literal('open'),
      v.literal('under_review'),
      v.literal('pending_finance'),
      v.literal('escalated'),
      v.literal('refunded'),
      v.literal('denied'),
      v.literal('closed'),
    ),
    priority: v.optional(v.union(v.literal('normal'), v.literal('urgent'))),
    stripeChargeId: v.optional(v.string()),
    internalNotes: v.array(
      v.object({
        authorUserId: v.id('users'),
        body: v.string(),
        createdAt: v.number(),
      }),
    ),
    resolvedByAdminId: v.optional(v.id('users')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_status', ['status', 'createdAt'])
    .index('by_subscriber', ['subscriberId', 'createdAt'])
    .index('by_caseNumber', ['caseNumber']),

  // ═══════════════════════════════════════════════════════════════════════════
  // ENTITLEMENTS (admin inspector — Stitch zip 92)
  // ═══════════════════════════════════════════════════════════════════════════

  entitlements: defineTable({
    userId: v.id('users'),
    creatorId: v.id('creators'),
    resourceType: v.union(
      v.literal('subscription'),
      v.literal('pick_feed'),
      v.literal('telegram'),
      v.literal('discord'),
      v.literal('channel'),
    ),
    resourceId: v.string(),
    status: v.union(v.literal('active'), v.literal('expired'), v.literal('revoked')),
    source: v.union(
      v.literal('subscription'),
      v.literal('manual_override'),
      v.literal('promo'),
      v.literal('trial'),
    ),
    validUntil: v.optional(v.number()),
    grantedByAdminId: v.optional(v.id('users')),
    reason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_user_creator', ['userId', 'creatorId']),

  accessLogs: defineTable({
    userId: v.id('users'),
    resourceId: v.string(),
    result: v.union(v.literal('allowed'), v.literal('denied')),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_user', ['userId', 'createdAt']),

  campaigns: defineTable({
    title: v.string(),
    body: v.string(),
    channel: v.union(v.literal('email'), v.literal('push'), v.literal('in_app')),
    status: v.union(v.literal('draft'), v.literal('scheduled'), v.literal('sent')),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdByAdminId: v.id('users'),
    createdAt: v.number(),
  }).index('by_status', ['status', 'createdAt']),

  platformSettings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
    updatedByAdminId: v.optional(v.id('users')),
  }).index('by_key', ['key']),

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM — circuit breakers for external providers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * One row per external-provider circuit (e.g., `theOddsApi`). When a
   * provider returns an unrecoverable auth/quota error, the caller opens
   * the circuit by upserting a row here with `openedAt=now` and
   * `reason='401'` (or similar). Pollers consult this table at the top of
   * every run and quiet-no-op while the circuit is within its TTL window.
   * The breaker self-heals: after the TTL elapses we let one probe pass
   * through; if it fails the circuit re-opens, otherwise the row is
   * deleted. Single-row-per-key access pattern — index on `key`.
   */
  systemCircuit: defineTable({
    key: v.string(),
    openedAt: v.number(),
    status: v.union(v.literal('open'), v.literal('half_open')),
    reason: v.string(),
  }).index('by_key', ['key']),
});
