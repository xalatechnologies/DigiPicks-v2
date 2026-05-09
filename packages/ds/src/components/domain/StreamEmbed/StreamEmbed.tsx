import React from 'react';
import { cx } from '../../../utils/cx';
import { Badge } from '../../atoms/Badge/Badge';
import { Icon } from '../../atoms/Icon/Icon';
import s from './StreamEmbed.module.css';

export type StreamPlatform = 'twitch' | 'youtube' | 'kick';

export interface StreamEmbedProps {
  platform: StreamPlatform;
  /** Channel/handle. For YouTube, can be a channel ID (UC…) or @handle. */
  handle: string;
  /** Optional override for the parent domain Twitch requires. */
  twitchParent?: string;
  className?: string;
}

function buildSrc(
  platform: StreamPlatform,
  handle: string,
  twitchParent: string,
): string {
  const clean = handle.replace(/^@+/, '').trim();
  switch (platform) {
    case 'twitch':
      return `https://player.twitch.tv/?channel=${encodeURIComponent(clean)}&parent=${encodeURIComponent(twitchParent)}&muted=true`;
    case 'youtube':
      // YouTube live takes a channel ID. If the user passed a UC… ID, embed
      // their live; otherwise fall back to channel @handle URL via search.
      if (/^UC[A-Za-z0-9_-]{20,}$/.test(clean)) {
        return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(clean)}`;
      }
      return `https://www.youtube.com/embed/?listType=user_uploads&list=${encodeURIComponent(clean)}`;
    case 'kick':
      return `https://player.kick.com/${encodeURIComponent(clean)}?autoplay=false&muted=true`;
    default:
      return '';
  }
}

const PLATFORM_LABEL: Record<StreamPlatform, string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  kick: 'Kick',
};

export const StreamEmbed: React.FC<StreamEmbedProps> = ({
  platform,
  handle,
  twitchParent,
  className,
}) => {
  // Default to current host so Twitch's parent restriction passes when the
  // page is served from the same origin embedding the player.
  const parent =
    twitchParent ??
    (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const src = buildSrc(platform, handle, parent);

  return (
    <div className={cx(s.wrap, className)}>
      <div className={s.head}>
        <Badge tone="violet" icon={<Icon name="play" size={11} />}>
          {PLATFORM_LABEL[platform]} stream
        </Badge>
        <span className={s.handle}>@{handle.replace(/^@+/, '')}</span>
      </div>
      <div className={s.frame}>
        <iframe
          className={s.iframe}
          src={src}
          title={`${PLATFORM_LABEL[platform]} stream — ${handle}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};
