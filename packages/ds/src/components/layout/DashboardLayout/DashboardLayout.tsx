import React from 'react';
import { cx } from '../../../utils/cx';
import { SkipLink } from '../../atoms/SkipLink/SkipLink';
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
      <SkipLink />
      <div className={s.sidebar}>{sidebar}</div>
      <main id="main-content" className={s.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};
