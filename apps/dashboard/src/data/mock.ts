// =============================================================================
// Mock Data — Creator Studio dashboard
// Mirrors the shape used by apps/web so we can swap to Convex via @digipicks/sdk.
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

// ── Studio-specific mocks ────────────────────────────────────────────────

export interface StudioPick {
  id: string;
  title: string;
  sport: string;
  market: string;
  access: 'free' | 'premium' | 'vip';
  status: 'win' | 'loss' | 'push' | 'pending' | 'draft' | 'scheduled';
  date: string;
  views: number;
  saves: number;
  units: string;
  odds: string;
}

export const STUDIO_PICKS: StudioPick[] = [
  { id: 'sp1', title: 'Lakers vs Nuggets — H1 Total Over 112.5', sport: 'NBA', market: 'Totals', access: 'premium', status: 'pending', date: 'Today 6:48 PM', views: 1284, saves: 312, units: '2u', odds: '-110' },
  { id: 'sp2', title: 'Dončić Over 7.5 assists', sport: 'NBA', market: 'Player Prop', access: 'premium', status: 'pending', date: 'Today 5:22 PM', views: 856, saves: 188, units: '1.5u', odds: '+105' },
  { id: 'sp3', title: 'Free preview · Knicks ML', sport: 'NBA', market: 'Moneyline', access: 'free', status: 'pending', date: 'Today 2:10 PM', views: 4012, saves: 522, units: '1u', odds: '-135' },
  { id: 'sp4', title: 'Friday slate notes', sport: 'NBA', market: 'Analysis', access: 'premium', status: 'scheduled', date: 'Tomorrow 9:00 AM', views: 0, saves: 0, units: '—', odds: '—' },
  { id: 'sp5', title: 'Bills vs Chiefs preview', sport: 'NFL', market: 'Spread', access: 'premium', status: 'draft', date: 'Draft', views: 0, saves: 0, units: '—', odds: '—' },
  { id: 'sp6', title: 'Celtics ML at home', sport: 'NBA', market: 'Moneyline', access: 'premium', status: 'win', date: 'Yesterday', views: 2104, saves: 318, units: '2u', odds: '-145' },
  { id: 'sp7', title: 'Tatum Over 4.5 threes', sport: 'NBA', market: 'Player Prop', access: 'premium', status: 'loss', date: '2d ago', views: 1820, saves: 210, units: '1u', odds: '+110' },
  { id: 'sp8', title: 'Rangers PL -1.5', sport: 'NHL', market: 'Puckline', access: 'premium', status: 'win', date: '3d ago', views: 1402, saves: 244, units: '1.5u', odds: '+165' },
  { id: 'sp9', title: 'Arsenal/Spurs Over 2.5', sport: 'Soccer', market: 'Totals', access: 'free', status: 'win', date: '4d ago', views: 5210, saves: 612, units: '1u', odds: '-120' },
];

export interface StudioSubscriber {
  id: string;
  name: string;
  mono: string;
  color: string;
  email: string;
  plan: 'Premium' | 'VIP' | 'Trial';
  status: 'active' | 'past_due' | 'churned';
  joined: string;
  ltv: string;
}

export const STUDIO_SUBSCRIBERS: StudioSubscriber[] = [
  { id: 'u1', name: 'Avery Dunne', mono: 'AD', color: '#1F8A5B', email: 'avery@example.com', plan: 'VIP', status: 'active', joined: '94d', ltv: '$184.00' },
  { id: 'u2', name: 'Jordan Park', mono: 'JP', color: '#3A4F7A', email: 'jp@example.com', plan: 'Premium', status: 'active', joined: '212d', ltv: '$294.00' },
  { id: 'u3', name: 'Mina Khoury', mono: 'MK', color: '#7A3A8E', email: 'mina@example.com', plan: 'Premium', status: 'active', joined: '38d', ltv: '$58.00' },
  { id: 'u4', name: 'Diego Salas', mono: 'DS', color: '#8E5A3A', email: 'd.salas@example.com', plan: 'Trial', status: 'active', joined: '4d', ltv: '$0.00' },
  { id: 'u5', name: 'Riley Ahmadi', mono: 'RA', color: '#3A6E8E', email: 'riley@example.com', plan: 'VIP', status: 'past_due', joined: '161d', ltv: '$248.00' },
  { id: 'u6', name: 'Sam Kowalski', mono: 'SK', color: '#5B7A3A', email: 'samk@example.com', plan: 'Premium', status: 'active', joined: '76d', ltv: '$112.00' },
  { id: 'u7', name: 'Cleo Vega', mono: 'CV', color: '#8E3A5B', email: 'cleo@example.com', plan: 'Premium', status: 'churned', joined: '305d', ltv: '$408.00' },
  { id: 'u8', name: 'Theo Brand', mono: 'TB', color: '#3A8E7A', email: 'theo@example.com', plan: 'Premium', status: 'active', joined: '128d', ltv: '$176.00' },
];

export interface MarketPerf {
  market: string;
  picks: number;
  winRate: number;
  units: string;
  trend: number[];
}

export const MARKET_PERF: MarketPerf[] = [
  { market: 'Player Props · NBA', picks: 84, winRate: 0.643, units: '+24.6u', trend: [3, 5, 4, 6, 8, 7, 10, 12, 11, 14] },
  { market: 'Totals · NBA', picks: 42, winRate: 0.595, units: '+11.2u', trend: [2, 3, 5, 4, 6, 8, 7, 9, 8, 11] },
  { market: 'Moneyline · NBA', picks: 28, winRate: 0.571, units: '+6.8u', trend: [1, 2, 1, 3, 2, 4, 5, 4, 6, 7] },
  { market: 'Spreads · NFL', picks: 12, winRate: 0.500, units: '−1.2u', trend: [0, 1, 0, -1, 0, 1, 0, -1, 1, 0] },
];

export interface Conversation {
  id: string;
  name: string;
  mono: string;
  color: string;
  preview: string;
  time: string;
  unread?: boolean;
}

export const CONVERSATIONS: Conversation[] = [
  { id: 'c1', name: 'Avery Dunne', mono: 'AD', color: '#1F8A5B', preview: "Quick q on the Lakers H1 line — what's your read…", time: '12m', unread: true },
  { id: 'c2', name: 'Jordan Park', mono: 'JP', color: '#3A4F7A', preview: 'Renewed for VIP, thanks for the props notes', time: '2h', unread: true },
  { id: 'c3', name: 'Riley Ahmadi', mono: 'RA', color: '#3A6E8E', preview: 'Card on file failed — updating now', time: '5h', unread: true },
  { id: 'c4', name: 'Mina Khoury', mono: 'MK', color: '#7A3A8E', preview: 'Will the Friday slate include UFC?', time: '1d' },
  { id: 'c5', name: 'Theo Brand', mono: 'TB', color: '#3A8E7A', preview: "Appreciate the Tatum unders heads-up", time: '2d' },
];

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
}

export const INVOICES: Invoice[] = [
  { id: 'inv-204', date: 'May 1, 2026', description: 'April payout · Premium + VIP', amount: '$10,842.10', status: 'paid' },
  { id: 'inv-203', date: 'Apr 1, 2026', description: 'March payout · Premium + VIP', amount: '$9,418.40', status: 'paid' },
  { id: 'inv-202', date: 'Mar 1, 2026', description: 'February payout · Premium + VIP', amount: '$8,602.00', status: 'paid' },
  { id: 'inv-201', date: 'Feb 1, 2026', description: 'January payout · Premium + VIP', amount: '$8,114.50', status: 'paid' },
];

export function creatorById(id: string): Creator | undefined {
  return CREATORS.find((c) => c.id === id);
}
