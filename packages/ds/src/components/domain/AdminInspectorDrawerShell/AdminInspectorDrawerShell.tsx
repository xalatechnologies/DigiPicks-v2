import React from 'react';
import { cx } from '../../../utils/cx';
import { Drawer } from '../../feedback/Drawer/Drawer';
import s from './AdminInspectorDrawerShell.module.css';

export interface AdminInspectorDrawerShellProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  /** Panel supplies its own title — omit drawer chrome heading. */
  hideHeader?: boolean;
  flushBody?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function AdminInspectorDrawerShell({
  open,
  onClose,
  ariaLabel,
  hideHeader = true,
  flushBody = true,
  children,
  className,
}: AdminInspectorDrawerShellProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      ariaLabel={ariaLabel}
      hideHeader={hideHeader}
      flushBody={flushBody}
      className={cx(s.drawerWide, className)}
    >
      <div className={s.panelHost}>{children}</div>
    </Drawer>
  );
}
