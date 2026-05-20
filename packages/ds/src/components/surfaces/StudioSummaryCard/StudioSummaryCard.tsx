import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import type { MetricDir } from '../Metric/Metric';
import s from './StudioSummaryCard.module.css';

export type StudioSummaryIconTone = 'primary' | 'violet' | 'danger' | 'amber';

export interface StudioSummaryCardProps {
  icon: IconName;
  iconTone?: StudioSummaryIconTone;
  label: string;
  value: React.ReactNode;
  /** `metric` (default) for numbers; `text` for emails, names, and longer strings. */
  valueVariant?: 'metric' | 'text';
  delta?: { value: string; dir: MetricDir };
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const DIR_ICON: Record<MetricDir, IconName> = {
  up: 'arrow-up',
  down: 'arrow-down',
  flat: 'more',
};

export function StudioSummaryCard({
  icon,
  iconTone = 'primary',
  label,
  value,
  valueVariant = 'metric',
  delta,
  active,
  onClick,
  className,
}: StudioSummaryCardProps) {
  const body = (
    <>
      <div className={s.head}>
        <span className={cx(s.iconWrap, s[iconTone])}>
          <Icon name={icon} size={20} />
        </span>
        <p className={s.label}>{label}</p>
      </div>
      <div className={s.valueRow}>
        <div
          className={cx(s.value, valueVariant === 'text' && s.valueText)}
          title={typeof value === 'string' ? value : undefined}
        >
          {value}
        </div>
        {delta ? (
          <span className={cx(s.delta, s[`delta${capitalize(delta.dir)}`])}>
            {delta.value}
            <Icon name={DIR_ICON[delta.dir]} size={14} aria-hidden />
          </span>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cx(s.card, s.clickable, active && s.active, className)}
        onClick={onClick}
        aria-pressed={active}
      >
        {body}
      </button>
    );
  }

  return <article className={cx(s.card, active && s.active, className)}>{body}</article>;
}

function capitalize(dir: MetricDir): string {
  return dir.charAt(0).toUpperCase() + dir.slice(1);
}
