// =============================================================================
// Subscription — Creator-subscriber relationships and plans
// =============================================================================

export type SubscriberPlan = 'Free Follow' | 'Premium' | 'VIP';
export type SubscriberStatus = 'active' | 'past_due' | 'cancelled';

export interface Subscriber {
  id: string;
  name: string;
  plan: SubscriberPlan;
  status: SubscriberStatus;
  start: string;
  renew: string;
  ltv: string;
  engagement: number;
  vip: boolean;
}
