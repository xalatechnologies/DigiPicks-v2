import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './EventScheduleRow.module.css';

export interface EventScheduleRowProps {
  time: string;
  away: string;
  home: string;
  awayLogo?: string;
  homeLogo?: string;
  live?: boolean;
  scoreDisplay?: string;
  coverageLabel?: string;
  picksLabel?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

function abbrev(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2)
    return words
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
  return name.slice(0, 3).toUpperCase();
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

function MiniLogo({ name, logo }: { name: string; logo?: string }) {
  const [failed, setFailed] = React.useState(false);
  if (logo && !failed) {
    return (
      <img
        className={s.teamMarkImg}
        src={logo}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={s.teamAbbrev} style={{ '--tb-color': teamColor(name) } as React.CSSProperties}>
      {abbrev(name)}
    </span>
  );
}

export function EventScheduleRow({
  time,
  away,
  home,
  awayLogo,
  homeLogo,
  live,
  scoreDisplay,
  coverageLabel,
  picksLabel,
  selected,
  onClick,
  className,
}: EventScheduleRowProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cx(s.row, onClick && s.interactive, selected && s.selected, className)}
      onClick={onClick}
    >
      <div className={s.left}>
        <span className={cx(s.time, live && s.timeLive)}>{live ? 'Live' : time}</span>
        <div className={s.matchup}>
          <div className={s.team}>
            <span className={s.teamMark}>
              <MiniLogo name={away} logo={awayLogo} />
            </span>
            <span className={s.teamName}>{abbrev(away)}</span>
          </div>
          <span className={s.sep}>@</span>
          <div className={s.team}>
            <span className={s.teamMark}>
              <MiniLogo name={home} logo={homeLogo} />
            </span>
            <span className={s.teamName}>{abbrev(home)}</span>
          </div>
        </div>
      </div>
      <div className={s.right}>
        {coverageLabel ? (
          <div className={s.metaBlock}>
            <span className={s.metaLabel}>Coverage</span>
            <span className={s.metaValue}>{coverageLabel}</span>
          </div>
        ) : null}
        {picksLabel ? (
          <div className={s.metaBlock}>
            <span className={s.metaLabel}>Picks</span>
            <span className={cx(s.metaValue, s.metaValueAccent)}>{picksLabel}</span>
          </div>
        ) : null}
        {scoreDisplay ? <span className={s.score}>{scoreDisplay}</span> : null}
        {onClick ? <Icon name="chevron-right" size={18} className={s.chevron} /> : null}
      </div>
    </Tag>
  );
}
