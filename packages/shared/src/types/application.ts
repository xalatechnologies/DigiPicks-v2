// =============================================================================
// Application — Creator onboarding queue
// =============================================================================

export type ApplicationStatus = 'review' | 'more_info' | 'flagged' | 'approved' | 'rejected';

export interface CreatorApplication {
  id: string;
  name: string;
  handle: string;
  sport: string;
  niche: string;
  subs: string;
  priceHint: string;
  proof: number;
  submitted: string;
  status: ApplicationStatus;
  winClaim: string;
}
