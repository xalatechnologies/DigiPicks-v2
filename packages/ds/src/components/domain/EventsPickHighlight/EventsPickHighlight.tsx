import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import s from './EventsPickHighlight.module.css';

export interface EventsPickHighlightProps {
  creatorName: string;
  creatorSub?: string;
  avatarMono: string;
  avatarColor: string;
  insight: string;
  pickLabel: string;
  pickOdds?: string;
  consensusPercent?: number;
  consensusCaption?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function EventsPickHighlight({
  creatorName,
  creatorSub,
  avatarMono,
  avatarColor,
  insight,
  pickLabel,
  pickOdds,
  consensusPercent,
  consensusCaption,
  ctaLabel = 'View full analysis',
  onCta,
  className,
}: EventsPickHighlightProps) {
  const pct = consensusPercent != null ? Math.max(0, Math.min(100, consensusPercent)) : null;

  return (
    <article className={cx(s.card, className)}>
      <h3 className={s.title}>
        <Icon name="verified" size={14} />
        Pick highlight
      </h3>

      <div className={s.creator}>
        <Avatar mono={avatarMono} color={avatarColor} size={40} />
        <div className={s.creatorCopy}>
          <p className={s.creatorName}>{creatorName}</p>
          {creatorSub ? <p className={s.creatorSub}>{creatorSub}</p> : null}
        </div>
      </div>

      <div className={s.insight}>
        <span className={s.insightLabel}>The insight</span>
        <p className={s.insightBody}>{insight}</p>
      </div>

      {(pickLabel || pickOdds || pct != null) && (
        <div className={s.pickRow}>
          <div className={s.pickMeta}>
            <span>{pickLabel}</span>
            {pickOdds ? <span className={s.pickOdds}>{pickOdds}</span> : null}
          </div>
          {pct != null ? (
            <>
              <div className={s.bar} role="presentation">
                <div
                  className={s.barFill}
                  style={{ '--consensus-pct': `${pct}%` } as React.CSSProperties}
                />
              </div>
              {consensusCaption ? <p className={s.barCaption}>{consensusCaption}</p> : null}
            </>
          ) : null}
        </div>
      )}

      {onCta ? (
        <Button variant="primary" block onClick={onCta}>
          {ctaLabel}
        </Button>
      ) : null}
    </article>
  );
}
