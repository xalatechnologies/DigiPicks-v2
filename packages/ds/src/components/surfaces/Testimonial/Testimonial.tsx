import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import s from './Testimonial.module.css';

export interface TestimonialProps {
  quote: React.ReactNode;
  authorName: string;
  authorRole: string;
  authorMono: string;
  authorColor: string;
  authorVerified?: boolean;
  /** Optional right-aligned stat (e.g., "+18.4u" / "ROI"). */
  statValue?: React.ReactNode;
  statLabel?: React.ReactNode;
  className?: string;
}

export function Testimonial({
  quote,
  authorName,
  authorRole,
  authorMono,
  authorColor,
  authorVerified,
  statValue,
  statLabel,
  className,
}: TestimonialProps) {
  return (
    <article className={cx(s.card, className)}>
      <span className={s.quoteMark} aria-hidden="true">"</span>
      <p className={s.quote}>{quote}</p>
      <div className={s.author}>
        <Avatar mono={authorMono} color={authorColor} size={40} />
        <div className={s.authorText}>
          <span className={s.authorName}>
            {authorName}
            {authorVerified && <VerifiedMark size={14} />}
          </span>
          <span className={s.authorRole}>{authorRole}</span>
        </div>
        {(statValue || statLabel) && (
          <>
            <span className={s.spacer} />
            <div className={s.stat}>
              {statValue && <span className={s.statValue}>{statValue}</span>}
              {statLabel && <span className={s.statLabel}>{statLabel}</span>}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
