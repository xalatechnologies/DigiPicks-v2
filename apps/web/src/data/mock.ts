// =============================================================================
// Mock Data — ported from prototype data.jsx
// Will be replaced by Convex queries via @digipicks/sdk
// =============================================================================

export interface Creator {
  id: string;
  handle: string;
  name: string;
  avatar: { color: string; mono: string };
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

export interface GameEvent {
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

export interface FeedPick {
  id: string;
  creator: string;
  access: 'free' | 'premium' | 'vip';
  sport: string;
  league: string;
  event: string;
  eventTime: string;
  title: string;
  market: string;
  selection: string;
  odds: string;
  units: string;
  confidence: string;
  posted: string;
  status: string;
  body?: string;
  teaser?: string;
}

export const CREATORS: Creator[] = [
  {
    id: 'nordic', handle: '@nordicpicks', name: 'Nordic Picks',
    avatar: { color: '#3A4F7A', mono: 'NP' },
    verified: true, niche: 'Soccer & Tennis Props', sports: ['Soccer', 'Tennis'],
    bio: 'EPL, Bundesliga, ATP/WTA props. Disciplined unit sizing. No parlays.',
    subs: 612, startingPrice: 25, winRate: 0.586, record: '92-65-8',
    last10: 'WWWLWLWWLW', units: '+21.2u', streak: 'W2',
    tags: ['Props', 'Soccer', 'Tennis'], trending: true,
  },
  {
    id: 'sharpedge', handle: '@sharpedgebets', name: 'SharpEdge Bets',
    avatar: { color: '#1F8A5B', mono: 'SE' },
    verified: true, niche: 'Soccer Sides & Totals', sports: ['Soccer'],
    bio: 'EPL and Champions League specialist. Sides + totals only. CLV-tracked since 2023.',
    subs: 1284, startingPrice: 39, winRate: 0.611, record: '47-30-3',
    last10: 'WWLWWLWWWL', units: '+38.4u', streak: 'W3',
    tags: ['Sides', 'Totals', 'CLV-tracked'], trending: true,
  },
  {
    id: 'courtvision', handle: '@courtvisionpro', name: 'CourtVision Pro',
    avatar: { color: '#7A3A8E', mono: 'CV' },
    verified: true, niche: 'Cricket Match Totals', sports: ['Cricket'],
    bio: 'IPL and international cricket match totals. Pitch and weather model-driven.',
    subs: 2104, startingPrice: 49, winRate: 0.628, record: '156-92-5',
    last10: 'WWLWWWLWWW', units: '+62.7u', streak: 'W4',
    tags: ['Match Totals', 'Cricket', 'IPL'], trending: true,
  },
  {
    id: 'goalline', handle: '@goallineinsider', name: 'GoalLine Insider',
    avatar: { color: '#8E5A3A', mono: 'GL' },
    verified: true, niche: 'Soccer Goalscorer Props', sports: ['Soccer'],
    bio: 'Anytime goalscorer specialist. xG model + set-piece data. Discipline > volume.',
    subs: 880, startingPrice: 35, winRate: 0.564, record: '110-85-2',
    last10: 'LWWLWWWLWL', units: '+14.1u', streak: 'L1',
    tags: ['Goalscorer', 'Soccer', 'xG'],
  },
  {
    id: 'acesharp', handle: '@acesharp', name: 'AceSharp Tennis',
    avatar: { color: '#3A6E8E', mono: 'AS' },
    verified: true, niche: 'Tennis Sides & Set Totals', sports: ['Tennis'],
    bio: 'ATP/WTA specialist. Surface-adjusted models, set spreads, and match totals.',
    subs: 421, startingPrice: 19, winRate: 0.598, record: '74-50-3',
    last10: 'WLWWWLWLWW', units: '+22.0u', streak: 'W1',
    tags: ['Tennis', 'ATP', 'Totals'],
  },
  {
    id: 'proplab', handle: '@proplab', name: 'PropLab',
    avatar: { color: '#5B7A3A', mono: 'PL' },
    verified: false, niche: 'Cross-sport Player Props', sports: ['Soccer', 'Cricket', 'Tennis'],
    bio: 'Multi-sport prop research. Model-driven. Newer but transparent log.',
    subs: 142, startingPrice: 15, winRate: 0.553, record: '38-31-1',
    last10: 'LWWLWWWLLW', units: '+6.8u', streak: 'W1',
    tags: ['Props', 'Model'], trending: false,
  },
];

export const SPORTS = ['Soccer', 'Cricket', 'Tennis'];

export const EVENTS_TODAY: GameEvent[] = [
  { id: 'ev1', sport: 'Soccer', league: 'EPL', home: 'Arsenal', away: 'Man City', time: '3:30 PM ET', creators: 8, picks: 14, featured: true },
  { id: 'ev2', sport: 'Soccer', league: 'EPL', home: 'Liverpool', away: 'Chelsea', time: '4:00 PM ET', creators: 6, picks: 11 },
  { id: 'ev3', sport: 'Soccer', league: 'La Liga', home: 'Real Madrid', away: 'Barcelona', time: '3:00 PM ET', creators: 5, picks: 9, featured: true },
  { id: 'ev4', sport: 'Soccer', league: 'Bundesliga', home: 'Leverkusen', away: 'Dortmund', time: '12:30 PM ET', creators: 3, picks: 5 },
  { id: 'ev5', sport: 'Cricket', league: 'IPL', home: 'Mumbai Indians', away: 'Chennai Super Kings', time: '2:00 PM ET', creators: 4, picks: 7 },
  { id: 'ev6', sport: 'Cricket', league: 'IPL', home: 'Royal Challengers', away: 'Delhi Capitals', time: '6:00 PM ET', creators: 3, picks: 5 },
  { id: 'ev7', sport: 'Tennis', league: 'ATP Madrid', home: 'Alcaraz', away: 'Sinner', time: '2:00 PM ET', creators: 4, picks: 6 },
  { id: 'ev8', sport: 'Tennis', league: 'WTA Madrid', home: 'Swiatek', away: 'Sabalenka', time: '11:00 AM ET', creators: 2, picks: 3 },
];

export const FEED_PICKS: FeedPick[] = [
  {
    id: 'p1', creator: 'courtvision', access: 'premium',
    sport: 'Cricket', league: 'IPL',
    event: 'Mumbai Indians vs Chennai Super Kings', eventTime: 'Today 2:00 PM ET',
    title: 'Match Total — Over 340.5 runs',
    market: 'Match Totals', selection: 'Over 340.5', odds: '-110',
    units: '2.5u', confidence: 'High',
    posted: '42m ago', status: 'pending',
    teaser: 'Wankhede pitch historically favours batters — last 5 IPL matches here averaged 365 runs combined…',
  },
  {
    id: 'p2', creator: 'sharpedge', access: 'free',
    sport: 'Soccer', league: 'EPL',
    event: 'Arsenal vs Man City', eventTime: 'Today 3:30 PM ET',
    title: 'Arsenal Draw No Bet',
    market: 'Moneyline', selection: 'Arsenal DNB', odds: '+135',
    units: '1u', confidence: 'Medium',
    posted: '2h ago', status: 'pending',
    body: 'Arsenal unbeaten at home in 18 league matches. City missing Rodri and Stones. xG model favours the hosts.',
  },
  {
    id: 'p3', creator: 'nordic', access: 'premium',
    sport: 'Soccer', league: 'EPL',
    event: 'Arsenal vs Man City', eventTime: 'Today 3:30 PM ET',
    title: 'Saka Anytime Goal Scorer',
    market: 'Player Goalscorer', selection: 'Saka Anytime', odds: '+165',
    units: '1.5u', confidence: 'Medium',
    posted: '5h ago', status: 'pending',
    teaser: 'City fullback rotation suggests Akanji at LB, Saka has scored in 4 of his last 5 vs City…',
  },
  {
    id: 'p4', creator: 'acesharp', access: 'free',
    sport: 'Tennis', league: 'ATP Madrid',
    event: 'Alcaraz vs Sinner', eventTime: 'Today 2:00 PM ET',
    title: 'Match Total Sets — Over 3.5',
    market: 'Set Totals', selection: 'Over 3.5 sets', odds: '-115',
    units: '2u', confidence: 'High',
    posted: '1h ago', status: 'pending',
    body: 'H2H record is 5-5 with 7 of 10 going 4+ sets. Clay surface adds variance on serve. Both in strong form.',
  },
  {
    id: 'p5', creator: 'goalline', access: 'premium',
    sport: 'Soccer', league: 'La Liga',
    event: 'Real Madrid vs Barcelona', eventTime: 'Today 3:00 PM ET',
    title: 'Both Teams to Score — Yes',
    market: 'BTTS', selection: 'Yes', odds: '-105',
    units: '1.5u', confidence: 'High',
    posted: '8h ago', status: 'pending',
    teaser: 'El Clasico has seen BTTS land in 8 of the last 10 meetings. Both sides missing key defenders…',
  },
];

export function creatorById(id: string): Creator | undefined {
  return CREATORS.find((c) => c.id === id);
}
