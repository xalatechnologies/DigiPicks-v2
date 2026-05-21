import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './StudioComposerAside.module.css';

export interface StudioComposerAsideProps {
  previewTitle?: string;
  previewSub?: string;
  children?: React.ReactNode;
  tipTitle?: string;
  tipBody?: string;
  className?: string;
}

/** Sticky right column for studio compose flows (picks, events). */
export function StudioComposerAside({
  previewTitle = 'Subscriber preview',
  previewSub = 'Updates live as you type.',
  children,
  tipTitle,
  tipBody,
  className,
}: StudioComposerAsideProps) {
  return (
    <aside className={cx(s.aside, className)} aria-label="Compose preview">
      <div className={s.previewHead}>
        <span className={s.previewEyebrow}>Preview</span>
        <h2 className={s.previewTitle}>{previewTitle}</h2>
        {previewSub ? <p className={s.previewSub}>{previewSub}</p> : null}
      </div>

      {children ? <div className={s.previewBody}>{children}</div> : null}

      {tipTitle && tipBody ? (
        <div className={s.tip}>
          <span className={s.tipIcon} aria-hidden="true">
            <Icon name="chart" size={20} />
          </span>
          <h3 className={s.tipTitle}>{tipTitle}</h3>
          <p className={s.tipBody}>{tipBody}</p>
        </div>
      ) : null}
    </aside>
  );
}
