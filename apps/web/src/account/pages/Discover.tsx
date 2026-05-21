import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import {
  Container,
  Stack,
  Grid,
  Button,
  AccountRefineCard,
  Icon,
  Search,
  FilterChips,
  EmptyState,
  Muted,
  StudioPageHeader,
  StudioDashLayout,
  StudioDashCol,
  StudioFilterPills,
  SectionHead,
  CreatorsHorizontalRail,
  CreatorsHorizontalRailItem,
  CreatorFeaturedCard,
  CreatorExploreCard,
  CreatorProfileStickyAside,
  ActivityFeed,
  CreatorsPromoCard,
  type CreatorExploreBadgeTone,
  type ActivityFeedItemData,
} from '@digipicks/ds';
import { useConvexAuth } from '../../auth/convexAuth';
import { becomeCreatorCtaLabel } from '../../lib/becomeCreator';
import { isOwnCreator } from '../../lib/creatorSelf';

type CreatorRow = NonNullable<ReturnType<typeof useQuery<typeof api.creators.list>>>[number];

const SORT_OPTIONS = [
  { label: 'Trending', value: 'trending' },
  { label: 'Popular', value: 'popular' },
  { label: 'New', value: 'new' },
  { label: 'Verified only', value: 'verified' },
];

const SPORT_FILTERS = [
  { label: 'Soccer', value: 'Soccer', icon: <Icon name="soccer" size={14} /> },
  { label: 'Cricket', value: 'Cricket', icon: <Icon name="cricket" size={14} /> },
  { label: 'Tennis', value: 'Tennis', icon: <Icon name="tennis" size={14} /> },
  { label: 'NFL', value: 'NFL', icon: <Icon name="football" size={14} /> },
  { label: 'NBA', value: 'NBA', icon: <Icon name="basketball" size={14} /> },
];

function exploreBadge(c: CreatorRow): { label: string; tone: CreatorExploreBadgeTone } | undefined {
  if (c.trending) return { label: 'Top growing', tone: 'success' };
  if (c.verified && c.winRate >= 0.65) return { label: 'Most accurate', tone: 'primary' };
  if (c.subscriberCount >= 1000) return { label: 'Legacy creator', tone: 'info' };
  return undefined;
}

function filterList(
  list: CreatorRow[],
  sport: string | null,
  search: string,
  sort: string,
): CreatorRow[] {
  let next = list;
  if (sport) {
    next = next.filter((c) => c.sports.some((s) => s.toLowerCase().includes(sport.toLowerCase())));
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    next = next.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.niche.toLowerCase().includes(q) ||
        c.sports.some((s) => s.toLowerCase().includes(q)) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (sort === 'verified') {
    next = next.filter((c) => c.verified);
  }

  return [...next].sort((a, b) => {
    switch (sort) {
      case 'popular':
        return b.subscriberCount - a.subscriberCount;
      case 'new':
        return b.createdAt - a.createdAt;
      case 'trending':
      default:
        if (a.trending !== b.trending) return Number(b.trending) - Number(a.trending);
        return b.winRate - a.winRate;
    }
  });
}

function buildActivityItems(list: CreatorRow[]): ActivityFeedItemData[] {
  const items: ActivityFeedItemData[] = [];
  const newest = [...list].sort((a, b) => b.createdAt - a.createdAt)[0];
  if (newest) {
    items.push({
      id: 'new',
      icon: 'user',
      tone: 'success',
      title: 'New creator joined',
      sub: `@${newest.handle} is now on the network.`,
      time: 'Just now',
    });
  }
  const hot = list.find((c) => c.trending);
  if (hot) {
    items.push({
      id: 'trending',
      icon: 'flame',
      tone: 'primary',
      title: 'Trending today',
      sub: `${hot.name} is climbing the win-rate board.`,
      time: '15 mins ago',
    });
  }
  const streak = [...list].sort((a, b) => (b.streak?.length ?? 0) - (a.streak?.length ?? 0))[0];
  if (streak?.streak) {
    items.push({
      id: 'streak',
      icon: 'chart',
      tone: 'info',
      title: 'Record alert',
      sub: `@${streak.handle} is on a ${streak.streak} run.`,
      time: '1 hour ago',
    });
  }
  return items.slice(0, 4);
}

function clearFilters(
  setSport: (v: string | null) => void,
  setSearch: (v: string) => void,
  setSort: (v: string) => void,
) {
  setSport(null);
  setSearch('');
  setSort('trending');
}

export function Discover() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const creators = useQuery(api.creators.list, {});
  const promoted = useQuery(api.creators.promoted, { limit: 4 });

  const [sport, setSport] = useState<string | null>(null);
  const [sort, setSort] = useState('trending');
  const [search, setSearch] = useState('');

  const all = creators ?? [];
  const filtered = useMemo(() => filterList(all, sport, search, sort), [all, sport, search, sort]);

  const featured = useMemo(() => {
    const promotedList = promoted ?? [];
    if (promotedList.length > 0) return promotedList.slice(0, 4);
    const trending = all.filter((c) => c.trending);
    if (trending.length > 0) return trending.slice(0, 4);
    return [...all].sort((a, b) => b.winRate - a.winRate).slice(0, 4);
  }, [all, promoted]);

  const featuredIds = useMemo(() => new Set(featured.map((c) => c._id)), [featured]);

  const isBrowseMode = !sport && !search.trim() && sort !== 'verified';

  const directoryList = useMemo(() => {
    if (!isBrowseMode) return filtered;
    return filtered.filter((c) => !featuredIds.has(c._id));
  }, [filtered, featuredIds, isBrowseMode]);

  const activityItems = useMemo(() => buildActivityItems(all), [all]);

  const isLoading = creators === undefined;
  const isEmpty = !isLoading && all.length === 0;
  const noMatches = !isLoading && !isEmpty && filtered.length === 0;
  const showFeaturedRail =
    isBrowseMode && featured.length > 0 && !isLoading && !isEmpty && !noMatches;

  const openProfile = (handle: string) => navigate(`/creators/${handle}`);

  const directoryTitle = isBrowseMode ? 'All creators' : 'Matching creators';
  const directorySub = isBrowseMode
    ? `${directoryList.length} analyst${directoryList.length === 1 ? '' : 's'} beyond today's featured picks`
    : `${filtered.length} profile${filtered.length === 1 ? '' : 's'} match your filters`;

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Discover"
          title="Find your edge"
          sub="Follow verified analysts, compare win rates, and subscribe to picks aligned with your sports."
          actions={
            <Button
              variant="outline"
              iconRight="arrow-right"
              onClick={() => navigate('/account/events')}
            >
              Tonight&apos;s events
            </Button>
          }
        />

        <AccountRefineCard
          sub="Search the network, then narrow by sort and sport."
          summary={
            isLoading
              ? 'Loading creators…'
              : isEmpty
                ? 'No creators on the network yet'
                : noMatches
                  ? 'No creators match'
                  : `${filtered.length} creator${filtered.length === 1 ? '' : 's'} in view`
          }
          onReset={!isBrowseMode ? () => clearFilters(setSport, setSearch, setSort) : undefined}
        >
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creators, sports, or niches"
            aria-label="Search creators"
          />
          <StudioFilterPills
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
            ariaLabel="Sort creators"
            nowrap
          />
          <FilterChips
            options={SPORT_FILTERS}
            value={sport}
            onChange={setSport}
            allLabel="All sports"
          />
        </AccountRefineCard>

        <StudioDashLayout>
          {isLoading ? (
            <StudioDashCol span={12}>
              <EmptyState icon="compass" title="Loading creators…" />
            </StudioDashCol>
          ) : isEmpty ? (
            <StudioDashCol span={12}>
              <EmptyState
                icon="compass"
                title="No creators to discover yet."
                subtitle="When creators join the network, they will appear here for you to follow and subscribe."
              />
            </StudioDashCol>
          ) : noMatches ? (
            <StudioDashCol span={12}>
              <EmptyState
                icon="search"
                title="No creators match those filters."
                subtitle="Try another sport, sort option, or search term."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => clearFilters(setSport, setSearch, setSort)}
                  >
                    Reset filters
                  </Button>
                }
              />
            </StudioDashCol>
          ) : (
            <>
              {showFeaturedRail ? (
                <StudioDashCol span={12}>
                  <CreatorsHorizontalRail eyebrow="Featured" title="Editors' choice">
                    {featured.map((c, index) => {
                      const own = isOwnCreator(c._id, me?.creatorId);
                      return (
                        <CreatorsHorizontalRailItem key={c._id}>
                          <CreatorFeaturedCard
                            name={c.name}
                            handle={c.handle}
                            mono={c.avatarMono}
                            color={c.avatarColor}
                            verified={c.verified}
                            niche={c.niche}
                            bio={c.bio}
                            units={c.units}
                            startingPrice={c.startingPrice}
                            featured={index === 0}
                            isOwnProfile={own}
                            onProfile={own ? undefined : () => openProfile(c.handle)}
                            onSubscribe={own ? undefined : () => openProfile(c.handle)}
                            onManageStudio={own ? () => navigate('/dashboard') : undefined}
                          />
                        </CreatorsHorizontalRailItem>
                      );
                    })}
                  </CreatorsHorizontalRail>
                </StudioDashCol>
              ) : null}

              <StudioDashCol span={8}>
                <Stack gap={4}>
                  <SectionHead
                    eyebrow={isBrowseMode ? 'Directory' : 'Results'}
                    title={directoryTitle}
                    sub={directorySub}
                  />
                  {directoryList.length > 0 ? (
                    <Grid cols={3} gap={6} stagger={false}>
                      {directoryList.map((c) => {
                        const badge = exploreBadge(c);
                        return (
                          <CreatorExploreCard
                            key={c._id}
                            name={c.name}
                            niche={c.niche}
                            mono={c.avatarMono}
                            color={c.avatarColor}
                            badge={badge?.label}
                            badgeTone={badge?.tone}
                            tags={c.tags.slice(0, 3)}
                            winRate={c.winRate}
                            units={c.units}
                            followers={c.subscriberCount}
                            onClick={() => openProfile(c.handle)}
                          />
                        );
                      })}
                    </Grid>
                  ) : (
                    <Muted>
                      Every creator is featured above. Reset filters to browse the full directory.
                    </Muted>
                  )}
                </Stack>
              </StudioDashCol>

              <StudioDashCol span={4}>
                <CreatorProfileStickyAside>
                  <Stack gap={6}>
                    {activityItems.length > 0 ? (
                      <ActivityFeed title="Live activity" items={activityItems} />
                    ) : null}
                    <CreatorsPromoCard
                      title="Become a DigiPicks creator"
                      body="Publish graded picks, grow subscribers, and keep 87% of subscription revenue."
                      actions={
                        <Button variant="primary" block onClick={() => navigate('/apply')}>
                          {becomeCreatorCtaLabel()}
                        </Button>
                      }
                    />
                  </Stack>
                </CreatorProfileStickyAside>
              </StudioDashCol>
            </>
          )}
        </StudioDashLayout>
      </Stack>
    </Container>
  );
}
