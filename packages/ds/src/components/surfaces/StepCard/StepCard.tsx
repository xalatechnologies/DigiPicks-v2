import React from 'react';
import { cx } from '../../../utils/cx';
import lift from '../../../utils/lightMarketingSurface.module.css';
import s from './StepCard.module.css';

export type StepCardTone = 'primary' | 'violet' | 'green' | 'gold';

export interface StepCardProps {
  /** Step number rendered in the gradient badge. */
  step: number | string;
  title: string;
  body: React.ReactNode;
  /** Optional accent icon rendered next to the number badge. */
  icon?: React.ReactNode;
  /** Tone — drives accent line, glow, and number badge gradient. */
  tone?: StepCardTone;
  /** Optional footer hint (mono uppercase). */
  hint?: React.ReactNode;
  className?: string;
}

const TONE_VAR: Record<StepCardTone, string> = {
  primary: 'var(--primary)',
  violet: 'var(--violet)',
  green: 'var(--green)',
  gold: 'var(--gold)',
};

export function StepCard({
  step,
  title,
  body,
  icon,
  tone = 'primary',
  hint,
  className,
}: StepCardProps) {
  const cssVars = { '--step-color': TONE_VAR[tone] } as React.CSSProperties;
  return (
    <article className={cx(s.card, lift.surface, className)} style={cssVars}>
      <span className={s.shine} aria-hidden="true" />
      <div className={s.head}>
        <span className={s.number} aria-hidden="true">
          {typeof step === 'number' ? String(step).padStart(2, '0') : step}
        </span>
        {icon && <span className={s.icon}>{icon}</span>}
        <h3 className={s.title}>{title}</h3>
      </div>
      <p className={s.body}>{body}</p>
      {hint && <div className={s.foot}>{hint}</div>}
    </article>
  );
}
