import React from 'react';

export type IconName =
  | 'home'
  | 'search'
  | 'compass'
  | 'feed'
  | 'bookmark'
  | 'chart'
  | 'card'
  | 'bell'
  | 'help'
  | 'gear'
  | 'user'
  | 'users'
  | 'plus'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'sun'
  | 'moon'
  | 'check'
  | 'x'
  | 'arrow-up'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-down'
  | 'lock'
  | 'shield'
  | 'verified'
  | 'flame'
  | 'dollar'
  | 'sparkles'
  | 'tag'
  | 'message'
  | 'link'
  | 'gift'
  | 'megaphone'
  | 'key'
  | 'inbox'
  | 'flag'
  | 'eye'
  | 'play'
  | 'edit'
  | 'trash'
  | 'filter'
  | 'more'
  | 'calendar'
  | 'clock'
  | 'trophy'
  | 'audit'
  | 'soccer'
  | 'cricket'
  | 'tennis'
  | 'football'
  | 'basketball'
  | 'baseball'
  | 'hockey'
  | 'ufc'
  | 'racing'
  | 'volleyball'
  | 'golf'
  | 'rugby'
  | 'sliders'
  | 'list'
  | 'grid'
  | 'sort'
  | 'discord';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
  name: IconName | (string & {});
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 16, ...rest }) => {
  const s = size;
  const sw = 1.5;
  const common: React.SVGProps<SVGSVGElement> = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: sw,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5L13 13l-4.5 2.5L11 11z" />
        </svg>
      );
    case 'feed':
      return (
        <svg {...common}>
          <path d="M3 5h18M3 12h18M3 19h12" />
        </svg>
      );
    case 'bookmark':
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-6-4-6 4V3z" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M3 20h18" />
          <path d="M6 16V9" />
          <path d="M11 16V5" />
          <path d="M16 16v-7" />
          <path d="M21 16v-4" />
        </svg>
      );
    case 'card':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9z" />
          <path d="M10 21a2 2 0 004 0" />
        </svg>
      );
    case 'help':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'gear':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0116 0" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21a7 7 0 0114 0" />
          <path d="M16 4a4 4 0 010 8M22 21a7 7 0 00-6-7" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'chevron-right':
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case 'chevron-left':
      return (
        <svg {...common}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12l5 5L20 6" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'arrow-up':
      return (
        <svg {...common}>
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...common}>
          <path d="M19 12H5M11 5l-7 7 7 7" />
        </svg>
      );
    case 'arrow-down':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4z" />
        </svg>
      );
    case 'verified':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
          <path d="M12 1.5l2.6 1.9 3.2-.4 1.4 2.9 2.9 1.5-.4 3.2 1.9 2.6-1.9 2.6.4 3.2-2.9 1.5-1.4 2.9-3.2-.4L12 22.5l-2.6-1.9-3.2.4-1.4-2.9-2.9-1.5.4-3.2L.4 10.8l1.9-2.6-.4-3.2 2.9-1.5 1.4-2.9 3.2.4L12 1.5z" />
          {/* The inner check sits on top of the brand-blue verified shield;
              it must always be near-black for contrast regardless of theme. */}
          <path
            d="M8 12l3 3 5-6"
            stroke="#08090B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    case 'flame':
      return (
        <svg {...common}>
          <path d="M12 2c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 1-5 2 1 3 0 4-5z" />
        </svg>
      );
    case 'dollar':
      return (
        <svg {...common}>
          <path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...common}>
          <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
          <path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17z" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...common}>
          <path d="M3 13V5a2 2 0 012-2h8l8 8-10 10-8-8z" />
          <circle cx="8" cy="8" r="1.5" />
        </svg>
      );
    case 'message':
      return (
        <svg {...common}>
          <path d="M21 11a8 8 0 11-3-6.2L21 4l-1 4a8 8 0 011 3z" />
        </svg>
      );
    case 'link':
      return (
        <svg {...common}>
          <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" />
          <path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
        </svg>
      );
    case 'gift':
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="13" rx="1" />
          <path d="M3 12h18M12 8v13M12 8c-2-3-6-3-6 0s4 0 6 0zM12 8c2-3 6-3 6 0s-4 0-6 0z" />
        </svg>
      );
    case 'megaphone':
      return (
        <svg {...common}>
          <path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z" />
          <path d="M16 8a5 5 0 010 8M19 5a8 8 0 010 14" />
        </svg>
      );
    case 'key':
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="M11 12l9-9M16 7l3 3" />
        </svg>
      );
    case 'inbox':
      return (
        <svg {...common}>
          <path d="M3 13l3-8h12l3 8" />
          <path d="M3 13v6a1 1 0 001 1h16a1 1 0 001-1v-6" />
          <path d="M3 13h5l1 2h6l1-2h5" />
        </svg>
      );
    case 'flag':
      return (
        <svg {...common}>
          <path d="M5 21V4M5 4h12l-2 4 2 4H5" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'play':
      return (
        <svg {...common}>
          <path d="M6 4l14 8-14 8V4z" fill="currentColor" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9M16.5 3.5a2 2 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...common}>
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
      );
    case 'more':
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...common}>
          <path d="M8 21h8M12 17v4M5 4h14v4a5 5 0 01-5 5h-4a5 5 0 01-5-5V4z" />
          <path d="M5 6H3v3a3 3 0 003 3M19 6h2v3a3 3 0 01-3 3" />
        </svg>
      );
    case 'audit':
      return (
        <svg {...common}>
          <path d="M9 4h6l4 4v12a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1h3z" />
          <path d="M14 4v4h4M9 13h6M9 17h4" />
        </svg>
      );
    case 'soccer':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3l2.5 4.5h5L17 12l2.5 4.5h-5L12 21l-2.5-4.5h-5L7 12l-2.5-4.5h5z" />
        </svg>
      );
    case 'cricket':
      return (
        <svg {...common}>
          <path d="M5 19l7-7M14 10l5 5" />
          <circle cx="17.5" cy="6.5" r="2.5" />
          <path d="M3 21l2-2" />
        </svg>
      );
    case 'tennis':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M5 4c2 4 2 12 0 16" />
          <path d="M19 4c-2 4-2 12 0 16" />
          <path d="M3 12h18" />
        </svg>
      );
    case 'football':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-30 12 12)" />
          <path d="M9 9l6 6M9 12h6M11 7v10" />
        </svg>
      );
    case 'basketball':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3v18" />
          <path d="M5 5c4 3 10 9 14 14M19 5c-4 3-10 9-14 14" />
        </svg>
      );
    case 'baseball':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M5 8c2 1 4 2 7 2s5-1 7-2M5 16c2-1 4-2 7-2s5 1 7 2" />
        </svg>
      );
    case 'hockey':
      return (
        <svg {...common}>
          <ellipse cx="6" cy="18" rx="3.5" ry="1.5" />
          <path d="M9 17l8-12 3 1-9 12" />
        </svg>
      );
    case 'ufc':
      return (
        <svg {...common}>
          <path d="M7 9V6a2 2 0 014 0v4" />
          <path d="M11 9V5a2 2 0 014 0v5" />
          <path d="M15 9V7a2 2 0 014 0v6c0 4-3 7-7 7H9c-3 0-5-2-5-5v-3a2 2 0 014 0v1" />
        </svg>
      );
    case 'racing':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      );
    case 'volleyball':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3c4 5 4 13 0 18M3 12c5-4 13-4 18 0M5 5c4 5 14 5 14 14" />
        </svg>
      );
    case 'golf':
      return (
        <svg {...common}>
          <path d="M12 3v15M12 5l6 2-6 2" />
          <path d="M9 19h6M8 21h8" />
        </svg>
      );
    case 'rugby':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(45 12 12)" />
          <path d="M9 9l6 6M9 15l6-6" />
        </svg>
      );
    case 'sliders':
      return (
        <svg {...common}>
          <path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h12M20 17h0" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="18" cy="17" r="2" />
        </svg>
      );
    case 'list':
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'sort':
      return (
        <svg {...common}>
          <path d="M7 4v16M3 8l4-4 4 4" />
          <path d="M17 20V4M21 16l-4 4-4-4" />
        </svg>
      );
    case 'discord':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
          <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 00-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 00-4.8 0c-.14-.34-.36-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.01.06.02.09.01 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" />
        </svg>
      );
    default:
      return <svg {...common} />;
  }
};
