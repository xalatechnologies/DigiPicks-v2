import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import type { MetricDir } from '../Metric/Metric';
import s from './StudioMetricTile.module.css';

export interface StudioMetricTileProps {
  label: string;
  value: React.ReactNode;
  delta?: { value: string | number; dir: MetricDir };
  onClick?: () => void;
  className?: string;
}

const DIR_ICON: Record<MetricDir, IconName> = {
  up: 'arrow-up',
  down: 'arrow-down',
  flat: 'more',
};

export function StudioMetricTile({
  label,
  value,
  delta,
  onClick,
  className,
}: StudioMetricTileProps) {
  const body = (
    <>
      <p className={s.label}>{label}</p>
      <div className={s.value}>{value}</div>
      {delta ? (
        <div className={cx(s.delta, s[delta.dir])}>
          <Icon name={DIR_ICON[delta.dir]} size={14} aria-hidden />
          <span>{delta.value}</span>
        </div>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={cx(s.tile, s.clickable, className)} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <div className={cx(s.tile, className)}>{body}</div>;
}
