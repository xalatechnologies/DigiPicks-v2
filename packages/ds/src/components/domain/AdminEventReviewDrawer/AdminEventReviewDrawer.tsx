import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { SportTag } from '../../atoms/SportTag/SportTag';
import {
  EventSourceBadge,
  type EventSourceType,
} from '../../atoms/EventSourceBadge/EventSourceBadge';
import { Muted } from '../../layout/Muted/Muted';
import { AdminInspectorDrawerShell } from '../AdminInspectorDrawerShell/AdminInspectorDrawerShell';
import {
  AdminDetailDrawerBody,
  AdminDetailMetaCard,
} from '../AdminDetailDrawerBody/AdminDetailDrawerBody';
import bd from '../AdminDetailDrawerBody/AdminDetailDrawerBody.module.css';

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
  const ariaLabel = loading ? 'Loading event review' : (title ?? 'Event review');
  const drawerTitle = loading ? 'Loading event…' : (title ?? 'Event review');

  const footer = (
    <>
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
    </>
  );

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {loading ? (
        <div className={bd.scroll}>
          <Muted>Fetching event…</Muted>
        </div>
      ) : (
        <AdminDetailDrawerBody
          title={drawerTitle}
          subtitle={sub ? <p>{sub}</p> : undefined}
          badges={
            <>
              {sport ? <SportTag sport={sport} /> : null}
              {source ? (
                <EventSourceBadge source={(source as EventSourceType) || 'creator'} />
              ) : null}
              {visibility ? <Badge tone="mute">{visibility}</Badge> : null}
            </>
          }
          footer={footer}
          footerLayout="grid"
        >
          <div className={bd.metaGrid}>
            <AdminDetailMetaCard label="League" value={league} />
            <AdminDetailMetaCard label="Starts" value={startsLabel} />
          </div>
          {error ? <p className={bd.error}>{error}</p> : null}
        </AdminDetailDrawerBody>
      )}
    </AdminInspectorDrawerShell>
  );
}
