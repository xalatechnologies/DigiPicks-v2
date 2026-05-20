import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './AccountSavedLibraryFooter.module.css';

export interface AccountSavedLibraryFooterProps {
  streakTitle: string;
  streakBody: string;
  streakActions?: React.ReactNode;
  tipTitle?: string;
  tipBody: string;
  tipMeta?: string;
  className?: string;
}

export function AccountSavedLibraryFooter({
  streakTitle,
  streakBody,
  streakActions,
  tipTitle = 'Curation tip',
  tipBody,
  tipMeta,
  className,
}: AccountSavedLibraryFooterProps) {
  return (
    <section className={cx(s.wrap, className)} aria-label="Library insights">
      <article className={s.streak}>
        <div className={s.streakCopy}>
          <h2 className={s.streakTitle}>{streakTitle}</h2>
          <p className={s.streakBody}>{streakBody}</p>
        </div>
        {streakActions ? <div className={s.streakActions}>{streakActions}</div> : null}
        <div className={s.streakDecor} aria-hidden="true">
          <Icon name="chart" size={200} />
        </div>
      </article>

      <aside className={s.tip}>
        <div className={s.tipHead}>
          <Icon name="sparkles" size={22} />
          <h3 className={s.tipTitle}>{tipTitle}</h3>
        </div>
        <p className={s.tipBody}>{tipBody}</p>
        {tipMeta ? <p className={s.tipMeta}>{tipMeta}</p> : null}
      </aside>
    </section>
  );
}
