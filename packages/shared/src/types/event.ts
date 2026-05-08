// =============================================================================
// Event — Sport events with league and matchup data
// =============================================================================

export interface SportEvent {
  id: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  time: string;
  creators: number;
  picks: number;
  featured?: boolean;
}
