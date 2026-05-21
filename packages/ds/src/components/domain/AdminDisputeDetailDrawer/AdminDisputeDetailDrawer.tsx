import React from 'react';
import { cx } from '../../../utils/cx';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Field } from '../../forms/Field/Field';
import { TextArea } from '../../forms/TextArea/TextArea';
import { Stack } from '../../layout/Stack/Stack';
import { Muted } from '../../layout/Muted/Muted';
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
  const title = loading ? 'Loading dispute…' : (pickTitle ?? 'Pick dispute');

  return (
    <Drawer open={open} onClose={onClose} title={title} className={s.drawerWide}>
      <div className={s.panelHost}>
        {loading ? (
          <Muted>Fetching dispute details…</Muted>
        ) : (
          <Stack gap={5}>
            <div className={s.badges}>
              {statusLabel ? <Badge tone={statusTone}>{statusLabel}</Badge> : null}
              {reason ? <Badge tone="blue">{reason}</Badge> : null}
            </div>

            {detail ? <p className={s.detail}>{detail}</p> : null}

            <div className={s.metaGrid}>
              <div>
                <p className={s.metaLabel}>Opened by</p>
                <p className={s.metaValue}>{openerLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Creator</p>
                <p className={s.metaValue}>{creatorLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Opened</p>
                <p className={s.metaValue}>{openedLabel ?? '—'}</p>
              </div>
            </div>

            <Field label="Resolution note" help="Stored on the dispute and audit log.">
              <TextArea
                rows={3}
                value={resolution}
                onChange={(e) => onResolutionChange(e.target.value)}
                maxLength={2000}
              />
            </Field>

            {error ? <p className={s.error}>{error}</p> : null}

            <div className={s.actions}>
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
            </div>

            {notes.length > 0 ? (
              <Stack gap={2}>
                <Muted>Notes</Muted>
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
