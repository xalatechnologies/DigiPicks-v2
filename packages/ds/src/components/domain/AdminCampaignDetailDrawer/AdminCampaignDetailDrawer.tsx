import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Muted } from '../../layout/Muted/Muted';
import { AdminInspectorDrawerShell } from '../AdminInspectorDrawerShell/AdminInspectorDrawerShell';
import {
  AdminDetailDrawerBody,
  AdminDetailMetaCard,
} from '../AdminDetailDrawerBody/AdminDetailDrawerBody';
import bd from '../AdminDetailDrawerBody/AdminDetailDrawerBody.module.css';

export interface AdminCampaignDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  title?: string;
  body?: string;
  channelLabel?: string;
  statusLabel?: string;
  statusTone?: 'green' | 'amber' | 'mute';
  createdByLabel?: string;
  scheduledLabel?: string;
  sentLabel?: string;
  createdLabel?: string;
  onCompose?: () => void;
}

export function AdminCampaignDetailDrawer({
  open,
  onClose,
  loading,
  title,
  body,
  channelLabel,
  statusLabel,
  statusTone = 'mute',
  createdByLabel,
  scheduledLabel,
  sentLabel,
  createdLabel,
  onCompose,
}: AdminCampaignDetailDrawerProps) {
  const ariaLabel = loading ? 'Loading campaign' : (title ?? 'Campaign');
  const drawerTitle = loading ? 'Loading campaign…' : (title ?? 'Campaign');

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {loading ? (
        <div className={bd.scroll}>
          <Muted>Fetching campaign details…</Muted>
        </div>
      ) : (
        <AdminDetailDrawerBody
          title={drawerTitle}
          badges={
            <>
              {statusLabel ? <Badge tone={statusTone}>{statusLabel}</Badge> : null}
              {channelLabel ? <Badge tone="blue">{channelLabel}</Badge> : null}
            </>
          }
          footer={
            onCompose ? (
              <Button variant="primary" onClick={onCompose}>
                New campaign
              </Button>
            ) : null
          }
          footerLayout="stack"
        >
          {body ? <p className={bd.detail}>{body}</p> : null}
          <div className={bd.metaGrid}>
            <AdminDetailMetaCard label="Created by" value={createdByLabel} />
            <AdminDetailMetaCard label="Created" value={createdLabel} />
            <AdminDetailMetaCard label="Scheduled" value={scheduledLabel} />
            <AdminDetailMetaCard label="Sent" value={sentLabel} />
          </div>
        </AdminDetailDrawerBody>
      )}
    </AdminInspectorDrawerShell>
  );
}
