import { v } from 'convex/values';

// =============================================================================
// Shared Validators — reusable across schema + function args
// =============================================================================

export const role = v.union(
  v.literal('super_admin'),
  v.literal('tenant_admin'),
  v.literal('admin'),
  v.literal('moderator'),
  v.literal('user'),
);

export const listingStatus = v.union(
  v.literal('draft'),
  v.literal('pending_review'),
  v.literal('published'),
  v.literal('rejected'),
  v.literal('archived'),
  v.literal('sold'),
);

export const listingType = v.union(
  v.literal('torget'),
  v.literal('vehicle'),
  v.literal('property'),
  v.literal('job'),
  v.literal('travel'),
  v.literal('service'),
);

export const paymentMode = v.union(
  v.literal('contact_only'),
  v.literal('platform_payment'),
  v.literal('invoice'),
  v.literal('external'),
);

export const creatorStatus = v.union(
  v.literal('active'),
  v.literal('suspended'),
  v.literal('pending'),
);

export const pickAccess = v.union(
  v.literal('free'),
  v.literal('premium'),
  v.literal('vip'),
);

export const pickConfidence = v.union(
  v.literal('Low'),
  v.literal('Medium'),
  v.literal('High'),
);

export const pickStatus = v.union(
  v.literal('draft'),
  v.literal('scheduled'),
  v.literal('published'),
  v.literal('archived'),
);

export const pickGrade = v.union(
  v.literal('win'),
  v.literal('loss'),
  v.literal('push'),
  v.literal('pending'),
);

export const subscriptionPlan = v.union(
  v.literal('free'),
  v.literal('premium'),
  v.literal('vip'),
);

export const subscriptionStatus = v.union(
  v.literal('active'),
  v.literal('past_due'),
  v.literal('cancelled'),
);

export const applicationStatus = v.union(
  v.literal('submitted'),
  v.literal('review'),
  v.literal('more_info'),
  v.literal('flagged'),
  v.literal('approved'),
  v.literal('rejected'),
);

export const eventStatus = v.union(
  v.literal('upcoming'),
  v.literal('draft'),
  v.literal('live'),
  v.literal('completed'),
  v.literal('cancelled'),
  v.literal('disputed'),
);

export const eventSourceType = v.union(
  v.literal('provider'),
  v.literal('sport_source'),
  v.literal('federation'),
  v.literal('platform'),
  v.literal('creator'),
  v.literal('community'),
);

export const eventVisibility = v.union(
  v.literal('public'),
  v.literal('premium'),
  v.literal('private'),
);

export const eventVerificationStatus = v.union(
  v.literal('unverified'),
  v.literal('creator_submitted'),
  v.literal('source_verified'),
  v.literal('admin_verified'),
);

export const eventResultSource = v.union(
  v.literal('provider'),
  v.literal('manual_creator'),
  v.literal('manual_admin'),
  v.literal('community_confirmed'),
);

export const eventParticipantType = v.union(
  v.literal('team'),
  v.literal('player'),
  v.literal('creator'),
  v.literal('custom'),
);

export const orderStatus = v.union(
  v.literal('draft'),
  v.literal('pending_payment'),
  v.literal('paid'),
  v.literal('cancelled'),
  v.literal('refunded'),
  v.literal('completed'),
);

export const paymentProvider = v.union(
  v.literal('stripe'),
  v.literal('vipps'),
  v.literal('nets'),
  v.literal('manual'),
);

export const payoutStatus = v.union(
  v.literal('pending'),
  v.literal('paid'),
  v.literal('failed'),
);

export const channelType = v.union(
  v.literal('public'),
  v.literal('subscriber'),
);
