import React from 'react';
import { cx } from '../../../utils/cx';
import { SportTag } from '../../atoms/SportTag/SportTag';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { AvatarStack } from '../../atoms/AvatarStack/AvatarStack';
import { Button } from '../../atoms/Button/Button';
import s from './EventCard.module.css';

export interface EventCardCreatorAvatar {
  mono: string;
  color: string;
}

export interface EventCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  sport: string;
  league?: string;
  time: string;
  home: string;
  away: string;
  /** Optional team logo URLs. When omitted, colored initials are rendered as fallback. */
  homeLogo?: string;
  awayLogo?: string;
  creators?: number;
  picks?: number;
  /** Optional avatar stack of creators covering this event. */
  creatorsAvatars?: EventCardCreatorAvatar[];
  /** Adds a primary tinted gradient + glow for marquee matchups. */
  featured?: boolean;
  /** Hides redundant sport/league header (for use inside league-grouped sections). */
  compact?: boolean;
  /** Render a small "Live" indicator next to the time. */
  live?: boolean;
  /** Click handler for the whole card. */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** Click handler for the primary "View picks" button. */
  onViewPicks?: () => void;
  /** Click handler for the "Notify" icon button. */
  onNotify?: () => void;
  /** Click handler for the "Track" icon button. */
  onTrack?: () => void;
}

/** Get 2–3 letter initials from a team name. */
function initials(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

/** Deterministic color from team name. */
function teamColor(name: string): string {
  const colors = [
    'var(--primary)', 'var(--violet)', 'var(--green)',
    'var(--orange)', 'var(--red)', 'var(--blue)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface TeamBadgeProps {
  name: string;
  logo?: string;
}

function TeamBadge({ name, logo }: TeamBadgeProps) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const showImage = Boolean(logo) && !imgFailed;

  if (showImage) {
    return (
      <span className={cx(s.teamBadge, s.teamBadgeLogo)} aria-hidden="true">
        <img
          className={s.teamLogo}
          src={logo}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={s.teamBadge}
      style={{ '--tb-color': teamColor(name) } as React.CSSProperties}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export const EventCard = React.forwardRef<HTMLDivElement, EventCardProps>(function EventCard(
  {
    sport,
    league,
    time,
    home,
    away,
    homeLogo,
    awayLogo,
    creators,
    picks,
    creatorsAvatars,
    featured,
    compact,
    live,
    onClick,
    onViewPicks,
    onNotify,
    onTrack,
    className,
    ...rest
  },
  ref,
) {
  const interactive = Boolean(onClick);
  const hasMetrics = (creators != null && creators > 0) || (picks != null && picks > 0);
  const hasActions = Boolean(onViewPicks) || Boolean(onNotify) || Boolean(onTrack);
  const hasAvatars = Boolean(creatorsAvatars && creatorsAvatars.length > 0);
  const hiddenCount =
    creators != null && creatorsAvatars && creators > creatorsAvatars.length
      ? creators - creatorsAvatars.length
      : 0;

  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    if (!fn) return;
    e.stopPropagation();
    fn();
  };

  return (
    <div
      ref={ref}
      className={cx(s.card, featured && s.featured, interactive && s.interactive, className)}
      onClick={onClick}
      {...rest}
    >
      <span className={s.aurora} aria-hidden="true" />
      <span className={s.shine} aria-hidden="true" />

      <div className={s.head}>
        <div className={s.headLeft}>
          {!compact && <SportTag sport={sport} />}
          {!compact && league && <span className={s.league}>{league}</span>}
        </div>
        <div className={s.headRight}>
          {live && (
            <span className={s.liveTag} aria-label="Live">
              <span className={s.liveDot} aria-hidden="true" />
              <span className={s.liveLabel}>Live</span>
            </span>
          )}
          <span className={s.time}>{time}</span>
        </div>
      </div>

      {/* Vertical sides — logo on top, full team name below, no truncation. */}
      <div className={s.matchup}>
        <div className={s.side}>
          <TeamBadge name={away} logo={awayLogo} />
          <span className={s.teamName}>{away}</span>
        </div>

        <span className={s.vs}>vs</span>

        <div className={s.side}>
          <TeamBadge name={home} logo={homeLogo} />
          <span className={s.teamName}>{home}</span>
        </div>
      </div>

      {(hasMetrics || hasActions || hasAvatars) && (
        <div className={s.foot}>
          <div className={s.footMetrics}>
            {creators != null && creators > 0 && (
              <span className={s.metric}>
                <strong className={s.metricNum}>{creators}</strong>
                <span className={s.metricLabel}>creators</span>
              </span>
            )}
            {creators != null && creators > 0 && picks != null && picks > 0 && (
              <span className={s.dot}>·</span>
            )}
            {picks != null && picks > 0 && (
              <span className={s.metric}>
                <strong className={cx(s.metricNum, s.metricNumAccent)}>{picks}</strong>
                <span className={s.metricLabel}>picks</span>
              </span>
            )}
          </div>

          <div className={s.actions}>
            {hasAvatars && (
              <AvatarStack className={s.stack}>
                {creatorsAvatars!.map((c, i) => (
                  <Avatar key={i} mono={c.mono} color={c.color} size={26} />
                ))}
                {hiddenCount > 0 && <span className={s.more}>+{hiddenCount}</span>}
              </AvatarStack>
            )}
            {onNotify && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                iconLeft="bell"
                aria-label="Notify me"
                onClick={stop(onNotify)}
              />
            )}
            {onTrack && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                iconLeft="bookmark"
                aria-label="Track this event"
                onClick={stop(onTrack)}
              />
            )}
            {onViewPicks && (
              <Button
                variant="primary"
                size="sm"
                iconRight="arrow-right"
                onClick={stop(onViewPicks)}
              >
                View picks
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
