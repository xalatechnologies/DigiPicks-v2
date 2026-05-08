// =============================================================================
// Creator — Profile, stats, verification
// =============================================================================

export interface CreatorAvatar {
  color: string;
  mono: string;
}

export interface Creator {
  id: string;
  handle: string;
  name: string;
  avatar: CreatorAvatar;
  verified: boolean;
  niche: string;
  sports: string[];
  bio: string;
  subs: number;
  startingPrice: number;
  winRate: number;
  record: string;
  last10: string;
  units: string;
  streak: string;
  tags: string[];
  trending?: boolean;
}
