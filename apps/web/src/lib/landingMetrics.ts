type CreatorRow = {
  verified: boolean;
  winRate: number;
  trending?: boolean;
};

export interface LandingProofMetrics {
  verifiedCreators: number;
  totalCreators: number;
  networkWinRate: string;
  eventsTonight: number;
  liveEvents: number;
  trendingPicks: number;
  loading: boolean;
}

export function buildLandingProofMetrics(opts: {
  creators: CreatorRow[] | undefined;
  allEvents: unknown[] | undefined;
  liveEvents: unknown[] | undefined;
  trendingCount: number | undefined;
}): LandingProofMetrics {
  const loading =
    opts.creators === undefined ||
    opts.allEvents === undefined ||
    opts.liveEvents === undefined ||
    opts.trendingCount === undefined;

  const list = opts.creators ?? [];
  const verified = list.filter((c) => c.verified).length;
  const winRates = list.map((c) => (c.winRate <= 1 ? c.winRate * 100 : c.winRate));
  const avgWin = winRates.length > 0 ? winRates.reduce((a, b) => a + b, 0) / winRates.length : null;

  return {
    verifiedCreators: verified,
    totalCreators: list.length,
    networkWinRate: avgWin != null ? `${avgWin.toFixed(1)}%` : '—',
    eventsTonight: (opts.allEvents ?? []).length,
    liveEvents: (opts.liveEvents ?? []).length,
    trendingPicks: opts.trendingCount ?? 0,
    loading,
  };
}

/** Spotlight order: trending first, then by win rate. */
export function pickSpotlightCreators<T extends CreatorRow & { _id: string }>(
  list: T[],
  limit = 6,
): T[] {
  return [...list]
    .sort((a, b) => {
      const at = a.trending ? 1 : 0;
      const bt = b.trending ? 1 : 0;
      if (bt !== at) return bt - at;
      const aw = a.winRate <= 1 ? a.winRate : a.winRate / 100;
      const bw = b.winRate <= 1 ? b.winRate : b.winRate / 100;
      return bw - aw;
    })
    .slice(0, limit);
}
