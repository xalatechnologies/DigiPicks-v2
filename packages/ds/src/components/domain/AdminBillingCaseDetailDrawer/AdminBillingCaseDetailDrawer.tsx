import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Field } from '../../forms/Field/Field';
import { TextArea } from '../../forms/TextArea/TextArea';
import { Stack } from '../../layout/Stack/Stack';
import { Muted } from '../../layout/Muted/Muted';
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
  const title = loading ? 'Loading case…' : (caseNumber ?? 'Billing case');

  return (
    <Drawer open={open} onClose={onClose} title={title} className={s.drawerWide}>
      <div className={s.panelHost}>
        {loading ? (
          <Muted>Fetching billing case…</Muted>
        ) : (
          <Stack gap={5}>
            <div className={s.badges}>
              {statusLabel ? <Badge tone={statusTone}>{statusLabel}</Badge> : null}
              {issueLabel ? <Badge tone="blue">{issueLabel}</Badge> : null}
              {amountLabel ? <Badge tone="mute">{amountLabel}</Badge> : null}
            </div>

            <div className={s.metaGrid}>
              <div>
                <p className={s.metaLabel}>Subscriber</p>
                <p className={s.metaValue}>{subscriberLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Creator</p>
                <p className={s.metaValue}>{creatorLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Opened</p>
                <p className={s.metaValue}>{createdLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Updated</p>
                <p className={s.metaValue}>{updatedLabel ?? '—'}</p>
              </div>
            </div>

            <Field label="Internal note">
              <TextArea
                rows={3}
                value={noteDraft}
                onChange={(e) => onNoteDraftChange(e.target.value)}
                maxLength={2000}
              />
            </Field>

            {error ? <p className={s.error}>{error}</p> : null}

            <div className={s.actions}>
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
            </div>

            {notes.length > 0 ? (
              <Stack gap={2}>
                <Muted>Internal notes</Muted>
                {notes.map((n, i) => (
                  <div key={i} className={s.noteCard}>
                    <p className={s.noteTime}>{n.createdLabel}</p>
                    <p className={s.noteBody}>{n.body}</p>
                  </div>
                ))}
              </Stack>
            ) : null}
          </Stack>
        )}
      </div>
    </Drawer>
  );
}
