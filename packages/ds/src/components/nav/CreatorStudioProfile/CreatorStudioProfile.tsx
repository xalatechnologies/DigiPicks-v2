import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import s from './CreatorStudioProfile.module.css';

export interface CreatorStudioProfileProps {
  name: string;
  planLabel?: string;
  monogram?: string;
  color?: string;
  className?: string;
}

export function CreatorStudioProfile({
  name,
  planLabel = 'Pro Account',
  monogram,
  color,
  className,
}: CreatorStudioProfileProps) {
  return (
    <div className={cx(s.card, className)}>
      <Avatar mono={monogram ?? name.slice(0, 2).toUpperCase()} color={color} size={40} />
      <div className={s.text}>
        <p className={s.name}>{name}</p>
        <p className={s.plan}>{planLabel}</p>
      </div>
    </div>
  );
}
