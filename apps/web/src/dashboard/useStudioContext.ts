import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { hasDevStudioPreview } from '../lib/devDemoLogin';

/** Shared creator-studio queries and derived display fields. */
export function useStudioContext() {
  const devPreview = hasDevStudioPreview();
  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const creatorId = creator?._id;

  const dashboardSummary = useQuery(
    api.creators.dashboardSummary,
    creatorId ? { creatorId } : 'skip',
  );
  const subCount = useQuery(api.subscriptions.countByCreator, creatorId ? { creatorId } : 'skip');
  const subs = useQuery(
    api.subscriptions.byCreator,
    creatorId ? { creatorId, limit: 500 } : 'skip',
  );
  const picks = useQuery(api.picks.byCreator, creatorId ? { creatorId, limit: 500 } : 'skip');
  const tiers = useQuery(api.pricingTiers.byCreator, creatorId ? { creatorId } : 'skip');

  const isLive = Boolean(creatorId) && !devPreview;
  const summary = isLive ? dashboardSummary : null;

  const displayName = creator?.name ?? me?.name ?? (devPreview ? 'Elite Editor' : 'Creator');
  const activeSubs =
    summary?.activeSubs ??
    (typeof subCount === 'number' ? subCount : devPreview && !creatorId ? 420 : 0);

  const subsList = subs ?? [];
  const picksList = picks ?? [];
  const tiersList = tiers ?? [];

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newSubs7d = summary?.newSubs7d ?? subsList.filter((s) => s.startedAt >= weekAgo).length;
  const churnRate =
    summary?.churnRate != null
      ? String(summary.churnRate)
      : subsList.length > 0
        ? (
            (subsList.filter((s) => s.status === 'cancelled').length / subsList.length) *
            100
          ).toFixed(1)
        : null;

  const publishedPicks =
    summary?.publishedPicks ?? picksList.filter((p) => p.status === 'published').length;
  const hasTiers = tiersList.length > 0;
  const hasPublishedPick = publishedPicks > 0;
  const hasProfile = Boolean(creator?.bio?.trim() && creator?.niche);

  return {
    devPreview,
    me,
    creator,
    creatorId,
    dashboardSummary: summary,
    subCount,
    subs: subsList,
    picks: picksList,
    tiers: tiersList,
    displayName,
    activeSubs,
    newSubs7d: devPreview && !isLive && newSubs7d === 0 ? 18 : newSubs7d,
    churnRate: churnRate ?? (devPreview && !isLive ? '2.4' : null),
    publishedPicks: devPreview && !isLive && publishedPicks === 0 ? 156 : publishedPicks,
    hasTiers,
    hasPublishedPick: devPreview && !isLive ? true : hasPublishedPick,
    hasProfile: devPreview && !isLive ? false : hasProfile,
    winRate: creator
      ? `${((summary?.winRate ?? creator.winRate) * 100).toFixed(1)}%`
      : devPreview
        ? '58.2%'
        : '—',
    units: summary?.units ?? creator?.units ?? (devPreview ? '+14.2u' : '—'),
    record: creator?.record ?? (devPreview ? '92-66-4' : '—'),
    connectStatus: summary?.connectStatus ?? creator?.connectStatus ?? 'not_started',
    mrrEstimateCents: summary?.mrrEstimateCents,
    loading: Boolean(creatorId) && subs === undefined,
    subsLoading: Boolean(creatorId) && subs === undefined,
    picksLoading: Boolean(creatorId) && picks === undefined,
    tiersLoading: Boolean(creatorId) && tiers === undefined,
    isLive,
  };
}
