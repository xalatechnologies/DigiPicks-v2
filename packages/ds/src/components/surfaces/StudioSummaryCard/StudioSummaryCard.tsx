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
  delta?: { value: string; dir: MetricDir };
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
  delta,
  className,
}: StudioSummaryCardProps) {
  return (
    <article className={cx(s.card, className)}>
      <div className={s.top}>
        <span className={cx(s.iconWrap, s[iconTone])}>
          <Icon name={icon} size={20} />
        </span>
        {delta ? (
          <span className={cx(s.delta, s[`delta${capitalize(delta.dir)}`])}>
            {delta.value}
            <Icon name={DIR_ICON[delta.dir]} size={14} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className={s.label}>{label}</p>
      <div className={s.value}>{value}</div>
    </article>
  );
}

function capitalize(dir: MetricDir): string {
  return dir.charAt(0).toUpperCase() + dir.slice(1);
}
