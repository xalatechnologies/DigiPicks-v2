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
    id: 'sharpedge', handle: '@sharpedgebets', name: 'SharpEdge Bets',
    avatar: { color: '#1F8A5B', mono: 'SE' },
    verified: true, niche: 'NFL Sides & Totals', sports: ['NFL'],
    bio: 'Former NFL analytics consultant. Sides + totals only. Closing line value tracked publicly since 2022.',
    subs: 1284, startingPrice: 39, winRate: 0.611, record: '47-30-3',
    last10: 'WWLWWLWWWL', units: '+38.4u', streak: 'W3',
    tags: ['Sides', 'Totals', 'CLV-tracked'], trending: true,
  },
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
    id: 'courtvision', handle: '@courtvisionpro', name: 'CourtVision Pro',
    avatar: { color: '#7A3A8E', mono: 'CV' },
    verified: true, niche: 'NBA Player Props', sports: ['NBA'],
    bio: 'Player props specialist. Pace and matchup-driven. Pre-game only, no live bets.',
    subs: 2104, startingPrice: 49, winRate: 0.628, record: '156-92-5',
    last10: 'WWLWWWLWWW', units: '+62.7u', streak: 'W4',
    tags: ['Player Props', 'NBA', 'Pre-game'], trending: true,
  },
  {
    id: 'goalline', handle: '@goallineinsider', name: 'GoalLine Insider',
    avatar: { color: '#8E5A3A', mono: 'GL' },
    verified: true, niche: 'NFL Props & Anytime TDs', sports: ['NFL'],
    bio: 'Anytime TD specialist. Receiving yardage and rushing props. Discipline > volume.',
    subs: 880, startingPrice: 35, winRate: 0.564, record: '110-85-2',
    last10: 'LWWLWWWLWL', units: '+14.1u', streak: 'L1',
    tags: ['Props', 'NFL', 'TDs'],
  },
  {
    id: 'icesharp', handle: '@icesharp', name: 'IceSharp NHL',
    avatar: { color: '#3A6E8E', mono: 'IS' },
    verified: true, niche: 'NHL Sides, SOG, Goalies', sports: ['NHL'],
    bio: 'NHL only. Goalie matchups, shots-on-goal props, puck line value.',
    subs: 421, startingPrice: 19, winRate: 0.598, record: '74-50-3',
    last10: 'WLWWWLWLWW', units: '+22.0u', streak: 'W1',
    tags: ['NHL', 'Goalies', 'Props'],
  },
  {
    id: 'proplab', handle: '@proplab', name: 'PropLab',
    avatar: { color: '#5B7A3A', mono: 'PL' },
    verified: false, niche: 'Cross-sport Player Props', sports: ['NBA', 'NFL', 'MLB'],
    bio: 'Multi-sport prop research. Model-driven. Newer but transparent log.',
    subs: 142, startingPrice: 15, winRate: 0.553, record: '38-31-1',
    last10: 'LWWLWWWLLW', units: '+6.8u', streak: 'W1',
    tags: ['Props', 'Model'], trending: false,
  },
];

export const SPORTS = ['NFL', 'NBA', 'NHL', 'MLB', 'Soccer', 'Tennis', 'UFC'];

export const EVENTS_TODAY: GameEvent[] = [
  { id: 'ev1', sport: 'NBA', league: 'NBA', home: 'Lakers', away: 'Nuggets', time: '7:30 PM ET', creators: 8, picks: 14, featured: true },
  { id: 'ev2', sport: 'NBA', league: 'NBA', home: 'Celtics', away: 'Knicks', time: '8:00 PM ET', creators: 6, picks: 11 },
  { id: 'ev3', sport: 'NHL', league: 'NHL', home: 'Rangers', away: 'Bruins', time: '7:00 PM ET', creators: 4, picks: 7 },
  { id: 'ev4', sport: 'NHL', league: 'NHL', home: 'Maple Leafs', away: 'Panthers', time: '7:30 PM ET', creators: 3, picks: 5 },
  { id: 'ev5', sport: 'Soccer', league: 'EPL', home: 'Arsenal', away: 'Man City', time: '3:30 PM ET', creators: 5, picks: 9, featured: true },
  { id: 'ev6', sport: 'Soccer', league: 'Bundesliga', home: 'Leverkusen', away: 'Dortmund', time: '12:30 PM ET', creators: 3, picks: 5 },
  { id: 'ev7', sport: 'Tennis', league: 'ATP Madrid', home: 'Alcaraz', away: 'Sinner', time: '2:00 PM ET', creators: 4, picks: 6 },
  { id: 'ev8', sport: 'NFL', league: 'NFL Draft', home: 'Round 1', away: '', time: '8:00 PM ET', creators: 2, picks: 3 },
];

export const FEED_PICKS: FeedPick[] = [
  {
    id: 'p1', creator: 'courtvision', access: 'premium',
    sport: 'NBA', league: 'NBA',
    event: 'Lakers vs Nuggets', eventTime: 'Tonight 7:30 PM ET',
    title: 'Lakers 1H Total — Over 112.5',
    market: '1H Over/Under', selection: 'Over 112.5', odds: '-110',
    units: '2.5u', confidence: 'High',
    posted: '42m ago', status: 'pending',
    teaser: 'Both teams hovering 53–55% pace tier in last 5 games against quality defenses; Denver coming off back-to-back…',
  },
  {
    id: 'p2', creator: 'sharpedge', access: 'free',
    sport: 'NFL', league: 'NFL',
    event: 'NFL Draft Night One', eventTime: 'Tonight 8:00 PM ET',
    title: 'Chargers Position — Defense (First Pick)',
    market: 'Draft Prop', selection: 'Defense', odds: '+135',
    units: '1u', confidence: 'Medium',
    posted: '2h ago', status: 'pending',
    body: 'Big board reads pulled from three insider sources cross-referenced with team needs. Chargers DC hire signals…',
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
    id: 'p4', creator: 'icesharp', access: 'free',
    sport: 'NHL', league: 'NHL',
    event: 'Rangers vs Bruins', eventTime: 'Tonight 7:00 PM ET',
    title: 'Shesterkin Saves Over 28.5',
    market: 'Goalie Saves O/U', selection: 'Over 28.5', odds: '-115',
    units: '2u', confidence: 'High',
    posted: '1h ago', status: 'pending',
    body: 'Boston averaging 32.4 SOG/60 over last 8 games. Shesterkin matchup spreads well above prop line in tracked sample.',
  },
  {
    id: 'p5', creator: 'goalline', access: 'premium',
    sport: 'NFL', league: 'NFL',
    event: 'Reagan Bowl Replay (Practice)', eventTime: 'Tomorrow',
    title: 'Mahomes Passing Yards — Over 274.5',
    market: 'Player Passing Yards', selection: 'Over 274.5', odds: '-105',
    units: '1.5u', confidence: 'High',
    posted: '8h ago', status: 'pending',
    teaser: "Defensive scheme they'll face has surrendered 290+ in 7 of last 9 to top-12 QBs…",
  },
];

export function creatorById(id: string): Creator | undefined {
  return CREATORS.find((c) => c.id === id);
}
