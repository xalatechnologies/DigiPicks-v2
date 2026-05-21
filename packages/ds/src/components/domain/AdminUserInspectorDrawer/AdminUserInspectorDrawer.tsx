import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import {
  AdminUserDetailPanel,
  type AdminUserDetailPanelProps,
} from '../AdminUserDetailPanel/AdminUserDetailPanel';
import s from './AdminUserInspectorDrawer.module.css';

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
  const title = loading ? 'Loading user…' : (user?.name ?? 'User details');

  return (
    <Drawer open={open} onClose={onClose} title={title} className={s.drawerWide}>
      <div className={s.panelHost}>
        <AdminUserDetailPanel variant="drawer" user={user} loading={loading} {...panelProps} />
      </div>
    </Drawer>
  );
}
