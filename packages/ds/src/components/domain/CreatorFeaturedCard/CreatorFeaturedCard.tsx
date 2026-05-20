import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import s from './CreatorFeaturedCard.module.css';

export interface CreatorFeaturedCardProps {
  name: string;
  handle: string;
  mono: string;
  color: string;
  verified?: boolean;
  niche?: string;
  bio?: string;
  units?: string;
  startingPrice?: number;
  featured?: boolean;
  onProfile?: () => void;
  onSubscribe?: () => void;
  className?: string;
}

function formatUnits(u?: string): string {
  if (!u) return '—';
  return u.startsWith('+') || u.startsWith('-') ? u : `+${u}`;
}

export function CreatorFeaturedCard({
  name,
  handle,
  mono,
  color,
  verified,
  niche,
  bio,
  units,
  startingPrice,
  featured,
  onProfile,
  onSubscribe,
  className,
}: CreatorFeaturedCardProps) {
  const cssVars = {
    '--cover-tone': color,
    '--av-color': color,
  } as React.CSSProperties;

  return (
    <article className={cx(s.card, featured && s.featured, className)} style={cssVars}>
      <div className={s.cover}>
        <span className={s.coverOverlay} aria-hidden="true" />
        <div className={s.coverMeta}>
          <span className={s.avatarWrap}>
            <Avatar mono={mono} color={color} size={64} />
          </span>
          <div>
            <div className={s.nameRow}>
              <p className={s.name}>{name}</p>
              {verified ? <VerifiedMark size={16} /> : null}
            </div>
            <p className={s.handle}>@{handle}</p>
          </div>
        </div>
      </div>

      <div className={s.body}>
        <div className={s.top}>
          <div className={s.meta}>
            {niche ? <span className={s.niche}>{niche}</span> : null}
            {bio ? <p className={s.bio}>{bio}</p> : null}
          </div>
          <div className={s.roi}>
            <p className={s.roiValue}>{formatUnits(units)}</p>
            <p className={s.roiLabel}>ROI 30 days</p>
          </div>
        </div>

        <div className={s.foot}>
          {startingPrice != null ? (
            <span className={s.price}>
              ${startingPrice}
              <span className={s.pricePeriod}>/mo</span>
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <div className={s.actions}>
            {onProfile ? (
              <Button variant="secondary" size="sm" onClick={onProfile}>
                Profile
              </Button>
            ) : null}
            {onSubscribe ? (
              <Button variant="primary" size="sm" onClick={onSubscribe}>
                Subscribe
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
