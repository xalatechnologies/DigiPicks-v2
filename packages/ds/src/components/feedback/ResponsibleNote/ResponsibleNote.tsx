import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './ResponsibleNote.module.css';

export interface ResponsibleNoteProps {
  /** Override the headline (default: "Bet responsibly."). */
  title?: React.ReactNode;
  /** Override the body text. */
  body?: React.ReactNode;
  /** Phone number for the help-line button (default: 1-800-GAMBLER). */
  helplineNumber?: string;
  /** Hide the help-line action. */
  hideHelpline?: boolean;
  className?: string;
}

const DEFAULT_BODY =
  'DigiPicks creators share research and opinions, not guarantees. Only stake what you can afford to lose, and seek help if gambling stops being fun.';

export const ResponsibleNote: React.FC<ResponsibleNoteProps> = ({
  title = 'Bet responsibly.',
  body = DEFAULT_BODY,
  helplineNumber = '1-800-GAMBLER',
  hideHelpline,
  className,
}) => {
  return (
    <aside className={cx(s.note, className)} role="note">
      <span className={s.iconWrap} aria-hidden="true">
        <Icon name="shield" size={26} />
      </span>
      <div className={s.body}>
        <div className={s.title}>
          <span className={s.titleEyebrow}>21+ only</span>
          <span>{title}</span>
        </div>
        <p className={s.text}>{body}</p>
      </div>
      {!hideHelpline && (
        <div className={s.actions}>
          <a
            className={s.helpline}
            href={`tel:${helplineNumber.replace(/[^0-9]/g, '')}`}
            aria-label={`Call the gambling helpline at ${helplineNumber}`}
          >
            <Icon name="message" size={14} />
            {helplineNumber}
          </a>
        </div>
      )}
    </aside>
  );
};
