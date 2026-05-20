import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import s from './CreatorDirectoryCompactCard.module.css';

export interface CreatorDirectoryCompactCardProps {
  name: string;
  handle: string;
  mono: string;
  color: string;
  verified?: boolean;
  bio?: string;
  units?: string;
  startingPrice?: number;
  onClick?: () => void;
  className?: string;
}

function formatUnits(u?: string): string {
  if (!u) return '—';
  return u.startsWith('+') || u.startsWith('-') ? u : `+${u}`;
}

export function CreatorDirectoryCompactCard({
  name,
  handle,
  mono,
  color,
  verified,
  bio,
  units,
  startingPrice,
  onClick,
  className,
}: CreatorDirectoryCompactCardProps) {
  const cssVars = { '--av-color': color } as React.CSSProperties;
  const Tag = onClick ? 'button' : 'article';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cx(s.card, onClick && s.interactive, className)}
      style={cssVars}
      onClick={onClick}
    >
      <div className={s.head}>
        <Avatar mono={mono} color={color} size={48} />
        <div className={s.headText}>
          <div className={s.nameRow}>
            <p className={s.name}>{name}</p>
            {verified ? <VerifiedMark size={14} /> : null}
          </div>
          <p className={s.handle}>@{handle}</p>
        </div>
        <p className={s.units}>{formatUnits(units)}</p>
      </div>
      {bio ? <p className={s.bio}>{bio}</p> : null}
      <div className={s.foot}>
        {startingPrice != null ? (
          <span className={s.price}>
            ${startingPrice}
            <span className={s.pricePeriod}>/mo</span>
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        {onClick ? (
          <span className={s.details} aria-hidden="true">
            Details
          </span>
        ) : null}
      </div>
    </Tag>
  );
}
