import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { AvatarStack } from '../../atoms/AvatarStack/AvatarStack';
import { Avatar } from '../../atoms/Avatar/Avatar';
import s from './HeroLivePanel.module.css';

export interface HeroLiveEvent {
  league: string;
  home: string;
  away: string;
  homeScore?: string | number;
  awayScore?: string | number;
  homeDelta?: string;
  awayDelta?: string;
  /** "Q3 · 4:21" etc. */
  status?: string;
}

export interface HeroLivePanelCreator {
  mono: string;
  color: string;
}

export interface HeroLivePanelProps {
  events: HeroLiveEvent[];
  creators?: HeroLivePanelCreator[];
  creatorsCount?: number;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function HeroLivePanel({
  events,
  creators = [],
  creatorsCount,
  ctaLabel = 'Open live tracker',
  onCta,
  className,
}: HeroLivePanelProps) {
  return (
    <div className={cx(s.panel, className)}>
      <div className={s.head}>
        <div className={s.headLeft}>
          <span className={s.liveDot} aria-hidden="true" />
          <span className={s.liveLabel}>Live now</span>
        </div>
        <span className={s.eyebrow}>Tonight · {events.length} games</span>
      </div>

      <div>
        {events.map((ev, i) => (
          <div key={i} className={s.event}>
            <div className={s.team}>
              <span className={s.teamName}>{ev.away} @ {ev.home}</span>
              <span className={s.teamMeta}>
                {ev.league}
                {ev.status ? ` · ${ev.status}` : ''}
              </span>
            </div>
            <div className={s.score}>
              <span className={s.scoreValue}>
                {ev.awayScore ?? '—'}
                <span aria-hidden="true"> · </span>
                {ev.homeScore ?? '—'}
              </span>
              {(ev.homeDelta || ev.awayDelta) && (
                <span className={s.scoreDelta}>{ev.homeDelta ?? ev.awayDelta}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={s.foot}>
        <div className={s.creators}>
          {creators.length > 0 && (
            <AvatarStack>
              {creators.map((c, i) => (
                <Avatar key={i} mono={c.mono} color={c.color} size={24} />
              ))}
            </AvatarStack>
          )}
          <span className={s.creatorsLabel}>
            {creatorsCount ?? creators.length} creators tracking
          </span>
        </div>
        <button type="button" className={s.cta} onClick={onCta}>
          {ctaLabel}
          <Icon name="arrow-right" size={13} />
        </button>
      </div>
    </div>
  );
}
