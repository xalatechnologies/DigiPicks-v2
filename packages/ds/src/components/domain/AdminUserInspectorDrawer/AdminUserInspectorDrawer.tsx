import React from 'react';
import { AdminInspectorDrawerShell } from '../AdminInspectorDrawerShell/AdminInspectorDrawerShell';
import {
  AdminUserDetailPanel,
  type AdminUserDetailPanelProps,
} from '../AdminUserDetailPanel/AdminUserDetailPanel';

export interface AdminUserInspectorDrawerProps extends Omit<
  AdminUserDetailPanelProps,
  'className'
> {
  open: boolean;
  onClose: () => void;
}

export function AdminUserInspectorDrawer({
  open,
  onClose,
  user,
  loading,
  ...panelProps
}: AdminUserInspectorDrawerProps) {
  const ariaLabel = loading
    ? 'Loading user details'
    : user
      ? `User details: ${user.name}`
      : 'User details';

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      <AdminUserDetailPanel variant="drawer" user={user} loading={loading} {...panelProps} />
    </AdminInspectorDrawerShell>
  );
}
