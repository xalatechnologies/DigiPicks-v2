import React from 'react';
import { cx } from '../../../utils/cx';
import { Search } from '../../forms/Search/Search';
import s from './OddsIntelHero.module.css';

export interface OddsIntelHeroStat {
  label: string;
  value: React.ReactNode;
}

export interface OddsIntelHeroProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  stats?: OddsIntelHeroStat[];
  actions?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  className?: string;
}

export function OddsIntelHero({
  eyebrow = 'Odds intelligence',
  title = 'Compare the books.',
  subtitle = 'Live moneyline, spread, and totals across major sportsbooks. Best price per row is highlighted; line movement is plotted from captured snapshot history.',
  stats,
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search teams or leagues',
  filters,
  className,
}: OddsIntelHeroProps) {
  return (
    <section className={cx(s.wrap, className)} aria-labelledby="odds-intel-title">
      <div className={s.head}>
        <div className={s.copy}>
          {eyebrow ? <span className={s.eyebrow}>{eyebrow}</span> : null}
          <h1 id="odds-intel-title" className={s.title}>
            {title}
          </h1>
          {subtitle ? <p className={s.sub}>{subtitle}</p> : null}
        </div>
        {stats && stats.length > 0 ? (
          <div className={s.stats} aria-label="Odds board summary">
            {stats.map((item) => (
              <div key={item.label} className={s.stat}>
                <span className={s.statLabel}>{item.label}</span>
                <span className={s.statValue}>{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
        {actions ? <div className={s.actions}>{actions}</div> : null}
      </div>

      {onSearchChange || filters ? (
        <div className={s.toolbar}>
          {onSearchChange ? (
            <div className={s.searchRow}>
              <Search
                className={s.searchField}
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </div>
          ) : null}
          {filters ? <div className={s.filters}>{filters}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
