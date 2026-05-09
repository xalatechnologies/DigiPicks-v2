import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../Icon/Icon';
import s from './TrustScoreBadge.module.css';

export interface TrustScoreBadgeProps {
  /** Composite 0–100 score from convex/trust.ts. Null when not yet computed. */
  score: number | null;
  /** Size variant — 'sm' is inline, 'md' is the creator-profile pill. */
  size?: 'sm' | 'md';
  /** Optional tooltip override for context (e.g. "Updated 2h ago"). */
  hint?: string;
  className?: string;
}

function tierFor(score: number): { label: string; tone: string } {
  if (score >= 85) return { label: 'Elite', tone: 'gold' };
  if (score >= 70) return { label: 'Trusted', tone: 'green' };
  if (score >= 50) return { label: 'Established', tone: 'blue' };
  if (score >= 30) return { label: 'Emerging', tone: 'amber' };
  return { label: 'Unverified', tone: 'red' };
}

/**
 * Visual summary of a creator's trust score. Pill on creator cards / profile.
 * Score is computed nightly by `convex/trust.recomputeTrustScores`.
 */
export const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  score,
  size = 'md',
  hint,
  className,
}) => {
  if (score === null || score === undefined) {
    return (
      <span
        className={cx(s.badge, s.muted, size === 'sm' && s.sm, className)}
        title={hint ?? 'Trust score not yet computed'}
      >
        <Icon name="shield" size={size === 'sm' ? 11 : 13} />
        <span>—</span>
      </span>
    );
  }
  const tier = tierFor(score);
  return (
    <span
      className={cx(s.badge, s[tier.tone], size === 'sm' && s.sm, className)}
      title={hint ?? `${tier.label} · trust ${score}/100`}
    >
      <Icon name="shield" size={size === 'sm' ? 11 : 13} />
      <span className={s.score}>{score}</span>
      <span className={s.tier}>{tier.label}</span>
    </span>
  );
};
