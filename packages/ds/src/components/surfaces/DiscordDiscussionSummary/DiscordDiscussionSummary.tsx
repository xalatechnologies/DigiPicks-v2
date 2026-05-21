import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Card } from '../Card/Card';
import s from './DiscordDiscussionSummary.module.css';

export interface DiscordDiscussionSummaryProps {
  /** Aggregate sentiment in the range [-1, 1]. */
  avgSentiment: number;
  /** Number of messages contributing to this window. */
  messageCount: number;
  /** Free-text summary of what the community is discussing. */
  summary: string;
  /** Optional list of trending themes / hashtags. */
  topThemes?: string[];
  /** Window start (ms epoch). */
  windowStart: number;
  /** Window end (ms epoch). */
  windowEnd: number;
  className?: string;
}

function formatRange(start: number, end: number): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

function sentimentLabel(v: number): { label: string; tone: 'pos' | 'neu' | 'neg' } {
  if (v >= 0.25) return { label: 'Bullish', tone: 'pos' };
  if (v <= -0.25) return { label: 'Bearish', tone: 'neg' };
  return { label: 'Neutral', tone: 'neu' };
}

/**
 * Sentiment + summary block for a Discord discussion window. Includes a
 * Community discussion summary card for Discord thread insights.
 * opinions, not verified facts.
 */
export function DiscordDiscussionSummary({
  avgSentiment,
  messageCount,
  summary,
  topThemes,
  windowStart,
  windowEnd,
  className,
}: DiscordDiscussionSummaryProps) {
  // Map [-1, 1] → [0, 100]; needle position uses the same ramp.
  const pct = Math.max(0, Math.min(100, ((avgSentiment + 1) / 2) * 100));
  const { label, tone } = sentimentLabel(avgSentiment);
  const cssVars = { '--dds-pct': `${pct}%` } as React.CSSProperties;

  return (
    <Card pad="lg" className={cx(s.card, className)}>
      <header className={s.head}>
        <span className={s.iconWrap} aria-hidden="true">
          <Icon name="discord" size={18} />
        </span>
        <div className={s.headText}>
          <h3 className={s.title}>Community pulse</h3>
          <p className={s.window}>
            {messageCount.toLocaleString()} messages · {formatRange(windowStart, windowEnd)}
          </p>
        </div>
        <span className={cx(s.sentimentPill, s[`tone_${tone}`])}>{label}</span>
      </header>

      <div
        className={s.bar}
        style={cssVars}
        role="progressbar"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={avgSentiment}
        aria-label="Average sentiment"
      >
        <span className={s.barTrack} />
        <span className={s.barNeedle} />
        <span className={s.barAxis}>
          <span>−1</span>
          <span>0</span>
          <span>+1</span>
        </span>
      </div>

      <p className={s.summary}>{summary}</p>

      {topThemes && topThemes.length > 0 && (
        <ul className={s.themes} role="list">
          {topThemes.map((t) => (
            <li key={t} className={s.theme}>
              {t}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
