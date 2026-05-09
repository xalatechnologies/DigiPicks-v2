import React from 'react';
import { cx } from '../../../utils/cx';
import { SkipLink } from '../../atoms/SkipLink/SkipLink';
import s from './AppLayout.module.css';

export interface AppLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ header, sidebar, children, className }) => {
  return (
    <div className={cx(s.app, className)}>
      <SkipLink />
      <div className={s.header}>{header}</div>
      <div className={s.sidebar}>{sidebar}</div>
      <main id="main-content" className={s.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
};
