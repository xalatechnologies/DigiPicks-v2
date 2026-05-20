import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Icon } from '../../atoms/Icon/Icon';
import s from './AccountSubscriptionRow.module.css';

export interface AccountSubscriptionRowProps {
  name: string;
  sub?: string;
  mono: string;
  color: string;
  hasNew?: boolean;
  muted?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AccountSubscriptionRow({
  name,
  sub,
  mono,
  color,
  hasNew,
  muted,
  onClick,
  className,
}: AccountSubscriptionRowProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cx(s.row, muted && s.muted, className)}
      onClick={onClick}
    >
      <span className={s.left}>
        <span className={s.avatarWrap}>
          <Avatar mono={mono} color={color} size={40} />
          {hasNew ? <span className={s.dot} aria-hidden="true" /> : null}
        </span>
        <span className={s.copy}>
          <p className={s.name}>{name}</p>
          {sub ? <p className={s.sub}>{sub}</p> : null}
        </span>
      </span>
      {onClick ? <Icon name="chevron-right" size={16} className={s.chevron} /> : null}
    </Tag>
  );
}
