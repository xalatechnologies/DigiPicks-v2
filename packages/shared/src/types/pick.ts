// =============================================================================
// Pick — Structured pick data, results, statuses
// =============================================================================

export type PickAccess = 'free' | 'premium' | 'vip';
export type PickStatus = 'pending' | 'published' | 'draft' | 'scheduled';
export type PickConfidence = 'Low' | 'Medium' | 'High';
export type GradeResult = 'win' | 'loss' | 'push' | 'pending';

export interface Pick {
  id: string;
  creator: string;
  access: PickAccess;
  sport: string;
  league: string;
  event: string;
  eventTime: string;
  title: string;
  market: string;
  selection: string;
  odds: string;
  units: string;
  confidence: PickConfidence;
  posted: string;
  status: PickStatus;
  teaser?: string;
  body?: string;
}

export interface PickResult {
  id: string;
  creator: string;
  title: string;
  odds: string;
  units: string;
  result: GradeResult;
  netUnits: string;
  date: string;
  sport: string;
}

export interface PostManagerEntry {
  id: string;
  title: string;
  event: string;
  access: PickAccess;
  status: PickStatus;
  pubDate: string;
  views: number;
  saves: number;
  grade: GradeResult | null;
}
