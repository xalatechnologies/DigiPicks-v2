import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { ThemeIconButton } from '../ThemeIconButton/ThemeIconButton';
import s from './StudioTopBar.module.css';

export interface StudioTopBarProps {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  userMenu?: React.ReactNode;
  className?: string;
}

export function StudioTopBar({
  searchPlaceholder = 'Search analytics or subscribers…',
  onSearch,
  userMenu,
  className,
}: StudioTopBarProps) {
  const [query, setQuery] = React.useState('');

  return (
    <header className={cx(s.bar, className)}>
      <div className={s.brandSlot}>
        <span className={s.wordmark}>DigiPicks</span>
      </div>
      <div className={s.searchWrap}>
        <Icon name="search" size={16} className={s.searchIcon} />
        <input
          className={s.search}
          type="search"
          placeholder={searchPlaceholder}
          aria-label="Search studio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearch) onSearch(query);
          }}
        />
      </div>
      <div className={s.actions}>
        <button type="button" className={s.iconBtn} aria-label="Notifications">
          <Icon name="bell" size={18} />
          <span className={s.dot} aria-hidden />
        </button>
        <button type="button" className={s.iconBtn} aria-label="Help">
          <Icon name="help" size={18} />
        </button>
        <ThemeIconButton />
        {userMenu}
      </div>
    </header>
  );
}
