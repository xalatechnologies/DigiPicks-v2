import React from 'react';
import { cx } from '../../../utils/cx';
import s from './CreatorsHorizontalRail.module.css';

export interface CreatorsHorizontalRailProps {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function CreatorsHorizontalRail({
  eyebrow,
  title,
  children,
  className,
}: CreatorsHorizontalRailProps) {
  return (
    <section className={cx(s.section, className)}>
      <header className={s.head}>
        <div>
          {eyebrow ? <span className={s.eyebrow}>{eyebrow}</span> : null}
          <h2 className={s.title}>{title}</h2>
        </div>
      </header>
      <div className={s.rail}>{children}</div>
    </section>
  );
}

export interface CreatorsHorizontalRailItemProps {
  children?: React.ReactNode;
  className?: string;
}

export function CreatorsHorizontalRailItem({
  children,
  className,
}: CreatorsHorizontalRailItemProps) {
  return <div className={cx(s.item, className)}>{children}</div>;
}
