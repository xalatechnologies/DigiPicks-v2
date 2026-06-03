import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Field } from '../../forms/Field/Field';
import { TextArea } from '../../forms/TextArea/TextArea';
import { Muted } from '../../layout/Muted/Muted';
import { AdminInspectorDrawerShell } from '../AdminInspectorDrawerShell/AdminInspectorDrawerShell';
import {
  AdminDetailDrawerBody,
  AdminDetailMetaCard,
  AdminDetailSection,
} from '../AdminDetailDrawerBody/AdminDetailDrawerBody';
import bd from '../AdminDetailDrawerBody/AdminDetailDrawerBody.module.css';
import s from './AdminDisputeDetailDrawer.module.css';

export interface AdminDisputeNote {
  createdLabel: string;
  body: string;
}

export interface AdminDisputeDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  pickTitle?: string;
  creatorLabel?: string;
  openerLabel?: string;
  reason?: string;
  detail?: string;
  statusLabel?: string;
  statusTone?: 'green' | 'amber' | 'red' | 'mute';
  openedLabel?: string;
  resolution: string;
  onResolutionChange: (value: string) => void;
  notes?: AdminDisputeNote[];
  busy?: boolean;
  error?: string | null;
  canReview?: boolean;
  canResolve?: boolean;
  canDismiss?: boolean;
  onMarkReviewing?: () => void;
  onResolve?: () => void;
  onDismiss?: () => void;
}

export function AdminDisputeDetailDrawer({
  open,
  onClose,
  loading,
  pickTitle,
  creatorLabel,
  openerLabel,
  reason,
  detail,
  statusLabel,
  statusTone = 'mute',
  openedLabel,
  resolution,
  onResolutionChange,
  notes = [],
  busy,
  error,
  canReview,
  canResolve,
  canDismiss,
  onMarkReviewing,
  onResolve,
  onDismiss,
}: AdminDisputeDetailDrawerProps) {
  const ariaLabel = loading ? 'Loading dispute' : (pickTitle ?? 'Pick dispute');
  const title = loading ? 'Loading dispute…' : (pickTitle ?? 'Pick dispute');

  const footer = (
    <>
      {canReview && onMarkReviewing ? (
        <Button variant="outline" size="sm" disabled={busy} onClick={onMarkReviewing}>
          Mark reviewing
        </Button>
      ) : null}
      {canResolve && onResolve ? (
        <Button variant="primary" size="sm" disabled={busy} onClick={onResolve}>
          Resolve
        </Button>
      ) : null}
      {canDismiss && onDismiss ? (
        <Button variant="danger" size="sm" disabled={busy} onClick={onDismiss}>
          Dismiss
        </Button>
      ) : null}
    </>
  );

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {loading ? (
        <div className={bd.scroll}>
          <Muted>Fetching dispute details…</Muted>
        </div>
      ) : (
        <AdminDetailDrawerBody
          title={title}
          badges={
            <>
              {statusLabel ? <Badge tone={statusTone}>{statusLabel}</Badge> : null}
              {reason ? <Badge tone="blue">{reason}</Badge> : null}
            </>
          }
          footer={footer}
          footerLayout="row"
        >
          {detail ? <p className={bd.detail}>{detail}</p> : null}

          <div className={bd.metaGrid}>
            <AdminDetailMetaCard label="Opened by" value={openerLabel} />
            <AdminDetailMetaCard label="Creator" value={creatorLabel} />
            <AdminDetailMetaCard label="Opened" value={openedLabel} />
          </div>

          <Field label="Resolution note" help="Stored on the dispute and audit log.">
            <TextArea
              rows={3}
              value={resolution}
              onChange={(e) => onResolutionChange(e.target.value)}
              maxLength={2000}
            />
          </Field>

          {error ? <p className={bd.error}>{error}</p> : null}

          {notes.length > 0 ? (
            <AdminDetailSection title="Notes">
              <ul className={s.notes}>
                {notes.map((n, i) => (
                  <li key={i} className={s.noteCard}>
                    <p className={s.noteTime}>{n.createdLabel}</p>
                    <p className={s.noteBody}>{n.body}</p>
                  </li>
                ))}
              </ul>
            </AdminDetailSection>
          ) : null}
        </AdminDetailDrawerBody>
      )}
    </AdminInspectorDrawerShell>
  );
}
