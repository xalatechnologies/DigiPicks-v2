import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Icon } from '../../atoms/Icon/Icon';
import s from './EventsCreatorSpotlight.module.css';

export interface EventsCreatorSpotlightProps {
  name: string;
  handle: string;
  mono: string;
  color: string;
  verified?: boolean;
  tags?: string[];
  eventsToday: number;
  onClick?: () => void;
  className?: string;
}

export function EventsCreatorSpotlight({
  name,
  handle,
  mono,
  color,
  verified,
  tags,
  eventsToday,
  onClick,
  className,
}: EventsCreatorSpotlightProps) {
  const Tag = onClick ? 'button' : 'article';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cx(s.card, onClick && s.interactive, className)}
      onClick={onClick}
    >
      <span className={s.avatarWrap}>
        <Avatar mono={mono} color={color} size={64} />
        {verified ? (
          <span className={s.verified} aria-label="Verified">
            <Icon name="verified" size={12} />
          </span>
        ) : null}
      </span>
      <p className={s.name}>{name}</p>
      <p className={s.handle}>@{handle}</p>
      {tags && tags.length > 0 ? (
        <div className={s.tags}>
          {tags.map((t) => (
            <span key={t} className={s.tag}>
              {t}
            </span>
          ))}
        </div>
      ) : null}
      <span className={s.eventsToday}>
        {eventsToday} {eventsToday === 1 ? 'event' : 'events'} today
      </span>
    </Tag>
  );
}
