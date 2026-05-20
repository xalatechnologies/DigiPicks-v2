import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './AccountSettingsActionRow.module.css';

export interface AccountSettingsActionRowProps {
  label: string;
  trailing?: string;
  trailingTone?: 'default' | 'primary' | 'danger';
  onClick?: () => void;
  className?: string;
}

export function AccountSettingsActionRow({
  label,
  trailing,
  trailingTone = 'default',
  onClick,
  className,
}: AccountSettingsActionRowProps) {
  const Tag = (onClick ? 'button' : 'div') as 'button' | 'div';
  const trailingClass =
    trailingTone === 'primary'
      ? s.trailingPrimary
      : trailingTone === 'danger'
        ? s.trailingDanger
        : s.trailing;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cx(s.row, !onClick && s.rowStatic, className)}
      onClick={onClick}
    >
      <span className={s.label}>{label}</span>
      {trailing ? (
        <span className={cx(s.trailing, trailingClass)}>{trailing}</span>
      ) : onClick ? (
        <Icon name="chevron-right" size={16} aria-hidden="true" />
      ) : null}
    </Tag>
  );
}
