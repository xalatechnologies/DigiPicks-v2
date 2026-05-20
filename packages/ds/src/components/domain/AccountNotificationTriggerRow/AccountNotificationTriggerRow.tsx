import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Switch } from '../../atoms/Switch/Switch';
import s from './AccountNotificationTriggerRow.module.css';

export interface AccountNotificationTriggerRowProps {
  label: string;
  sub?: string;
  checked: boolean;
  onChange?: (next: boolean) => void;
  emailActive?: boolean;
  pushActive?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AccountNotificationTriggerRow({
  label,
  sub,
  checked,
  onChange,
  emailActive,
  pushActive,
  disabled,
  className,
}: AccountNotificationTriggerRowProps) {
  return (
    <div className={cx(s.row, className)}>
      <div className={s.copy}>
        <p className={s.label}>{label}</p>
        {sub ? <p className={s.sub}>{sub}</p> : null}
      </div>
      <div className={s.channels}>
        <Icon
          name="message"
          size={20}
          className={cx(s.channel, emailActive && s.channelOn)}
          aria-hidden="true"
        />
        <Icon
          name="megaphone"
          size={20}
          className={cx(s.channel, pushActive && s.channelOn)}
          aria-hidden="true"
        />
        <Switch
          checked={checked}
          onChange={(next) => onChange?.(next)}
          disabled={disabled}
          aria-label={label}
        />
      </div>
    </div>
  );
}
