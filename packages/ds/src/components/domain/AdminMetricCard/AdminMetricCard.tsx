import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { MetricDir } from '../../surfaces/Metric/Metric';
import s from './AdminMetricCard.module.css';

export type AdminMetricBadgeTone = 'urgent' | 'priority' | 'primary' | 'muted';

export interface AdminMetricCardProps {
  label: string;
  value: React.ReactNode;
  delta?: { text: string; dir?: MetricDir };
  badge?: { text: string; tone?: AdminMetricBadgeTone };
  onClick?: () => void;
  className?: string;
}

const DIR_ICON = {
  up: 'arrow-up' as const,
  down: 'arrow-down' as const,
  flat: 'more' as const,
};

export function AdminMetricCard({
  label,
  value,
  delta,
  badge,
  onClick,
  className,
}: AdminMetricCardProps) {
  const foot =
    delta || badge ? (
      <div className={s.foot}>
        {delta ? (
          <span
            className={cx(
              s.delta,
              delta.dir === 'down' ? s.deltaDown : delta.dir === 'up' ? s.deltaUp : s.deltaMuted,
            )}
          >
            {delta.dir && delta.dir !== 'flat' ? (
              <Icon name={DIR_ICON[delta.dir]} size={14} aria-hidden />
            ) : null}
            {delta.text}
          </span>
        ) : null}
        {badge ? (
          <span className={cx(s.badge, s[`badge${capitalize(badge.tone ?? 'muted')}`])}>
            {badge.text}
          </span>
        ) : null}
      </div>
    ) : null;

  const body = (
    <>
      <p className={s.label}>{label}</p>
      <div>
        <p className={s.value}>{value}</p>
        {foot}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={cx(s.card, s.clickable, className)} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <article className={cx(s.card, className)}>{body}</article>;
}

function capitalize(tone: AdminMetricBadgeTone): string {
  return tone.charAt(0).toUpperCase() + tone.slice(1);
}
