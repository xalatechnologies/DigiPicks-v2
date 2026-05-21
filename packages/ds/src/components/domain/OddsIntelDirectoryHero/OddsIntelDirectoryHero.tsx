import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import s from './OddsIntelDirectoryHero.module.css';

export interface OddsIntelDirectoryHeroProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  headAside?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  className?: string;
}

export function OddsIntelDirectoryHero({
  eyebrow = 'Odds intelligence',
  title = 'Compare the books.',
  subtitle = 'Live moneyline, spread, and totals across major sportsbooks. Best price per row is highlighted; line movement is plotted from captured snapshot history.',
  bullets = ['Multi-book lines', 'Line movement', 'Best price', 'Live snapshots'],
  headAside,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search teams, leagues, or matchups',
  filters,
  className,
}: OddsIntelDirectoryHeroProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearchSubmit?.();
  }

  const showSearch = onSearchChange != null;

  return (
    <section className={cx(s.wrap, className)} aria-labelledby="odds-intel-directory-title">
      <div className={s.head}>
        <div className={s.copy}>
          {eyebrow ? <span className={s.eyebrow}>{eyebrow}</span> : null}
          <h1 id="odds-intel-directory-title" className={s.title}>
            {title}
          </h1>
          <p className={s.sub}>{subtitle}</p>
        </div>
        {headAside ? <div className={s.headAside}>{headAside}</div> : null}
      </div>

      {bullets.length > 0 ? (
        <ul className={s.bullets}>
          {bullets.map((item) => (
            <li key={item} className={s.bullet}>
              <span className={s.bulletDot} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      {showSearch || filters ? (
        <div className={s.controls}>
          {showSearch ? (
            <form className={s.searchRow} onSubmit={handleSubmit}>
              <div className={s.searchField}>
                <Icon name="search" size={20} className={s.searchIcon} />
                <input
                  type="search"
                  className={s.searchInput}
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  aria-label={searchPlaceholder}
                />
              </div>
              <Button type="submit" variant="primary">
                Search
              </Button>
            </form>
          ) : null}
          {filters ? <div className={s.filters}>{filters}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
