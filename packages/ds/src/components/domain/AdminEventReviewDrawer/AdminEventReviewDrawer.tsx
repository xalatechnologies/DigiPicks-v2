import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { SportTag } from '../../atoms/SportTag/SportTag';
import {
  EventSourceBadge,
  type EventSourceType,
} from '../../atoms/EventSourceBadge/EventSourceBadge';
import { Stack } from '../../layout/Stack/Stack';
import { Muted } from '../../layout/Muted/Muted';
import s from '../AdminDisputeDetailDrawer/AdminDisputeDetailDrawer.module.css';

export interface AdminEventReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  title?: string;
  sub?: string;
  sport?: string;
  league?: string;
  source?: string;
  startsLabel?: string;
  visibility?: string;
  busy?: boolean;
  error?: string | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export function AdminEventReviewDrawer({
  open,
  onClose,
  loading,
  title,
  sub,
  sport,
  league,
  source,
  startsLabel,
  visibility,
  busy,
  error,
  onApprove,
  onReject,
}: AdminEventReviewDrawerProps) {
  const drawerTitle = loading ? 'Loading event…' : (title ?? 'Event review');

  return (
    <Drawer open={open} onClose={onClose} title={drawerTitle} className={s.drawerWide}>
      <div className={s.panelHost}>
        {loading ? (
          <Muted>Fetching event…</Muted>
        ) : (
          <Stack gap={5}>
            {sub ? <p className={s.detail}>{sub}</p> : null}
            <div className={s.badges}>
              {sport ? <SportTag sport={sport} /> : null}
              {source ? (
                <EventSourceBadge source={(source as EventSourceType) || 'creator'} />
              ) : null}
              {visibility ? <Badge tone="mute">{visibility}</Badge> : null}
            </div>
            <div className={s.metaGrid}>
              <div>
                <p className={s.metaLabel}>League</p>
                <p className={s.metaValue}>{league ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Starts</p>
                <p className={s.metaValue}>{startsLabel ?? '—'}</p>
              </div>
            </div>
            {error ? <p className={s.error}>{error}</p> : null}
            <div className={s.actions}>
              {onApprove ? (
                <Button variant="primary" size="sm" disabled={busy} onClick={onApprove}>
                  Approve
                </Button>
              ) : null}
              {onReject ? (
                <Button variant="outline" size="sm" disabled={busy} onClick={onReject}>
                  Reject
                </Button>
              ) : null}
            </div>
          </Stack>
        )}
      </div>
    </Drawer>
  );
}
