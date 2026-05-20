import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import s from './AccountNotificationSidebar.module.css';

export interface AccountNotificationChannel {
  id: string;
  label: string;
  icon: 'message' | 'bell' | 'megaphone';
  active: boolean;
  muted?: boolean;
}

export interface AccountNotificationSidebarProps {
  channels: AccountNotificationChannel[];
  engagementPercent?: number;
  engagementBars?: number[];
  onManagePreferences?: () => void;
  className?: string;
}

const CHANNEL_ICON = {
  message: 'message',
  bell: 'bell',
  megaphone: 'megaphone',
} as const;

export function AccountNotificationSidebar({
  channels,
  engagementPercent,
  engagementBars = [48, 64, 80, 56, 40],
  onManagePreferences,
  className,
}: AccountNotificationSidebarProps) {
  const maxBar = Math.max(...engagementBars, 1);

  return (
    <aside className={cx(s.wrap, className)} aria-label="Notification settings">
      <article className={s.controls}>
        <span className={s.iconHead} aria-hidden="true">
          <Icon name="sliders" size={22} />
        </span>
        <h4 className={s.title}>Alert controls</h4>
        <p className={s.sub}>Customize how and where you receive expert updates.</p>

        <div className={s.channels}>
          {channels.map((ch) => (
            <div key={ch.id} className={cx(s.channel, ch.muted && s.channelMuted)}>
              <div className={s.channelLeft}>
                <Icon name={CHANNEL_ICON[ch.icon]} size={16} />
                <span className={s.channelLabel}>{ch.label}</span>
              </div>
              <span className={cx(s.channelStatus, ch.active ? s.channelOn : s.channelOff)}>
                {ch.active ? 'Active' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>

        {onManagePreferences ? (
          <Button variant="outline" block onClick={onManagePreferences}>
            Manage preferences
          </Button>
        ) : null}
      </article>

      {engagementPercent != null ? (
        <article className={s.engagement}>
          <h5 className={s.engagementTitle}>Weekly engagement</h5>
          <div className={s.bars} aria-hidden="true">
            {engagementBars.map((h, i) => (
              <span
                key={i}
                className={cx(s.bar, h === maxBar && s.barStrong)}
                style={
                  {
                    '--bar-fill': `${Math.max(12, (h / maxBar) * 100)}%`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          <p className={s.engagementCopy}>
            You&apos;ve acted on {engagementPercent}% of your high-value notifications this week.
          </p>
        </article>
      ) : null}
    </aside>
  );
}
