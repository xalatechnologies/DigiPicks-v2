import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import {
  AdminCreatorDetailPanel,
  type AdminCreatorDetailPanelProps,
} from '../AdminCreatorDetailPanel/AdminCreatorDetailPanel';
import s from './AdminCreatorInspectorDrawer.module.css';

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
  const title = loading ? 'Loading creator…' : (creator?.name ?? 'Creator details');

  return (
    <Drawer open={open} onClose={onClose} title={title} className={s.drawerWide}>
      <div className={s.panelHost}>
        <AdminCreatorDetailPanel
          variant="drawer"
          creator={creator}
          loading={loading}
          {...panelProps}
        />
      </div>
    </Drawer>
  );
}
