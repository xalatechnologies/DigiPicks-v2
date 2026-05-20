import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './CreatorProfileAbout.module.css';

export interface CreatorProfileInclude {
  text: string;
}

export interface CreatorProfileAboutProps {
  title: string;
  bio: React.ReactNode;
  includes: CreatorProfileInclude[];
  highlightLabel?: string;
  highlightValue?: React.ReactNode;
  highlightSub?: string;
  className?: string;
}

export function CreatorProfileAbout({
  title,
  bio,
  includes,
  highlightLabel,
  highlightValue,
  highlightSub,
  className,
}: CreatorProfileAboutProps) {
  return (
    <section className={cx(s.section, className)}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.bio}>{bio}</p>
      <div className={s.panel}>
        <div>
          <h3 className={s.includesTitle}>What&apos;s included</h3>
          <ul className={s.list}>
            {includes.map((item) => (
              <li key={item.text} className={s.item}>
                <Icon name="check" size={20} className={s.itemIcon} />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        {highlightValue ? (
          <div className={s.highlight}>
            {highlightLabel ? <p className={s.highlightLabel}>{highlightLabel}</p> : null}
            <p className={s.highlightValue}>
              {highlightValue}
              {highlightSub ? <span className={s.highlightSub}>{highlightSub}</span> : null}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
