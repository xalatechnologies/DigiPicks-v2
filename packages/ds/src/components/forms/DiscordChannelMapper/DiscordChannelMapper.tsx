import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon, type IconName } from '../../atoms/Icon/Icon';
import { Switch } from '../../atoms/Switch/Switch';
import {
  DiscordSyncDirectionSelector,
  type DiscordSyncDirection,
} from '../DiscordSyncDirectionSelector/DiscordSyncDirectionSelector';
import s from './DiscordChannelMapper.module.css';

export type DiscordChannelType = 'text' | 'announcement' | 'forum' | 'voice' | 'stage';

export interface DiscordChannelMapping {
  id: string;
  name: string;
  type?: DiscordChannelType;
  syncDirection?: DiscordSyncDirection;
  enabled: boolean;
}

export interface DiscordChannelMapperPatch {
  syncDirection?: DiscordSyncDirection;
  enabled?: boolean;
}

export interface DiscordChannelMapperProps {
  channels: DiscordChannelMapping[];
  onChange: (id: string, patch: DiscordChannelMapperPatch) => void;
  disabled?: boolean;
  className?: string;
  /** Empty-state copy when channels.length === 0. */
  emptyLabel?: React.ReactNode;
}

const TYPE_ICON: Record<DiscordChannelType, IconName> = {
  text: 'message',
  announcement: 'megaphone',
  forum: 'feed',
  voice: 'play',
  stage: 'megaphone',
};

/**
 * Editable list of Discord channels. Each row exposes its sync direction
 * (via `DiscordSyncDirectionSelector`) and an enable/disable switch.
 *
 * Pure presentation — host owns the channels array and applies patches.
 */
export function DiscordChannelMapper({
  channels,
  onChange,
  disabled,
  className,
  emptyLabel = 'No channels available — install the DigiPicks bot in your guild and refresh.',
}: DiscordChannelMapperProps) {
  if (channels.length === 0) {
    return (
      <div className={cx(s.empty, className)} role="status">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className={cx(s.list, className)} role="list">
      {channels.map((ch) => (
        <li key={ch.id} className={s.row}>
          <span className={s.icon} aria-hidden="true">
            <Icon name={ch.type ? TYPE_ICON[ch.type] : 'message'} size={14} />
          </span>
          <span className={s.name}>
            <span className={s.hash} aria-hidden="true">
              #
            </span>
            {ch.name}
          </span>
          <DiscordSyncDirectionSelector
            value={ch.syncDirection ?? null}
            onChange={(next) => onChange(ch.id, { syncDirection: next })}
            disabled={disabled || !ch.enabled}
          />
          <Switch
            checked={ch.enabled}
            onChange={(next) => onChange(ch.id, { enabled: next })}
            disabled={disabled}
            aria-label={`Enable ${ch.name}`}
          />
        </li>
      ))}
    </ul>
  );
}
