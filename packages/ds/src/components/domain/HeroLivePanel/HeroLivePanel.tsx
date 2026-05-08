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
  /** Whether events are currently live. Switches header + dot style. */
  live?: boolean;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function HeroLivePanel({
  events,
  creators = [],
  creatorsCount,
  live = false,
  ctaLabel = 'Open live tracker',
  onCta,
  className,
}: HeroLivePanelProps) {
  return (
    <div className={cx(s.panel, className)}>
      <div className={s.head}>
        <div className={s.headLeft}>
          <span className={cx(s.liveDot, !live && s.dotMuted)} aria-hidden="true" />
          <span className={cx(s.liveLabel, !live && s.labelMuted)}>
            {live ? 'Live now' : 'Upcoming'}
          </span>
        </div>
        <span className={s.eyebrow}>
          {live ? 'Tonight' : 'Next up'} · {events.length} {events.length === 1 ? 'game' : 'games'}
        </span>
      </div>

      <div>
        {events.map((ev, i) => {
          const isLive = ev.status === 'Live' || (ev.homeScore !== undefined && ev.homeScore !== 0) || (ev.awayScore !== undefined && ev.awayScore !== 0);
          return (
            <div key={i} className={s.event}>
              <div className={s.team}>
                <span className={s.teamName}>{ev.away} vs {ev.home}</span>
                <span className={s.teamMeta}>
                  {ev.league}
                  {ev.status && ev.status !== 'Upcoming' && ev.status !== 'Live' ? ` · ${ev.status}` : ''}
                </span>
              </div>
              {isLive ? (
                <div className={s.score}>
                  <span className={s.scoreValue}>
                    {ev.awayScore ?? '—'}
                    <span aria-hidden="true"> · </span>
                    {ev.homeScore ?? '—'}
                  </span>
                </div>
              ) : (
                <div className={s.time}>
                  <span className={s.timeValue}>{ev.status || '—'}</span>
                </div>
              )}
            </div>
          );
        })}
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
