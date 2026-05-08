import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Sidebar.module.css';

export interface SidebarProps {
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, footer, className }) => {
  return (
    <aside className={cx(s.sidebar, className)}>
      <div className={s.nav}>{children}</div>
      {footer && <div className={s.foot}>{footer}</div>}
    </aside>
  );
};
