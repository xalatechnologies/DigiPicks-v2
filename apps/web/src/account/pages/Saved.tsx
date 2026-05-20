import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Grid,
  Button,
  Tabs,
  Search,
  FilterChips,
  EmptyState,
  StudioPageHeader,
  AccountRefineCard,
  StudioFilterPills,
  SavedPickCard,
  SavedFindMoreCard,
  AccountSavedLibraryFooter,
  CreatorExploreCard,
  Muted,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { accountCrossLinks } from '../../lib/accountCrossLinks';
import type { Id } from '../../../../../convex/_generated/dataModel';

type LibraryTab = 'picks' | 'creators' | 'archived';

const LIBRARY_TABS = [
  { label: 'Saved picks', value: 'picks' },
  { label: 'Saved creators', value: 'creators' },
  { label: 'Archived', value: 'archived' },
];

const SORT_OPTIONS = [
  { label: 'Recently saved', value: 'recent' },
  { label: 'Event date', value: 'event' },
  { label: 'Creator name', value: 'creator' },
];

const STATUS_FILTERS = ['Pending', 'Win', 'Loss', 'Push'];

const STATUS_CHIP_OPTIONS = STATUS_FILTERS.map((label) => ({
  label,
  value: label.toLowerCase(),
}));

function formatSavedLabel(ms: number): string {
  const d = new Date(ms);
  return `Saved ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function creatorTagline(niche?: string, sports?: string[]): string | undefined {
  if (niche) return niche.toUpperCase();
  if (sports && sports.length > 0) return sports.slice(0, 2).join(' · ').toUpperCase();
  return undefined;
}

function pickExcerpt(body?: string, teaser?: string, locked?: boolean): string | undefined {
  if (locked) return teaser ?? 'Premium analysis hidden — subscribe to unlock.';
  return body ?? teaser;
}

export function Saved() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<LibraryTab>('picks');
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null);
  const [sort, setSort] = useState('recent');

  const savedPicks = useQuery(api.savedPicks.list, { limit: 200 });
  const followed = useQuery(api.followedCreators.listMine, { limit: 200 });
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const unsave = useMutation(api.savedPicks.unsave);
  const unfollow = useMutation(api.followedCreators.unfollow);

  const subscribedCreatorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const sub of subs ?? []) {
      if (sub.status === 'active') ids.add(sub.creatorId);
    }
    return ids;
  }, [subs]);

  const sportOptions = useMemo(() => {
    const sports = new Set<string>();
    for (const row of savedPicks ?? []) {
      if (row.pick.sport) sports.add(row.pick.sport);
    }
    return [...sports].sort();
  }, [savedPicks]);

  const creatorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of savedPicks ?? []) {
      if (row.creator) map.set(row.creator._id, row.creator.name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [savedPicks]);

  const filteredPicks = useMemo(() => {
    let list = savedPicks ?? [];

    if (tab === 'archived') {
      list = list.filter((row) => row.pick.grade && row.pick.grade !== 'pending');
    } else if (tab === 'picks') {
      list = list.filter((row) => !row.pick.grade || row.pick.grade === 'pending');
    }

    if (sportFilter) {
      list = list.filter((row) => row.pick.sport === sportFilter);
    }

    if (creatorFilter) {
      list = list.filter((row) => row.creator?._id === creatorFilter);
    }

    if (statusFilter) {
      const grade = statusFilter.toLowerCase();
      list = list.filter((row) => (row.pick.grade ?? 'pending') === grade);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((row) => {
        const c = row.creator;
        return (
          row.pick.title.toLowerCase().includes(q) ||
          row.pick.eventName?.toLowerCase().includes(q) ||
          row.pick.sport.toLowerCase().includes(q) ||
          c?.name.toLowerCase().includes(q) ||
          c?.handle.toLowerCase().includes(q)
        );
      });
    }

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'event':
          return (a.pick.eventTime ?? '').localeCompare(b.pick.eventTime ?? '');
        case 'creator':
          return (a.creator?.name ?? '').localeCompare(b.creator?.name ?? '');
        case 'recent':
        default:
          return b.savedAt - a.savedAt;
      }
    });

    return list;
  }, [savedPicks, tab, sportFilter, creatorFilter, statusFilter, search, sort]);

  const filteredCreators = useMemo(() => {
    let list = followed ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (row) =>
          row.creator.name.toLowerCase().includes(q) ||
          row.creator.handle.toLowerCase().includes(q) ||
          row.creator.niche.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.followedAt - a.followedAt);
  }, [followed, search]);

  const gradedWins = useMemo(() => {
    const graded = (savedPicks ?? []).filter((r) => r.pick.grade && r.pick.grade !== 'pending');
    if (graded.length === 0) return null;
    const wins = graded.filter((r) => r.pick.grade === 'win').length;
    return Math.round((wins / graded.length) * 100);
  }, [savedPicks]);

  async function handleUnsave(pickId: Id<'picks'>) {
    try {
      await unsave({ pickId });
    } catch {
      /* useQuery recovers */
    }
  }

  async function handleUnfollow(creatorId: Id<'creators'>) {
    try {
      await unfollow({ creatorId });
    } catch {
      /* useQuery recovers */
    }
  }

  function openPick(
    creatorHandle: string | undefined,
    locked: boolean,
    creatorId: Id<'creators'> | undefined,
  ) {
    if (locked && creatorId) {
      navigate('/account/subscriptions');
      return;
    }
    if (creatorHandle) navigate(`/creators/${creatorHandle}`);
  }

  const picksLoading = savedPicks === undefined;
  const creatorsLoading = followed === undefined;
  const picksEmpty = !picksLoading && filteredPicks.length === 0;
  const creatorsEmpty = !creatorsLoading && filteredCreators.length === 0;

  const showPickToolbar = tab === 'picks' || tab === 'archived';

  const hasActiveFilters =
    tab === 'creators'
      ? Boolean(search.trim())
      : Boolean(sportFilter || creatorFilter || statusFilter || search.trim());

  function clearLibraryFilters() {
    setSearch('');
    setSportFilter(null);
    setCreatorFilter(null);
    setStatusFilter(null);
    setSort('recent');
  }

  const refineSummary =
    tab === 'creators'
      ? creatorsLoading
        ? 'Loading saved creators…'
        : `${filteredCreators.length} creator${filteredCreators.length === 1 ? '' : 's'} in view`
      : picksLoading
        ? 'Loading saved picks…'
        : `${filteredPicks.length} pick${filteredPicks.length === 1 ? '' : 's'} in view`;

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Library"
          title="Saved picks"
          sub="Revisit the elite picks and analytical posts you've curated for your strategy."
        />

        <Tabs
          tabs={LIBRARY_TABS}
          value={tab}
          onChange={(v) => setTab(v as LibraryTab)}
          ariaLabel="Saved library sections"
        />

        <AccountRefineCard
          title="Refine library"
          sub={
            tab === 'creators'
              ? 'Search creators you have bookmarked.'
              : 'Search saved picks, then narrow by sport, creator, or grade.'
          }
          summary={refineSummary}
          onReset={hasActiveFilters ? clearLibraryFilters : undefined}
        >
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === 'creators' ? 'Search saved creators' : 'Search saved picks and events'
            }
            aria-label={tab === 'creators' ? 'Search saved creators' : 'Search saved items'}
          />
          {showPickToolbar ? (
            <>
              <StudioFilterPills
                options={SORT_OPTIONS}
                value={sort}
                onChange={setSort}
                ariaLabel="Sort saved picks"
                nowrap
              />
              {sportOptions.length > 0 ? (
                <FilterChips
                  options={sportOptions.map((s) => ({ label: s, value: s }))}
                  value={sportFilter}
                  onChange={setSportFilter}
                  allLabel="All sports"
                />
              ) : null}
              {creatorOptions.length > 1 ? (
                <FilterChips
                  options={creatorOptions.map((c) => ({ label: c.name, value: c.id }))}
                  value={creatorFilter}
                  onChange={setCreatorFilter}
                  allLabel="All creators"
                />
              ) : null}
              {tab === 'archived' || tab === 'picks' ? (
                <FilterChips
                  options={STATUS_CHIP_OPTIONS}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allLabel="All grades"
                />
              ) : null}
            </>
          ) : null}
        </AccountRefineCard>

        {tab !== 'creators' && picksLoading && (
          <EmptyState icon="bookmark" title="Loading your library…" />
        )}

        {tab !== 'creators' && picksEmpty && (
          <EmptyState
            icon="bookmark"
            title={tab === 'archived' ? 'No archived picks yet.' : 'Nothing saved yet.'}
            subtitle={
              tab === 'archived'
                ? 'Graded picks you bookmarked will appear here after results are in.'
                : 'Tap Save on any pick in your feed to bookmark it here.'
            }
            action={
              <Button
                variant="primary"
                size="sm"
                iconRight="arrow-right"
                onClick={() => navigate(tab === 'archived' ? '/account' : '/account')}
              >
                {tab === 'archived' ? 'Back to dashboard' : 'Open dashboard'}
              </Button>
            }
          />
        )}

        {tab !== 'creators' && !picksEmpty && (
          <Grid cols={3} gap={6}>
            {filteredPicks.map(({ pick, creator, savedAt }) => {
              const locked =
                pick.access !== 'free' && creator != null && !subscribedCreatorIds.has(creator._id);
              return (
                <SavedPickCard
                  key={pick._id}
                  creatorName={creator?.name ?? 'Unknown'}
                  creatorMono={creator?.avatarMono ?? 'U'}
                  creatorColor={creator?.avatarColor ?? '#3A4F7A'}
                  creatorVerified={creator?.verified}
                  creatorTag={creatorTagline(creator?.niche, creator?.sports)}
                  event={pick.eventName ?? 'Event'}
                  sport={pick.sport}
                  title={pick.title}
                  excerpt={pickExcerpt(pick.body, pick.teaser, locked)}
                  savedLabel={formatSavedLabel(savedAt)}
                  locked={locked}
                  onCreatorClick={
                    creator ? () => navigate(`/creators/${creator.handle}`) : undefined
                  }
                  onRemove={() => handleUnsave(pick._id)}
                  onOpen={() => openPick(creator?.handle, locked, creator?._id)}
                />
              );
            })}
            {tab === 'picks' ? <SavedFindMoreCard onClick={() => navigate('/account')} /> : null}
          </Grid>
        )}

        {tab === 'creators' && creatorsLoading && (
          <EmptyState icon="users" title="Loading saved creators…" />
        )}

        {tab === 'creators' && creatorsEmpty && (
          <EmptyState
            icon="users"
            title="No saved creators yet."
            subtitle="Follow creators from Discover or a profile to track them here."
            action={
              <Button
                variant="primary"
                size="sm"
                iconRight="arrow-right"
                onClick={() => navigate('/account/discover')}
              >
                Discover creators
              </Button>
            }
          />
        )}

        {tab === 'creators' && !creatorsEmpty && (
          <Grid cols={3} gap={6}>
            {filteredCreators.map(({ creator, followedAt }) => (
              <Stack key={creator._id} gap={3}>
                <CreatorExploreCard
                  name={creator.name}
                  niche={creator.niche}
                  mono={creator.avatarMono}
                  color={creator.avatarColor}
                  badge={creator.verified ? 'Verified' : undefined}
                  tags={creator.sports?.slice(0, 3)}
                  winRate={creator.winRate}
                  units={creator.units}
                  followers={creator.subscriberCount}
                  ctaLabel="View profile"
                  onClick={() => navigate(`/creators/${creator.handle}`)}
                />
                <Row gap={2} between>
                  <Muted>Followed {formatSavedLabel(followedAt).replace('Saved ', '')}</Muted>
                  <Button variant="ghost" size="sm" onClick={() => handleUnfollow(creator._id)}>
                    Unfollow
                  </Button>
                </Row>
              </Stack>
            ))}
            <SavedFindMoreCard
              title="Find more creators"
              subtitle="Browse Discover to follow analysts you want in your library."
              onClick={() => navigate('/account/discover')}
            />
          </Grid>
        )}

        {(tab === 'picks' || tab === 'archived') && !picksEmpty ? (
          <AccountSavedLibraryFooter
            streakTitle="Your winning streak"
            streakBody={
              gradedWins != null
                ? `Picks from your saved library are hitting at ${gradedWins}% on graded calls. Track placements from your dashboard.`
                : 'Save picks from your feed and track how your bookmarked calls perform once graded.'
            }
            streakActions={
              <>
                <Button variant="secondary" onClick={() => navigate('/account')}>
                  Go to dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/account/results')}>
                  View statistics
                </Button>
              </>
            }
            tipBody="Elite picks often see line movement within two hours of posting. Turn on notifications so you never miss an entry window for saved creators."
            tipMeta="Recommended for active subscribers"
          />
        ) : null}

        <QuickActionGrid title="Related" items={accountCrossLinks('saved', navigate)} />
      </Stack>
    </Container>
  );
}
