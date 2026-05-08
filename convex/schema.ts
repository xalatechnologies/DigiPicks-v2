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
  orderStatus,
  paymentProvider,
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
  })
    .index('email', ['email'])
    .index('by_role', ['role']),

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
    conversationId: v.id('conversations'),
    senderUserId: v.id('users'),
    body: v.string(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_sender', ['senderUserId']),

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
    createdAt: v.number(),
  })
    .index('by_creator', ['creatorId', 'createdAt'])
    .index('by_sport', ['sport', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
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
  })
    .index('by_sport_and_startsAt', ['sport', 'startsAt'])
    .index('by_featured_and_startsAt', ['featured', 'startsAt'])
    .index('by_status_and_startsAt', ['status', 'startsAt'])
    .index('by_external_id', ['externalId']),

  subscriptions: defineTable({
    subscriberId: v.id('users'),
    creatorId: v.id('creators'),
    plan: subscriptionPlan,
    status: subscriptionStatus,
    startedAt: v.number(),
    renewsAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    stripeSubscriptionId: v.optional(v.string()),
  })
    .index('by_creator', ['creatorId'])
    .index('by_subscriber_and_creator', ['subscriberId', 'creatorId']),

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
