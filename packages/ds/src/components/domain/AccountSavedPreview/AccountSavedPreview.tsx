import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AccountSavedPreview.module.css';

export interface AccountSavedPreviewProps {
  meta: string;
  title: string;
  onClick?: () => void;
  className?: string;
}

export function AccountSavedPreview({ meta, title, onClick, className }: AccountSavedPreviewProps) {
  const Tag = onClick ? 'button' : 'article';

  return (
    <Tag type={onClick ? 'button' : undefined} className={cx(s.tile, className)} onClick={onClick}>
      <p className={s.meta}>{meta}</p>
      <p className={s.title}>{title}</p>
    </Tag>
  );
}
