import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import s from './CreatorStudioProfile.module.css';

export interface CreatorStudioProfileProps {
  name: string;
  planLabel?: string;
  monogram?: string;
  color?: string;
  onClick?: () => void;
  className?: string;
}

export function CreatorStudioProfile({
  name,
  planLabel = 'Pro Account',
  monogram,
  color,
  onClick,
  className,
}: CreatorStudioProfileProps) {
  const body = (
    <>
      <Avatar mono={monogram ?? name.slice(0, 2).toUpperCase()} color={color} size={40} />
      <div className={s.text}>
        <p className={s.name}>{name}</p>
        <p className={s.plan}>{planLabel}</p>
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

  return <div className={cx(s.card, className)}>{body}</div>;
}
