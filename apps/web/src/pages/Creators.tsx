import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  Container,
  Stack,
  Grid,
  Spacer,
  Button,
  Icon,
  FilterChips,
  EmptyState,
  Heading,
  StudioDashLayout,
  StudioDashCol,
  CreatorsDirectoryHero,
  CreatorsHorizontalRail,
  CreatorsHorizontalRailItem,
  CreatorFeaturedCard,
  CreatorDirectoryCompactCard,
  CreatorExploreCard,
  CreatorProfileStickyAside,
  ActivityFeed,
  type CreatorExploreBadgeTone,
  type ActivityFeedItemData,
} from '@digipicks/ds';
import { useConvexAuth } from '../auth/convexAuth';
import { isOwnCreator } from '../lib/creatorSelf';

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

const SPORT_ICONS: Record<string, React.ReactNode> = {
  Soccer: <Icon name="soccer" size={18} />,
  Cricket: <Icon name="cricket" size={18} />,
  Tennis: <Icon name="tennis" size={18} />,
  NFL: <Icon name="football" size={18} />,
  NBA: <Icon name="basketball" size={18} />,
};

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

function groupBySport(list: CreatorRow[]): { sport: string; creators: CreatorRow[] }[] {
  const map = new Map<string, CreatorRow[]>();
  for (const c of list) {
    const sport = c.sports[0] ?? 'Other';
    const bucket = map.get(sport) ?? [];
    bucket.push(c);
    map.set(sport, bucket);
  }
  return [...map.entries()]
    .map(([sport, creators]) => ({ sport, creators }))
    .sort((a, b) => b.creators.length - a.creators.length)
    .slice(0, 3);
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

export function Creators() {
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

  const sportSections = useMemo(() => groupBySport(filtered), [filtered]);
  const activityItems = useMemo(() => buildActivityItems(all), [all]);

  const isLoading = creators === undefined;
  const isEmpty = !isLoading && all.length === 0;

  const openProfile = (handle: string) => navigate(`/creators/${handle}`);

  return (
    <main>
      <Container size="2xl" pad="page">
        <Stack gap={8}>
          <CreatorsDirectoryHero
            searchValue={search}
            onSearchChange={setSearch}
            sortOptions={SORT_OPTIONS}
            sortValue={sort}
            onSortChange={setSort}
            secondaryFilters={
              <FilterChips
                options={SPORT_FILTERS}
                value={sport}
                onChange={setSport}
                allLabel="All sports"
              />
            }
          />

          <StudioDashLayout>
            <StudioDashCol span={activityItems.length > 0 ? 8 : 12}>
              <Stack gap={10}>
                {!isEmpty && featured.length > 0 ? (
                  <CreatorsHorizontalRail eyebrow="Editors choice" title="Featured analysts">
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
                ) : null}

                {isLoading ? (
                  <EmptyState icon="users" title="Loading creators…" />
                ) : isEmpty ? (
                  <EmptyState
                    icon="users"
                    title="No creators in this deployment yet."
                    subtitle="Run seed.seedAll in Convex to populate verified creators — then this directory lights up."
                  />
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon="search"
                    title="No creators match those filters."
                    subtitle="Try another sport, sort, or search term."
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSport(null);
                          setSearch('');
                          setSort('trending');
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <>
                    {sportSections.map(({ sport: sectionSport, creators: sectionCreators }) => (
                      <Stack key={sectionSport} gap={4}>
                        <Heading level={2} size="lg">
                          {sectionSport} picks {SPORT_ICONS[sectionSport] ?? null}
                        </Heading>
                        <Grid cols={3} gap={5} stagger={false}>
                          {sectionCreators.slice(0, 3).map((c) => (
                            <CreatorDirectoryCompactCard
                              key={c._id}
                              name={c.name}
                              handle={c.handle}
                              mono={c.avatarMono}
                              color={c.avatarColor}
                              verified={c.verified}
                              bio={c.bio}
                              units={c.units}
                              startingPrice={c.startingPrice}
                              onClick={() => openProfile(c.handle)}
                            />
                          ))}
                        </Grid>
                      </Stack>
                    ))}

                    <Stack gap={6}>
                      <Heading level={2} size="2xl">
                        Explore all creators
                      </Heading>
                      <Grid cols={3} gap={6} stagger={false}>
                        {filtered.map((c) => {
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
                    </Stack>
                  </>
                )}
              </Stack>
            </StudioDashCol>

            {activityItems.length > 0 ? (
              <StudioDashCol span={4}>
                <CreatorProfileStickyAside>
                  <ActivityFeed title="Live activity" items={activityItems} />
                </CreatorProfileStickyAside>
              </StudioDashCol>
            ) : null}
          </StudioDashLayout>

          <Spacer />
        </Stack>
      </Container>
    </main>
  );
}
