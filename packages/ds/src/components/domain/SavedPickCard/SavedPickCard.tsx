import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import s from './SavedPickCard.module.css';

export interface SavedPickCardProps {
  creatorName: string;
  creatorMono: string;
  creatorColor: string;
  creatorVerified?: boolean;
  creatorTag?: string;
  event: string;
  sport: string;
  title: string;
  excerpt?: string;
  savedLabel: string;
  locked?: boolean;
  onCreatorClick?: () => void;
  onRemove?: () => void;
  onOpen?: () => void;
  className?: string;
}

export function SavedPickCard({
  creatorName,
  creatorMono,
  creatorColor,
  creatorVerified,
  creatorTag,
  event,
  sport,
  title,
  excerpt,
  savedLabel,
  locked,
  onCreatorClick,
  onRemove,
  onOpen,
  className,
}: SavedPickCardProps) {
  const cssVars = { '--av-color': creatorColor } as React.CSSProperties;

  const creatorBlock = (
    <>
      <Avatar mono={creatorMono} color={creatorColor} size={48} />
      <div className={s.creatorCopy}>
        <p className={s.creatorName}>
          {creatorName}
          {creatorVerified ? (
            <>
              {' '}
              <VerifiedMark size={14} />
            </>
          ) : null}
        </p>
        {creatorTag ? <p className={s.creatorTag}>{creatorTag}</p> : null}
      </div>
    </>
  );

  return (
    <article className={cx(s.card, className)} style={cssVars}>
      <div className={s.head}>
        {onCreatorClick ? (
          <button type="button" className={s.creator} onClick={onCreatorClick}>
            {creatorBlock}
          </button>
        ) : (
          <div className={s.creator}>{creatorBlock}</div>
        )}
        {onRemove ? (
          <button
            type="button"
            className={s.remove}
            onClick={onRemove}
            aria-label={`Remove ${title} from saved`}
          >
            <Icon name="trash" size={20} />
          </button>
        ) : null}
      </div>

      <div className={cx(s.body, locked && s.bodyLocked)}>
        {locked ? (
          <div className={s.lockOverlay} aria-hidden="true">
            <Icon name="lock" size={36} />
            <p className={s.lockLabel}>Subscriber only</p>
          </div>
        ) : null}
        <div className={s.tags}>
          <span className={s.tag}>{event}</span>
          <span className={cx(s.tag, s.tagSport)}>{sport}</span>
        </div>
        <h3 className={s.title}>{title}</h3>
        {excerpt ? <p className={s.excerpt}>{excerpt}</p> : null}
      </div>

      <footer className={s.foot}>
        <p className={s.savedMeta}>{savedLabel}</p>
        {onOpen ? (
          <Button variant="primary" size="sm" onClick={onOpen}>
            {locked ? 'Unlock pick' : 'Open pick'}
          </Button>
        ) : null}
      </footer>
    </article>
  );
}
