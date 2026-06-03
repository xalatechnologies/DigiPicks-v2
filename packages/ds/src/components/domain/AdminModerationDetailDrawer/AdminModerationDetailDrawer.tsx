import React from 'react';
import { cx } from '../../../utils/cx';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Muted } from '../../layout/Muted/Muted';
import { AdminInspectorDrawerShell } from '../AdminInspectorDrawerShell/AdminInspectorDrawerShell';
import {
  AdminDetailDrawerBody,
  AdminDetailMetaCard,
} from '../AdminDetailDrawerBody/AdminDetailDrawerBody';
import bd from '../AdminDetailDrawerBody/AdminDetailDrawerBody.module.css';
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
  const ariaLabel = loading ? 'Loading moderation item' : (subject ?? 'Moderation item');
  const title = loading ? 'Loading item…' : (subject ?? 'Moderation item');

  const footer = (
    <>
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
    </>
  );

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {loading ? (
        <div className={bd.scroll}>
          <Muted>Fetching details…</Muted>
        </div>
      ) : (
        <AdminDetailDrawerBody
          title={title}
          badges={
            <>
              {typeLabel ? <Badge tone="blue">{typeLabel}</Badge> : null}
              {severityLabel ? (
                <span className={cx(s.severityBadge, SEVERITY_CLASS[severity])}>
                  {severityLabel}
                </span>
              ) : null}
            </>
          }
          footer={footer}
          footerLayout="row"
        >
          <div className={bd.metaGrid}>
            <AdminDetailMetaCard label="Creator" value={creatorLabel} />
            <AdminDetailMetaCard label="Status" value={statusLabel} />
            <AdminDetailMetaCard label="Reason" value={reason} />
            <AdminDetailMetaCard label="Flagged" value={flaggedAtLabel} />
          </div>
          {detail ? <p className={bd.detail}>{detail}</p> : null}
        </AdminDetailDrawerBody>
      )}
    </AdminInspectorDrawerShell>
  );
}
