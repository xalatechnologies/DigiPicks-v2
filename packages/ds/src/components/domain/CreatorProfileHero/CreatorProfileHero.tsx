import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Icon } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import s from './CreatorProfileHero.module.css';

export interface CreatorProfileHeroProps {
  name: string;
  tagline?: string;
  avatarMono: string;
  avatarColor?: string;
  avatarSrc?: string;
  coverSrc?: string;
  coverAlt?: string;
  verified?: boolean;
  subscribeLabel?: string;
  onSubscribe?: () => void;
  subscribeDisabled?: boolean;
  priceHint?: string;
  className?: string;
}

export function CreatorProfileHero({
  name,
  tagline,
  avatarMono,
  avatarColor,
  avatarSrc,
  coverSrc,
  coverAlt,
  verified,
  subscribeLabel = 'Subscribe',
  onSubscribe,
  subscribeDisabled,
  priceHint,
  className,
}: CreatorProfileHeroProps) {
  return (
    <section className={cx(s.wrap, className)} aria-label={`${name} profile`}>
      <div className={s.cover}>
        {coverSrc ? <img className={s.coverImg} src={coverSrc} alt={coverAlt ?? ''} /> : null}
      </div>

      <div className={s.body}>
        <div className={s.row}>
          <div className={s.identity}>
            <div className={s.avatarWrap}>
              <div className={s.avatarFrame}>
                <Avatar
                  mono={avatarMono}
                  color={avatarColor}
                  src={avatarSrc}
                  alt={name}
                  size={128}
                />
              </div>
              {verified ? (
                <span className={s.verified} aria-label="Verified creator">
                  <Icon name="verified" size={14} />
                </span>
              ) : null}
            </div>
            <div className={s.text}>
              <h1 className={s.name}>{name}</h1>
              {tagline ? <p className={s.tagline}>{tagline}</p> : null}
            </div>
          </div>

          {onSubscribe ? (
            <div className={s.desktopCta}>
              <Button variant="primary" onClick={onSubscribe} disabled={subscribeDisabled}>
                {subscribeLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {onSubscribe && priceHint ? (
        <div className={s.mobileBar}>
          <div className={s.mobileInner}>
            <div className={s.mobileMeta}>
              <Avatar mono={avatarMono} color={avatarColor} src={avatarSrc} alt="" size={40} />
              <div>
                <p className={s.mobileName}>{name}</p>
                <p className={s.mobilePrice}>{priceHint}</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              iconLeft="lock"
              onClick={onSubscribe}
              disabled={subscribeDisabled}
            >
              Subscribe
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
