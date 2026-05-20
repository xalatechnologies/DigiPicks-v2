import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Badge } from '../../atoms/Badge/Badge';
import { Icon } from '../../atoms/Icon/Icon';
import s from './AccountProfileSettingsCard.module.css';

export interface AccountProfileSettingsCardProps {
  name: string;
  email: string;
  mono: string;
  color?: string;
  memberSince?: string;
  roleLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function AccountProfileSettingsCard({
  name,
  email,
  mono,
  color,
  memberSince,
  roleLabel,
  children,
  className,
}: AccountProfileSettingsCardProps) {
  const cssVars = color ? ({ '--av-color': color } as React.CSSProperties) : undefined;

  return (
    <div className={cx(s.layout, className)} style={cssVars}>
      <div className={s.avatarWrap}>
        <Avatar mono={mono} color={color} size={96} />
        <span className={s.avatarEdit} aria-hidden="true">
          <Icon name="gear" size={14} />
        </span>
      </div>
      <div className={s.fields}>
        {(memberSince || roleLabel) && (
          <div className={cx(s.badgeRow, s.span2)}>
            {roleLabel ? <Badge tone="blue">{roleLabel}</Badge> : null}
            {memberSince ? <Badge tone="mute">Member since {memberSince}</Badge> : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
