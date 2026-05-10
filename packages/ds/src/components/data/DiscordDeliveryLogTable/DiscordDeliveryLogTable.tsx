import React from 'react';
import { cx } from '../../../utils/cx';
import { Badge, type BadgeTone } from '../../atoms/Badge/Badge';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import { Table, THead, TBody, Tr, Th, Td } from '../Table/Table';
import s from './DiscordDeliveryLogTable.module.css';

export type DiscordDeliveryStatus = 'queued' | 'sent' | 'failed' | 'rate_limited' | 'skipped';

export interface DiscordDeliveryRow {
  id: string;
  eventType: string;
  status: DiscordDeliveryStatus;
  channelName?: string;
  errorMessage?: string;
  createdAt: number;
  deliveredAt?: number;
}

export interface DiscordDeliveryLogTableProps {
  rows: DiscordDeliveryRow[];
  loading?: boolean;
  emptyTitle?: string;
  className?: string;
}

const STATUS_TONE: Record<DiscordDeliveryStatus, BadgeTone> = {
  queued: 'mute',
  sent: 'green',
  failed: 'red',
  rate_limited: 'amber',
  skipped: 'mute',
};

const STATUS_LABEL: Record<DiscordDeliveryStatus, string> = {
  queued: 'Queued',
  sent: 'Sent',
  failed: 'Failed',
  rate_limited: 'Rate-limited',
  skipped: 'Skipped',
};

function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/**
 * Read-only audit table of Discord delivery events. Status uses Badge
 * tones; timestamps render as compact relative strings.
 */
export function DiscordDeliveryLogTable({
  rows,
  loading,
  emptyTitle = 'No deliveries yet.',
  className,
}: DiscordDeliveryLogTableProps) {
  if (!loading && rows.length === 0) {
    return (
      <EmptyState
        icon="discord"
        title={emptyTitle}
        subtitle="Connect a guild and configure a channel to start receiving Discord activity."
      />
    );
  }

  return (
    <Table card className={cx(s.tbl, className)}>
      <THead>
        <Tr>
          <Th>Event</Th>
          <Th>Channel</Th>
          <Th>Status</Th>
          <Th>Created</Th>
          <Th>Delivered</Th>
        </Tr>
      </THead>
      <TBody>
        {loading
          ? null
          : rows.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <span className={s.event}>{r.eventType}</span>
                  {r.errorMessage && <span className={s.error}>{r.errorMessage}</span>}
                </Td>
                <Td>
                  {r.channelName ? (
                    <span className={s.channel}>
                      <span className={s.hash} aria-hidden="true">
                        #
                      </span>
                      {r.channelName}
                    </span>
                  ) : (
                    <span className={s.muted}>—</span>
                  )}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[r.status]} dot>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </Td>
                <Td>
                  <time className={s.time} dateTime={new Date(r.createdAt).toISOString()}>
                    {formatRelative(r.createdAt)}
                  </time>
                </Td>
                <Td>
                  {r.deliveredAt ? (
                    <time className={s.time} dateTime={new Date(r.deliveredAt).toISOString()}>
                      {formatRelative(r.deliveredAt)}
                    </time>
                  ) : (
                    <span className={s.muted}>—</span>
                  )}
                </Td>
              </Tr>
            ))}
      </TBody>
    </Table>
  );
}
