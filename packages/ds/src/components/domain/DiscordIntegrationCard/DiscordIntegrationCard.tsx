import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Badge } from '../../atoms/Badge/Badge';
import { Icon } from '../../atoms/Icon/Icon';
import { Card } from '../../surfaces/Card/Card';
import { CardHead } from '../../surfaces/CardHead/CardHead';
import s from './DiscordIntegrationCard.module.css';

export type DiscordIntegrationStatus = 'connected' | 'paused' | 'revoked';

export interface DiscordIntegrationCardProps {
  /** Display name of the connected guild. */
  guildName: string;
  /** Optional guild icon URL — falls back to a Discord glyph mono avatar. */
  guildIconUrl?: string;
  /** Lifecycle state of the connection. */
  status: DiscordIntegrationStatus;
  /** Whether the DigiPicks bot user is installed in the guild. */
  botInstalled?: boolean;
  /** Number of channels the host has configured for delivery. */
  channelsConfigured: number;
  /** Timestamp (ms) of the last successful delivery, if any. */
  lastDeliveryAt?: number;
  /** Optional action node (typically a `<DiscordConnectButton />`). */
  action?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const STATUS_LABEL: Record<DiscordIntegrationStatus, string> = {
  connected: 'Connected',
  paused: 'Paused',
  revoked: 'Revoked',
};

const STATUS_TONE: Record<DiscordIntegrationStatus, 'green' | 'mute' | 'red'> = {
  connected: 'green',
  paused: 'mute',
  revoked: 'red',
};

function formatRelative(ms: number | undefined): string {
  if (!ms) return 'never';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/**
 * Tile rendering one connected Discord guild — used on the M20 settings
 * surface to summarize the integration's lifecycle (status, bot install,
 * channel coverage, last delivery).
 *
 * Pure presentation — host wires the action.
 */
export function DiscordIntegrationCard({
  guildName,
  guildIconUrl,
  status,
  botInstalled,
  channelsConfigured,
  lastDeliveryAt,
  action,
  className,
  onClick,
}: DiscordIntegrationCardProps) {
  return (
    <Card pad="md" hover={Boolean(onClick)} className={cx(s.tile, className)} onClick={onClick}>
      <CardHead
        icon={
          guildIconUrl ? (
            <Avatar mono="D" src={guildIconUrl} alt={guildName} size={40} />
          ) : (
            <span className={s.glyph} aria-hidden="true">
              <Icon name="discord" size={20} />
            </span>
          )
        }
        title={guildName}
        sub={
          <span className={s.subRow}>
            <Badge tone={STATUS_TONE[status]} dot>
              {STATUS_LABEL[status]}
            </Badge>
            {botInstalled !== undefined && (
              <Badge tone={botInstalled ? 'blue' : 'mute'}>
                {botInstalled ? 'Bot installed' : 'Bot missing'}
              </Badge>
            )}
          </span>
        }
        action={action}
      />
      <div className={s.stats}>
        <div className={s.stat}>
          <span className={s.statLabel}>Channels</span>
          <span className={s.statValue}>{channelsConfigured}</span>
        </div>
        <div className={s.stat}>
          <span className={s.statLabel}>Last delivery</span>
          <span className={s.statValue}>{formatRelative(lastDeliveryAt)}</span>
        </div>
      </div>
    </Card>
  );
}
