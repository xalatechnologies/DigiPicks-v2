import React from 'react';
import { cx } from '../../../utils/cx';
import s from './DashboardLayout.module.css';

export interface DashboardLayoutProps {
  sidebar: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebar,
  children,
  className,
}) => {
  return (
    <div className={cx(s.app, className)}>
      <div className={s.sidebar}>{sidebar}</div>
      <main className={s.main}>{children}</main>
    </div>
  );
};
