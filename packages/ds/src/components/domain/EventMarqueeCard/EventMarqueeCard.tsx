import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { AvatarStack } from '../../atoms/AvatarStack/AvatarStack';
import { Button } from '../../atoms/Button/Button';
import type { EventCardCreatorAvatar } from '../EventCard/EventCard';
import s from './EventMarqueeCard.module.css';

export interface EventMarqueeCardProps {
  sport: string;
  league?: string;
  home: string;
  away: string;
  homeLogo?: string;
  awayLogo?: string;
  timeLabel: string;
  live?: boolean;
  scoreDisplay?: string;
  clockLabel?: string;
  creators?: number;
  picks?: number;
  creatorsAvatars?: EventCardCreatorAvatar[];
  ctaLabel?: string;
  onClick?: () => void;
  onViewPicks?: () => void;
  className?: string;
}

function initials(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function teamColor(name: string): string {
  const colors = [
    'var(--primary)',
    'var(--violet)',
    'var(--green)',
    'var(--orange)',
    'var(--red)',
    'var(--blue)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function TeamLogo({ name, logo }: { name: string; logo?: string }) {
  const [failed, setFailed] = React.useState(false);
  if (logo && !failed) {
    return (
      <img
        className={s.teamLogoImg}
        src={logo}
        alt={name}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={s.teamInitials}
      style={{ '--tb-color': teamColor(name) } as React.CSSProperties}
    >
      {initials(name)}
    </span>
  );
}

export function EventMarqueeCard({
  sport,
  league,
  home,
  away,
  homeLogo,
  awayLogo,
  timeLabel,
  live,
  scoreDisplay,
  clockLabel,
  creators,
  picks,
  creatorsAvatars,
  ctaLabel,
  onClick,
  onViewPicks,
  className,
}: EventMarqueeCardProps) {
  const Tag = onClick ? 'button' : 'article';
  const hidden =
    creators != null && creatorsAvatars && creators > creatorsAvatars.length
      ? creators - creatorsAvatars.length
      : 0;
  const picksLabel =
    ctaLabel ?? (picks != null && picks > 0 ? `View ${picks} picks` : 'View picks');

  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cx(s.card, onClick && s.interactive, className)}
      onClick={onClick}
    >
      <span className={cx(s.badge, live ? s.badgeLive : s.badgeSoon)}>
        {live ? <span className={s.badgeDot} aria-hidden="true" /> : null}
        {timeLabel}
      </span>

      <div>
        <span className={s.meta}>
          {sport}
          {league ? ` · ${league}` : ''}
        </span>
        <div className={s.matchup}>
          <div className={s.team}>
            <span className={s.teamLogo}>
              <TeamLogo name={away} logo={awayLogo} />
            </span>
            <p className={s.teamName}>{away}</p>
          </div>
          <div className={s.center}>
            {scoreDisplay ? (
              <>
                <p className={s.score}>{scoreDisplay}</p>
                {clockLabel ? <p className={s.clock}>{clockLabel}</p> : null}
              </>
            ) : (
              <>
                <p className={s.vs}>vs</p>
                {clockLabel ? <p className={s.clock}>{clockLabel}</p> : null}
              </>
            )}
          </div>
          <div className={s.team}>
            <span className={s.teamLogo}>
              <TeamLogo name={home} logo={homeLogo} />
            </span>
            <p className={s.teamName}>{home}</p>
          </div>
        </div>
      </div>

      <div className={s.foot}>
        <div className={s.coverage}>
          {creatorsAvatars && creatorsAvatars.length > 0 ? (
            <AvatarStack>
              {creatorsAvatars.slice(0, 2).map((c, i) => (
                <Avatar key={i} mono={c.mono} color={c.color} size={32} />
              ))}
              {hidden > 0 ? <span className={s.more}>+{hidden}</span> : null}
            </AvatarStack>
          ) : null}
          {creators != null && creators > 0 ? (
            <span className={s.coverageCopy}>{creators} creators covering</span>
          ) : null}
        </div>
        {onViewPicks ? (
          <Button variant="primary" size="sm" onClick={stop(onViewPicks)}>
            {picksLabel}
          </Button>
        ) : null}
      </div>
    </Tag>
  );
}
