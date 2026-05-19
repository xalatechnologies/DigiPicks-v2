import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import s from './StudioMetaChip.module.css';

export interface StudioMetaChipProps {
  icon: IconName;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function StudioMetaChip({ icon, label, onClick, className }: StudioMetaChipProps) {
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      className={cx(s.chip, onClick && s.clickable, className)}
      onClick={onClick}
    >
      <Icon name={icon} size={16} />
      <span>{label}</span>
      {onClick ? <Icon name="chevron-down" size={16} /> : null}
    </Comp>
  );
}
