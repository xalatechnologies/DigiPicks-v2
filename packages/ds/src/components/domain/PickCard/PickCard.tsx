import React from 'react';
import { cx } from '../../../utils/cx';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { SportTag } from '../../atoms/SportTag/SportTag';
import { AccessBadge } from '../../atoms/AccessBadge/AccessBadge';
import { GradeBadge } from '../../atoms/GradeBadge/GradeBadge';
import { DataPair } from '../../data/DataPair/DataPair';
import { AISummary } from '../../surfaces/AISummary/AISummary';
import { CreatorChip } from '../CreatorChip/CreatorChip';
import s from './PickCard.module.css';

export type PickAccess = 'free' | 'premium' | 'vip';

export interface PickCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  creatorName: string;
  creatorHandle: string;
  creatorMono: string;
  creatorColor: string;
  creatorVerified?: boolean;
  access: PickAccess;
  sport: string;
  event: string;
  eventTime: string;
  posted: string;
  title: string;
  market: string;
  selection: string;
  odds: string;
  units: string;
  body?: string;
  teaser?: string;
  status?: string;
  locked?: boolean;
  saved?: boolean;
  /** AI-generated 1-line summary. Renders an AISummary card under the body. */
  aiSummary?: string;
  /** AI confidence 0–100. Shown as a gauge inside the AISummary card. */
  aiConfidence?: number;
  /** AI long-form reasoning, shown via expandable toggle. */
  aiReasoning?: string;
  /** Model id, e.g. "claude-haiku-4-5". Shown as a small label. */
  aiModel?: string;
  onOpen?: React.MouseEventHandler<HTMLDivElement>;
  onSave?: React.MouseEventHandler<HTMLButtonElement>;
}

export const PickCard = React.forwardRef<HTMLDivElement, PickCardProps>(function PickCard(
  {
    creatorName,
    creatorHandle,
    creatorMono,
    creatorColor,
    creatorVerified,
    access,
    sport,
    event,
    eventTime,
    posted,
    title,
    market,
    selection,
    odds,
    units,
    body,
    teaser,
    status,
    locked,
    saved,
    aiSummary,
    aiConfidence,
    aiReasoning,
    aiModel,
    onOpen,
    onSave,
    className,
    ...rest
  },
  ref,
) {
  const isLocked = Boolean(locked) && access !== 'free';
  const interactive = Boolean(onOpen);

  const stop: React.MouseEventHandler<HTMLButtonElement> = (e) => e.stopPropagation();
  const handleSave: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    onSave?.(e);
  };
  const handleUnlock: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    onOpen?.(e as unknown as React.MouseEvent<HTMLDivElement>);
  };

  return (
    <div
      ref={ref}
      className={cx(s.card, interactive && s.interactive, className)}
      onClick={onOpen}
      {...rest}
    >
      <div className={s.top}>
        <CreatorChip
          name={creatorName}
          handle={creatorHandle}
          mono={creatorMono}
          color={creatorColor}
          verified={creatorVerified}
          size={26}
        />
        <div className={s.topRight}>
          <SportTag sport={sport} />
          <AccessBadge access={access} />
        </div>
      </div>

      <div className={s.body}>
        <div className={s.metaRow}>
          <span className={s.eventMeta}>
            {event} <span className={s.metaDot}>·</span> {eventTime}
          </span>
          <span className={s.posted}>{posted}</span>
        </div>

        <h3 className={s.title}>{title}</h3>

        <div className={s.dataGrid}>
          <DataPair label="Market" value={market} />
          <DataPair label="Selection" value={selection} />
          <DataPair label="Odds" value={odds} mono />
          <DataPair label="Stake" value={units} mono />
        </div>

        {isLocked ? (
          <div className={s.locked}>
            <div className={s.lockIcon}>
              <Icon name="lock" size={14} />
            </div>
            <div className={s.lockText}>
              Premium analysis hidden. Subscribe to {creatorName} to unlock pick reasoning, units,
              and confidence.
            </div>
            <Button variant="primary" size="sm" onClick={handleUnlock}>
              Unlock
            </Button>
          </div>
        ) : (
          <>
            {(body || teaser) && <p className={s.text}>{body ?? teaser}</p>}
            {aiSummary && (
              <AISummary
                summary={aiSummary}
                confidence={aiConfidence}
                reasoning={aiReasoning}
                model={aiModel}
              />
            )}
          </>
        )}

        <div className={s.foot}>
          <div className={s.actions}>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Icon name="bookmark" size={13} />
              {saved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={stop}>
              <Icon name="check" size={13} />
              Follow play
            </Button>
          </div>
          {status && <GradeBadge grade={status} />}
        </div>
      </div>
    </div>
  );
});
