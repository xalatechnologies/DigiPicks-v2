import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';
import { Muted } from '../../layout/Muted/Muted';
import { AdminInspectorDrawerShell } from '../AdminInspectorDrawerShell/AdminInspectorDrawerShell';
import {
  AdminDetailDrawerBody,
  AdminDetailMetaCard,
  AdminDetailSection,
} from '../AdminDetailDrawerBody/AdminDetailDrawerBody';
import bd from '../AdminDetailDrawerBody/AdminDetailDrawerBody.module.css';

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
  const ariaLabel = loading ? 'Loading audit entry' : (action ?? 'Audit entry');
  const title = loading ? 'Loading entry…' : (action ?? 'Audit entry');

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {loading ? (
        <div className={bd.scroll}>
          <Muted>Fetching audit entry…</Muted>
        </div>
      ) : (
        <AdminDetailDrawerBody
          title={title}
          badges={entityType ? <Badge tone="blue">{entityType}</Badge> : null}
        >
          <div className={bd.metaGrid}>
            <AdminDetailMetaCard label="Actor" value={actorLabel ?? 'System'} />
            <AdminDetailMetaCard label="When" value={timeLabel} />
            <AdminDetailMetaCard label="Entity ID" value={entityId} />
          </div>

          {metadataJson ? (
            <AdminDetailSection title="Metadata">
              <pre className={bd.metadata}>{metadataJson}</pre>
            </AdminDetailSection>
          ) : null}
        </AdminDetailDrawerBody>
      )}
    </AdminInspectorDrawerShell>
  );
}
