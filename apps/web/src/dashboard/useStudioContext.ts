import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { hasDevStudioPreview } from '../lib/devDemoLogin';

/** Shared creator-studio queries and derived display fields. */
export function useStudioContext() {
  const devPreview = hasDevStudioPreview();
  const me = useQuery(api.users.meSafe);
  const creator = useQuery(api.creators.get, me?.creatorId ? { id: me.creatorId } : 'skip');
  const creatorId = creator?._id;

  const subCount = useQuery(api.subscriptions.countByCreator, creatorId ? { creatorId } : 'skip');
  const subs = useQuery(
    api.subscriptions.byCreator,
    creatorId ? { creatorId, limit: 500 } : 'skip',
  );
  const picks = useQuery(api.picks.byCreator, creatorId ? { creatorId, limit: 500 } : 'skip');
  const tiers = useQuery(api.pricingTiers.byCreator, creatorId ? { creatorId } : 'skip');

  const displayName = creator?.name ?? me?.name ?? (devPreview ? 'Elite Editor' : 'Creator');
  const activeSubs = typeof subCount === 'number' ? subCount : devPreview && !creatorId ? 420 : 0;

  const subsList = subs ?? [];
  const picksList = picks ?? [];
  const tiersList = tiers ?? [];

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newSubs7d = subsList.filter((s) => s.startedAt >= weekAgo).length;
  const cancelled = subsList.filter((s) => s.status === 'cancelled').length;
  const churnRate = subsList.length > 0 ? ((cancelled / subsList.length) * 100).toFixed(1) : null;

  const publishedPicks = picksList.filter((p) => p.status === 'published').length;
  const hasTiers = tiersList.length > 0;
  const hasPublishedPick = publishedPicks > 0;
  const hasProfile = Boolean(creator?.bio?.trim() && creator?.niche);

  return {
    devPreview,
    me,
    creator,
    creatorId,
    subCount,
    subs: subsList,
    picks: picksList,
    tiers: tiersList,
    displayName,
    activeSubs,
    newSubs7d: devPreview && newSubs7d === 0 ? 18 : newSubs7d,
    churnRate: churnRate ?? (devPreview ? '2.4' : null),
    publishedPicks: devPreview && publishedPicks === 0 ? 156 : publishedPicks,
    hasTiers,
    hasPublishedPick: devPreview ? true : hasPublishedPick,
    hasProfile: devPreview ? false : hasProfile,
    winRate: creator ? `${(creator.winRate * 100).toFixed(1)}%` : devPreview ? '58.2%' : '—',
    units: creator?.units ?? (devPreview ? '+14.2u' : '—'),
    record: creator?.record ?? (devPreview ? '92-66-4' : '—'),
    loading: Boolean(creatorId) && subs === undefined,
    subsLoading: Boolean(creatorId) && subs === undefined,
    picksLoading: Boolean(creatorId) && picks === undefined,
    tiersLoading: Boolean(creatorId) && tiers === undefined,
    isLive: Boolean(creatorId) && !devPreview,
  };
}
