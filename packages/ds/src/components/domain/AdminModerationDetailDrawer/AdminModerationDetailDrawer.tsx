import React from 'react';
import { cx } from '../../../utils/cx';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Stack } from '../../layout/Stack/Stack';
import { Muted } from '../../layout/Muted/Muted';
import s from './AdminModerationDetailDrawer.module.css';

export type AdminModerationDetailSeverity = 'critical' | 'high' | 'normal';

export interface AdminModerationDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  typeLabel?: string;
  subject?: string;
  creatorLabel?: string;
  reason?: string;
  statusLabel?: string;
  flaggedAtLabel?: string;
  detail?: string;
  severity?: AdminModerationDetailSeverity;
  severityLabel?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  approveLabel?: string;
  onApprove?: () => void;
  rejectLabel?: string;
  onReject?: () => void;
  busy?: boolean;
}

const SEVERITY_CLASS: Record<AdminModerationDetailSeverity, string> = {
  critical: s.severityCritical,
  high: s.severityHigh,
  normal: s.severityNormal,
};

export function AdminModerationDetailDrawer({
  open,
  onClose,
  loading,
  typeLabel,
  subject,
  creatorLabel,
  reason,
  statusLabel,
  flaggedAtLabel,
  detail,
  severity = 'normal',
  severityLabel,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  approveLabel = 'Approve',
  onApprove,
  rejectLabel = 'Reject',
  onReject,
  busy,
}: AdminModerationDetailDrawerProps) {
  const title = loading ? 'Loading item…' : (subject ?? 'Moderation item');

  return (
    <Drawer open={open} onClose={onClose} title={title} className={s.drawerWide}>
      <div className={s.panelHost}>
        {loading ? (
          <Muted>Fetching details…</Muted>
        ) : (
          <Stack gap={5}>
            <div className={s.badges}>
              {typeLabel ? <Badge tone="blue">{typeLabel}</Badge> : null}
              {severityLabel ? (
                <span className={cx(s.severityBadge, SEVERITY_CLASS[severity])}>
                  {severityLabel}
                </span>
              ) : null}
            </div>

            <div className={s.metaGrid}>
              <div>
                <p className={s.metaLabel}>Creator</p>
                <p className={s.metaValue}>{creatorLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Status</p>
                <p className={s.metaValue}>{statusLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Reason</p>
                <p className={s.metaValue}>{reason ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Flagged</p>
                <p className={s.metaValue}>{flaggedAtLabel ?? '—'}</p>
              </div>
            </div>

            {detail ? <p className={s.detail}>{detail}</p> : null}

            <div className={s.actions}>
              {onApprove ? (
                <Button variant="primary" disabled={busy} onClick={onApprove}>
                  {approveLabel}
                </Button>
              ) : null}
              {onReject ? (
                <Button variant="outline" disabled={busy} onClick={onReject}>
                  {rejectLabel}
                </Button>
              ) : null}
              {primaryActionLabel && onPrimaryAction ? (
                <Button variant="primary" disabled={busy} onClick={onPrimaryAction}>
                  {primaryActionLabel}
                </Button>
              ) : null}
              {secondaryActionLabel && onSecondaryAction ? (
                <Button variant="secondary" disabled={busy} onClick={onSecondaryAction}>
                  {secondaryActionLabel}
                </Button>
              ) : null}
            </div>
          </Stack>
        )}
      </div>
    </Drawer>
  );
}
