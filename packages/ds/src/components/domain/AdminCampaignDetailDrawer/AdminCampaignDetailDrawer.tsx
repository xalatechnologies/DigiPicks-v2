import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Stack } from '../../layout/Stack/Stack';
import { Muted } from '../../layout/Muted/Muted';
import s from './AdminCampaignDetailDrawer.module.css';

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
  const drawerTitle = loading ? 'Loading campaign…' : (title ?? 'Campaign');

  return (
    <Drawer open={open} onClose={onClose} title={drawerTitle} className={s.drawerWide}>
      <div className={s.panelHost}>
        {loading ? (
          <Muted>Fetching campaign details…</Muted>
        ) : (
          <Stack gap={5}>
            <div className={s.badges}>
              {statusLabel ? <Badge tone={statusTone}>{statusLabel}</Badge> : null}
              {channelLabel ? <Badge tone="blue">{channelLabel}</Badge> : null}
            </div>

            {body ? <p className={s.body}>{body}</p> : null}

            <div className={s.metaGrid}>
              <div>
                <p className={s.metaLabel}>Created by</p>
                <p className={s.metaValue}>{createdByLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Created</p>
                <p className={s.metaValue}>{createdLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Scheduled</p>
                <p className={s.metaValue}>{scheduledLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Sent</p>
                <p className={s.metaValue}>{sentLabel ?? '—'}</p>
              </div>
            </div>

            {onCompose ? (
              <Button variant="primary" onClick={onCompose}>
                New campaign
              </Button>
            ) : null}
          </Stack>
        )}
      </div>
    </Drawer>
  );
}
