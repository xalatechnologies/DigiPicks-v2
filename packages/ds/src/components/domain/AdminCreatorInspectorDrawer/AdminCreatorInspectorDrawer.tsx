import React from 'react';
import { AdminInspectorDrawerShell } from '../AdminInspectorDrawerShell/AdminInspectorDrawerShell';
import {
  AdminCreatorDetailPanel,
  type AdminCreatorDetailPanelProps,
} from '../AdminCreatorDetailPanel/AdminCreatorDetailPanel';

export interface AdminCreatorInspectorDrawerProps extends Omit<
  AdminCreatorDetailPanelProps,
  'className'
> {
  open: boolean;
  onClose: () => void;
}

export function AdminCreatorInspectorDrawer({
  open,
  onClose,
  creator,
  loading,
  ...panelProps
}: AdminCreatorInspectorDrawerProps) {
  const ariaLabel = loading
    ? 'Loading creator details'
    : creator
      ? `Creator details: ${creator.name}`
      : 'Creator details';

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      <AdminCreatorDetailPanel
        variant="drawer"
        creator={creator}
        loading={loading}
        {...panelProps}
      />
    </AdminInspectorDrawerShell>
  );
}
