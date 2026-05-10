import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon, type IconName } from '../../atoms/Icon/Icon';
import s from './DiscordSyncDirectionSelector.module.css';

export type DiscordSyncDirection = 'outbound' | 'inbound' | 'two_way' | null;

export interface DiscordSyncDirectionSelectorProps {
  value: DiscordSyncDirection;
  onChange: (next: DiscordSyncDirection) => void;
  disabled?: boolean;
  className?: string;
  /** Optional aria-label for the group. */
  ariaLabel?: string;
}

interface Option {
  value: Exclude<DiscordSyncDirection, null>;
  label: string;
  icon: IconName;
}

const OPTIONS: Option[] = [
  { value: 'outbound', label: 'Out', icon: 'arrow-up' },
  { value: 'inbound', label: 'In', icon: 'arrow-down' },
  { value: 'two_way', label: 'Both', icon: 'sort' },
];

/**
 * Three-way toggle for a Discord channel's sync direction. Mirrors the
 * `Segmented` visual language but renders an icon + label per slot, and
 * adds an explicit "off" affordance via the null value.
 */
export function DiscordSyncDirectionSelector({
  value,
  onChange,
  disabled,
  className,
  ariaLabel = 'Sync direction',
}: DiscordSyncDirectionSelectorProps) {
  return (
    <div
      className={cx(s.toggle, disabled && s.disabled, className)}
      role="group"
      aria-label={ariaLabel}
    >
      {OPTIONS.map((opt) => {
        const on = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={cx(s.btn, on && s.on)}
            onClick={() => {
              if (disabled) return;
              onChange(on ? null : opt.value);
            }}
            aria-pressed={on}
            disabled={disabled}
          >
            <Icon name={opt.icon} size={12} />
            <span className={s.label}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
