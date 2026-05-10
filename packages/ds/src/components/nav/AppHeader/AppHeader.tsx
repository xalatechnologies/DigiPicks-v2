import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Logo } from '../../atoms/Logo/Logo';
import { Kbd } from '../../atoms/Kbd/Kbd';
import { ThemeIconButton } from '../ThemeIconButton/ThemeIconButton';
import s from './AppHeader.module.css';

export interface AppHeaderProps {
  userName?: string;
  userMail?: string;
  userMonogram?: string;
  onSearch?: (q: string) => void;
  onUserClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  userMail,
  userMonogram = 'A',
  onSearch,
  onUserClick,
  actions,
  className,
}) => {
  const [query, setQuery] = React.useState('');
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) onSearch(query);
  };

  return (
    <header className={cx(s.header, className)}>
      <div className={s.brand}>
        <Logo size={36} />
        <div className={s.brandText}>
          <span className={s.brandName}>DIGIPICKS</span>
          <span className={s.brandSub}>Creator Network</span>
        </div>
      </div>

      <div className={s.searchWrap}>
        <div className={s.search}>
          <Icon name="search" size={16} className={s.searchIcon} />
          <input
            className={s.searchInput}
            placeholder="Search creators, picks, events…"
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <span className={s.kbdHint}>
            <Kbd>⌘K</Kbd>
          </span>
        </div>
      </div>

      <div className={s.actions} role="region" aria-live="polite">
        {actions}
        <button type="button" className={s.iconBtn} aria-label="Bookmarks">
          <Icon name="bookmark" size={18} />
        </button>
        <button type="button" className={s.iconBtn} aria-label="Help">
          <Icon name="help" size={18} />
        </button>
        <ThemeIconButton />
        <button
          type="button"
          className={s.user}
          onClick={onUserClick}
          aria-label="User menu"
        >
          <span className={s.avatar}>{userMonogram}</span>
          {(userName || userMail) && (
            <span className={s.userText}>
              {userName && <span className={s.userName}>{userName}</span>}
              {userMail && <span className={s.userMail}>{userMail}</span>}
            </span>
          )}
          <Icon name="chevron-down" size={14} className={s.userChev} />
        </button>
      </div>
    </header>
  );
};
