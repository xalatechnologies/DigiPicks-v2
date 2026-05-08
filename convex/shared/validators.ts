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
  v.literal('live'),
  v.literal('completed'),
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
