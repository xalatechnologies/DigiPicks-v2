import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import s from './AccountStatCard.module.css';

export type AccountStatIconTone = 'primary' | 'danger';

export interface AccountStatCardProps {
  icon: IconName;
  iconTone?: AccountStatIconTone;
  value: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function AccountStatCard({
  icon,
  iconTone = 'primary',
  value,
  label,
  onClick,
  className,
}: AccountStatCardProps) {
  const Tag = onClick ? 'button' : 'article';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cx(s.card, onClick && s.interactive, className)}
      onClick={onClick}
    >
      <span className={cx(s.iconWrap, s[iconTone])}>
        <Icon name={icon} size={24} />
      </span>
      <div className={s.copy}>
        <p className={s.value}>{value}</p>
        <p className={s.label}>{label}</p>
      </div>
    </Tag>
  );
}
