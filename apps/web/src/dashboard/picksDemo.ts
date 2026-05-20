import type { StudioPickRowData } from '@digipicks/ds';
import { STUDIO } from '../lib/studioRoutes';
import type { NavigateFunction } from 'react-router-dom';
import { STUDIO_PICKS } from './data/studio';

function mapStudioPick(
  p: (typeof STUDIO_PICKS)[number],
  navigate: NavigateFunction,
): StudioPickRowData {
  const isDraft = p.status === 'draft';
  const isScheduled = p.status === 'scheduled';
  const isGraded = p.status === 'win' || p.status === 'loss' || p.status === 'push';

  return {
    id: p.id,
    sport: p.sport,
    eventName: p.title.split('—')[0]?.trim() ?? p.title,
    eventTime: p.date,
    pickTitle: p.title,
    odds: p.odds,
    access: p.access,
    status: isDraft ? 'draft' : isScheduled ? 'scheduled' : 'published',
    result: isGraded
      ? (p.status as 'win' | 'loss' | 'push')
      : isDraft || isScheduled
        ? null
        : 'pending',
    onEdit: () => navigate(STUDIO.createPick),
    onDuplicate: () => navigate(STUDIO.createPick),
  };
}

/** Rich demo table for dev preview (matches Stitch density). */
export function demoPickRows(navigate: NavigateFunction): StudioPickRowData[] {
  const fromStudio = STUDIO_PICKS.map((p) => mapStudioPick(p, navigate));

  const extras: StudioPickRowData[] = [
    {
      id: 'demo-nba',
      sport: 'NBA',
      eventName: 'Lakers vs Celtics',
      eventTime: 'Nov 24, 2023 · 7:30 PM EST',
      pickTitle: 'Over 215.5 Points',
      odds: '-110',
      access: 'premium',
      status: 'published',
      result: 'pending',
      onEdit: () => navigate(STUDIO.createPick),
      onDuplicate: () => navigate(STUDIO.createPick),
    },
    {
      id: 'demo-nfl',
      sport: 'NFL',
      eventName: 'Chiefs vs Eagles',
      eventTime: 'Nov 23, 2023 · 8:15 PM EST',
      pickTitle: 'Chiefs ML',
      odds: '+105',
      access: 'free',
      status: 'draft',
      result: null,
      onEdit: () => navigate(STUDIO.createPick),
    },
    {
      id: 'demo-epl',
      sport: 'Soccer',
      eventName: 'Man City vs Liverpool',
      eventTime: 'Nov 22, 2023 · 12:30 PM EST',
      pickTitle: 'Both teams to score',
      odds: '-140',
      access: 'vip',
      status: 'published',
      result: 'win',
      onEdit: () => navigate(STUDIO.createPick),
    },
  ];

  const seen = new Set<string>();
  return [...extras, ...fromStudio].filter((r) => {
    const key = `${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
