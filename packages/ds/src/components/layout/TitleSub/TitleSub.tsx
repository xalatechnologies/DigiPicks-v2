import React from 'react';
import { cx } from '../../../utils/cx';
import s from './TitleSub.module.css';

export interface TitleSubProps {
  /** Primary line — usually a label, name, or short title. */
  title: React.ReactNode;
  /** Secondary muted line — optional caption / metadata. */
  sub?: React.ReactNode;
  /** Render as a block element instead of inline-flex (default true). */
  block?: boolean;
  className?: string;
}

/**
 * Two-line title + muted sub label. Replaces ad-hoc
 * `<Stack gap={0}><span>{title}</span><Muted>{sub}</Muted></Stack>`
 * blocks repeated across tables, lists, and content rows.
 */
export function TitleSub({ title, sub, block = true, className }: TitleSubProps) {
  return (
    <span className={cx(s.root, block && s.block, className)}>
      <span className={s.title}>{title}</span>
      {sub != null && sub !== '' && <span className={s.sub}>{sub}</span>}
    </span>
  );
}
