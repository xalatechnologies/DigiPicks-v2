import React from 'react';
import { cx } from '../../../utils/cx';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Badge } from '../../atoms/Badge/Badge';
import { Stack } from '../../layout/Stack/Stack';
import { Muted } from '../../layout/Muted/Muted';
import s from './AdminAuditDetailDrawer.module.css';

export interface AdminAuditDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorLabel?: string;
  timeLabel?: string;
  metadataJson?: string;
}

export function AdminAuditDetailDrawer({
  open,
  onClose,
  loading,
  action,
  entityType,
  entityId,
  actorLabel,
  timeLabel,
  metadataJson,
}: AdminAuditDetailDrawerProps) {
  const title = loading ? 'Loading entry…' : (action ?? 'Audit entry');

  return (
    <Drawer open={open} onClose={onClose} title={title} className={s.drawerWide}>
      <div className={s.panelHost}>
        {loading ? (
          <Muted>Fetching audit entry…</Muted>
        ) : (
          <Stack gap={5}>
            {entityType ? <Badge tone="blue">{entityType}</Badge> : null}

            <div className={s.metaGrid}>
              <div>
                <p className={s.metaLabel}>Actor</p>
                <p className={s.metaValue}>{actorLabel ?? 'System'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>When</p>
                <p className={s.metaValue}>{timeLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Entity ID</p>
                <p className={cx(s.metaValue, s.metaMono)}>{entityId ?? '—'}</p>
              </div>
            </div>

            {metadataJson ? (
              <>
                <p className={s.metaLabel}>Metadata</p>
                <pre className={s.metadata}>{metadataJson}</pre>
              </>
            ) : null}
          </Stack>
        )}
      </div>
    </Drawer>
  );
}
