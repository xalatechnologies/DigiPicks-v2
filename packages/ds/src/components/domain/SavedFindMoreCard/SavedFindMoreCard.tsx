import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './SavedFindMoreCard.module.css';

export interface SavedFindMoreCardProps {
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export function SavedFindMoreCard({
  title = 'Find more picks',
  subtitle = 'Explore the feed to save more elite picks to your list.',
  onClick,
  className,
}: SavedFindMoreCardProps) {
  return (
    <button type="button" className={cx(s.card, className)} onClick={onClick}>
      <span className={s.iconWrap} aria-hidden="true">
        <Icon name="plus" size={28} />
      </span>
      <p className={s.title}>{title}</p>
      <p className={s.sub}>{subtitle}</p>
    </button>
  );
}
