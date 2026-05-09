import React from 'react';
import { cx } from '../../../utils/cx';
import { SkipLink } from '../../atoms/SkipLink/SkipLink';
import s from './PublicLayout.module.css';

export interface PublicLayoutProps {
  header: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  header,
  footer,
  children,
  className,
}) => {
  return (
    <div className={cx(s.layout, className)}>
      <SkipLink />
      <header className={s.header}>
        <div className={s.headerInner}>{header}</div>
      </header>
      <main id="main-content" className={s.main} tabIndex={-1}>
        {children}
      </main>
      {footer && <div className={s.footer}>{footer}</div>}
    </div>
  );
};
