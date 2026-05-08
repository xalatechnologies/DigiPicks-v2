import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { TitleSub } from '../../layout/TitleSub/TitleSub';
import s from './PersonRow.module.css';

export interface PersonRowProps {
  /** Display name. */
  name: string;
  /** Secondary line — usually an email, role, or short caption. */
  sub?: React.ReactNode;
  /** Avatar monogram (initials). */
  mono: string;
  /** Avatar background color token. */
  color?: string;
  /** Avatar size in px. Defaults to 32. */
  size?: number;
  /** Optional trailing slot — e.g. badge, plan, action button. */
  trailing?: React.ReactNode;
  /** When provided, renders the row as a clickable button. */
  onClick?: () => void;
  className?: string;
}

/**
 * Avatar + name/sub block, with an optional trailing slot.
 * Replaces the repeated
 * `<Row><Avatar/><Stack gap={0}><span>{name}</span><Muted>{sub}</Muted></Stack></Row>`
 * pattern in Overview, Subscribers, and Messages.
 */
export function PersonRow({
  name,
  sub,
  mono,
  color,
  size = 32,
  trailing,
  onClick,
  className,
}: PersonRowProps) {
  const content = (
    <>
      <div className={s.identity}>
        <Avatar mono={mono} color={color} size={size} />
        <TitleSub title={name} sub={sub} />
      </div>
      {trailing != null && <div className={s.trailing}>{trailing}</div>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cx(s.row, s.button, className)}>
        {content}
      </button>
    );
  }

  return <div className={cx(s.row, className)}>{content}</div>;
}
