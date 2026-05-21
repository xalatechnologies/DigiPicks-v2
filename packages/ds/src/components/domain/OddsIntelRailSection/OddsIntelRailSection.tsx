import React from 'react';
import { cx } from '../../../utils/cx';
import s from './OddsIntelRailSection.module.css';

export interface OddsIntelRailSectionProps {
  eyebrow?: string;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function OddsIntelRailSection({
  eyebrow,
  title,
  action,
  children,
  className,
}: OddsIntelRailSectionProps) {
  return (
    <section className={cx(s.section, className)}>
      {eyebrow || title || action ? (
        <header className={s.head}>
          <div>
            {eyebrow ? <span className={s.eyebrow}>{eyebrow}</span> : null}
            {title ? <h3 className={s.title}>{title}</h3> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={s.list}>{children}</div>
    </section>
  );
}
