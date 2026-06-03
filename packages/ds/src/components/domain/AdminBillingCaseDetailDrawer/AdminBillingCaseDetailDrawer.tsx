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
import s from './AdminBillingCaseDetailDrawer.module.css';

export interface AdminBillingCaseNote {
  createdLabel: string;
  body: string;
}

export interface AdminBillingCaseDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  caseNumber?: string;
  subscriberLabel?: string;
  creatorLabel?: string;
  issueLabel?: string;
  amountLabel?: string;
  statusLabel?: string;
  statusTone?: 'green' | 'amber' | 'red' | 'mute';
  createdLabel?: string;
  updatedLabel?: string;
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  notes?: AdminBillingCaseNote[];
  busy?: boolean;
  error?: string | null;
  onAddNote?: () => void;
  onUnderReview?: () => void;
  onPendingFinance?: () => void;
  onEscalate?: () => void;
  onRefund?: () => void;
  onDeny?: () => void;
  onCloseCase?: () => void;
}

export function AdminBillingCaseDetailDrawer({
  open,
  onClose,
  loading,
  caseNumber,
  subscriberLabel,
  creatorLabel,
  issueLabel,
  amountLabel,
  statusLabel,
  statusTone = 'mute',
  createdLabel,
  updatedLabel,
  noteDraft,
  onNoteDraftChange,
  notes = [],
  busy,
  error,
  onAddNote,
  onUnderReview,
  onPendingFinance,
  onEscalate,
  onRefund,
  onDeny,
  onCloseCase,
}: AdminBillingCaseDetailDrawerProps) {
  const ariaLabel = loading ? 'Loading billing case' : (caseNumber ?? 'Billing case');
  const title = loading ? 'Loading case…' : (caseNumber ?? 'Billing case');

  const footer = (
    <>
      {onAddNote ? (
        <Button variant="outline" size="sm" disabled={busy} onClick={onAddNote}>
          Add note
        </Button>
      ) : null}
      {onUnderReview ? (
        <Button variant="outline" size="sm" disabled={busy} onClick={onUnderReview}>
          Under review
        </Button>
      ) : null}
      {onPendingFinance ? (
        <Button variant="outline" size="sm" disabled={busy} onClick={onPendingFinance}>
          Pending finance
        </Button>
      ) : null}
      {onEscalate ? (
        <Button variant="outline" size="sm" disabled={busy} onClick={onEscalate}>
          Escalate
        </Button>
      ) : null}
      {onRefund ? (
        <Button variant="primary" size="sm" disabled={busy} onClick={onRefund}>
          Mark refunded
        </Button>
      ) : null}
      {onDeny ? (
        <Button variant="danger" size="sm" disabled={busy} onClick={onDeny}>
          Deny
        </Button>
      ) : null}
      {onCloseCase ? (
        <Button variant="ghost" size="sm" disabled={busy} onClick={onCloseCase}>
          Close
        </Button>
      ) : null}
    </>
  );

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {loading ? (
        <div className={bd.scroll}>
          <Muted>Fetching billing case…</Muted>
        </div>
      ) : (
        <AdminDetailDrawerBody
          title={title}
          badges={
            <>
              {statusLabel ? <Badge tone={statusTone}>{statusLabel}</Badge> : null}
              {issueLabel ? <Badge tone="blue">{issueLabel}</Badge> : null}
              {amountLabel ? <Badge tone="mute">{amountLabel}</Badge> : null}
            </>
          }
          footer={footer}
          footerLayout="row"
        >
          <div className={bd.metaGrid}>
            <AdminDetailMetaCard label="Subscriber" value={subscriberLabel} />
            <AdminDetailMetaCard label="Creator" value={creatorLabel} />
            <AdminDetailMetaCard label="Opened" value={createdLabel} />
            <AdminDetailMetaCard label="Updated" value={updatedLabel} />
          </div>

          <Field label="Internal note">
            <TextArea
              rows={3}
              value={noteDraft}
              onChange={(e) => onNoteDraftChange(e.target.value)}
              maxLength={2000}
            />
          </Field>

          {error ? <p className={bd.error}>{error}</p> : null}

          {notes.length > 0 ? (
            <AdminDetailSection title="Internal notes">
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
