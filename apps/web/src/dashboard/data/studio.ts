// =============================================================================
// Studio-only mock data — extras used by the /dashboard/* routes.
// CREATORS, EVENTS_TODAY, FEED_PICKS, SPORTS, and creatorById are shared with
// the public site and live in `apps/web/src/data/mock.ts` — re-export them here
// so dashboard pages have a single import surface.
// =============================================================================

export {
  CREATORS,
  EVENTS_TODAY,
  FEED_PICKS,
  SPORTS,
  creatorById,
} from '../../data/mock';
export type { Creator, GameEvent, FeedPick } from '../../data/mock';

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
  { id: 'sp1', title: 'Arsenal vs Man City — BTTS Yes', sport: 'Soccer', market: 'BTTS', access: 'premium', status: 'pending', date: 'Today 6:48 PM', views: 1284, saves: 312, units: '2u', odds: '-110' },
  { id: 'sp2', title: 'Saka Anytime Goalscorer', sport: 'Soccer', market: 'Goalscorer', access: 'premium', status: 'pending', date: 'Today 5:22 PM', views: 856, saves: 188, units: '1.5u', odds: '+165' },
  { id: 'sp3', title: 'Free preview · Liverpool ML', sport: 'Soccer', market: 'Moneyline', access: 'free', status: 'pending', date: 'Today 2:10 PM', views: 4012, saves: 522, units: '1u', odds: '-135' },
  { id: 'sp4', title: 'Weekend slate notes', sport: 'Soccer', market: 'Analysis', access: 'premium', status: 'scheduled', date: 'Tomorrow 9:00 AM', views: 0, saves: 0, units: '—', odds: '—' },
  { id: 'sp5', title: 'Mumbai vs Chennai preview', sport: 'Cricket', market: 'Match Total', access: 'premium', status: 'draft', date: 'Draft', views: 0, saves: 0, units: '—', odds: '—' },
  { id: 'sp6', title: 'Arsenal Over 1.5 Goals', sport: 'Soccer', market: 'Totals', access: 'premium', status: 'win', date: 'Yesterday', views: 2104, saves: 318, units: '2u', odds: '-145' },
  { id: 'sp7', title: 'Alcaraz Match Total Over 3.5 Sets', sport: 'Tennis', market: 'Set Totals', access: 'premium', status: 'loss', date: '2d ago', views: 1820, saves: 210, units: '1u', odds: '+110' },
  { id: 'sp8', title: 'Leverkusen ML', sport: 'Soccer', market: 'Moneyline', access: 'premium', status: 'win', date: '3d ago', views: 1402, saves: 244, units: '1.5u', odds: '+165' },
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
  { market: 'Goalscorer · Soccer', picks: 84, winRate: 0.643, units: '+24.6u', trend: [3, 5, 4, 6, 8, 7, 10, 12, 11, 14] },
  { market: 'Totals · Soccer', picks: 42, winRate: 0.595, units: '+11.2u', trend: [2, 3, 5, 4, 6, 8, 7, 9, 8, 11] },
  { market: 'Match Totals · Cricket', picks: 28, winRate: 0.571, units: '+6.8u', trend: [1, 2, 1, 3, 2, 4, 5, 4, 6, 7] },
  { market: 'Set Totals · Tennis', picks: 12, winRate: 0.500, units: '−1.2u', trend: [0, 1, 0, -1, 0, 1, 0, -1, 1, 0] },
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
