import React from 'react';
import { cx } from '../../../utils/cx';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import s from './PushNotificationPrompt.module.css';

export type PushPermissionState = 'unsupported' | 'unknown' | 'denied' | 'granted';

export interface PushNotificationPromptProps {
  /** Current permission state — render-controlled by caller. */
  state: PushPermissionState;
  /** Called when the user clicks "Enable" — caller does the registration. */
  onEnable: () => void | Promise<void>;
  /** Called when the user clicks "Disable" — caller unsubscribes. */
  onDisable?: () => void | Promise<void>;
  /** Disable buttons while caller is mid-flight. */
  busy?: boolean;
  className?: string;
}

/**
 * Inline push-permission prompt. The component is purely presentational —
 * the actual `Notification.requestPermission()` + service-worker register
 * + Convex subscribe call happen in the consuming page (so VAPID key
 * fetching, error handling, and side-effects stay testable).
 */
export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
  state,
  onEnable,
  onDisable,
  busy,
  className,
}) => {
  if (state === 'unsupported') {
    return (
      <div className={cx(s.banner, s.muted, className)}>
        <Icon name="bell" size={16} />
        <span>This browser doesn't support push notifications.</span>
      </div>
    );
  }

  if (state === 'granted') {
    return (
      <div className={cx(s.banner, s.granted, className)}>
        <Icon name="check" size={16} />
        <span>Push notifications are enabled on this device.</span>
        {onDisable && (
          <Button variant="ghost" size="sm" onClick={onDisable} disabled={busy}>
            Turn off
          </Button>
        )}
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className={cx(s.banner, s.warning, className)}>
        <Icon name="bell" size={16} />
        <span>
          Push is blocked for this site. Enable notifications in your browser
          settings, then refresh.
        </span>
      </div>
    );
  }

  return (
    <div className={cx(s.banner, className)}>
      <Icon name="bell" size={16} />
      <span>Get notified the moment a creator posts a pick.</span>
      <Button variant="primary" size="sm" onClick={onEnable} disabled={busy}>
        {busy ? 'Enabling…' : 'Enable push'}
      </Button>
    </div>
  );
};
