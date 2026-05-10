import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../Icon/Icon';
import s from './DiscordThreadLinkBadge.module.css';

export interface DiscordThreadLinkBadgeProps {
  /** Thread display name (omit the leading #). */
  threadName?: string;
  /** Number of messages in the thread, if known. */
  messageCount?: number;
  /** Last activity timestamp (ms). */
  lastActivityAt?: number;
  /** When provided, the badge becomes a button. */
  onClick?: () => void;
  className?: string;
}

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

/**
 * Inline badge linking to a Discord thread — used to surface "see the
 * conversation in #thread" affordances on picks, events, and creator
 * cards.
 */
export function DiscordThreadLinkBadge({
  threadName,
  messageCount,
  lastActivityAt,
  onClick,
  className,
}: DiscordThreadLinkBadgeProps) {
  const interactive = Boolean(onClick);
  const Tag = (interactive ? 'button' : 'span') as 'button' | 'span';

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      className={cx(s.badge, interactive && s.interactive, className)}
      onClick={onClick}
    >
      <span className={s.icon} aria-hidden="true">
        <Icon name="discord" size={12} />
      </span>
      {threadName && (
        <span className={s.name}>
          <span className={s.hash} aria-hidden="true">
            #
          </span>
          {threadName}
        </span>
      )}
      {typeof messageCount === 'number' && <span className={s.meta}>{messageCount} msg</span>}
      {lastActivityAt !== undefined && (
        <span className={s.meta}>· {formatRelative(lastActivityAt)}</span>
      )}
    </Tag>
  );
}
