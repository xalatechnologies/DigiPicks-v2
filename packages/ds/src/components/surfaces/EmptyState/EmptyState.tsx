import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = 'inbox',
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(s.empty, className)}>
      <div className={s.iconWrap}>
        <Icon name={icon} size={24} />
      </div>
      <h3 className={s.title}>{title}</h3>
      {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
