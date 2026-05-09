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
        // Per-kind toggles — default true.
        pickPublished: v.optional(v.boolean()),
        pickGraded: v.optional(v.boolean()),
        lineMoved: v.optional(v.boolean()),
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
  })
    .index('email', ['email'])
    .index('by_role', ['role'])
    .index('by_creatorId', ['creatorId'])
    .index('by_stripeCustomerId', ['stripeCustomerId'])
    .index('by_discordId', ['discordId'])
    .index('by_telegramLinkCode', ['telegramLinkCode'])
    .index('by_telegramChatId', ['telegramChatId']),

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
    access: v.optional(
      v.union(
        v.literal('public'),
        v.literal('subscriber'),
        v.literal('vip'),
      ),
    ),
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
  })
    .index('by_handle', ['handle'])
    .index('by_verified', ['verified'])
    .index('by_trending', ['trending'])
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
    /** Trending score (Phase 12) — recomputed nightly. Higher = hotter. */
    trendingScore: v.optional(v.number()),
    trendingComputedAt: v.optional(v.number()),
  })
    .index('by_creator', ['creatorId', 'createdAt'])
    .index('by_sport', ['sport', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
    .index('by_status_and_publishAt', ['status', 'publishAt'])
    .index('by_status_and_trending', ['status', 'trendingScore'])
    .index('by_access', ['access', 'createdAt']),

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
    badgeUrl: v.optional(v.string()),
    source: v.optional(v.string()), // "thesportsdb" / "manual"
    resolvedAt: v.number(),
    notFound: v.optional(v.boolean()), // true when TheSportsDB returned no result
  }).index('by_sport_and_normalizedName', ['sport', 'normalizedName']),

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
  })
    .index('by_creator', ['creatorId'])
    .index('by_subscriber_and_creator', ['subscriberId', 'creatorId'])
    .index('by_stripeSubscriptionId', ['stripeSubscriptionId']),

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
    createdAt: v.number(),
  })
    .index('by_creator', ['creatorId', 'sortOrder'])
    .index('by_stripePriceId', ['stripePriceId']),

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
  })
    .index('by_status', ['status', 'submittedAt'])
    .index('by_email', ['email']),
});
