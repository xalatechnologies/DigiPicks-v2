import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import {
  StudioFilterPills,
  type StudioFilterPillOption,
} from '../../surfaces/StudioFilterPills/StudioFilterPills';
import s from './EventsDirectoryHero.module.css';

export interface EventsDirectoryHeroProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  filterOptions: StudioFilterPillOption[];
  filterValue: string;
  onFilterChange: (value: string) => void;
  secondaryFilters?: React.ReactNode;
  className?: string;
}

export function EventsDirectoryHero({
  eyebrow = 'Live sports coverage',
  title = "Today's events",
  subtitle = 'Browse the biggest games happening today and see which creators are covering them. Get expert insights before the whistle blows.',
  bullets = ['Live events', 'Creator coverage', 'Premium picks', 'Daily updates'],
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search teams, leagues, or events',
  filterOptions,
  filterValue,
  onFilterChange,
  secondaryFilters,
  className,
}: EventsDirectoryHeroProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearchSubmit?.();
  }

  return (
    <section className={cx(s.wrap, className)}>
      <div className={s.head}>
        <div className={s.copy}>
          {eyebrow ? <span className={s.eyebrow}>{eyebrow}</span> : null}
          <h1 className={s.title}>{title}</h1>
          <p className={s.sub}>{subtitle}</p>
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
      </div>

      <form className={s.searchRow} onSubmit={handleSubmit}>
        <div className={s.searchField}>
          <Icon name="search" size={20} className={s.searchIcon} />
          <input
            type="search"
            className={s.searchInput}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={searchPlaceholder}
          />
        </div>
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      <div className={s.filters}>
        <div className={s.filterRow}>
          <StudioFilterPills
            options={filterOptions}
            value={filterValue}
            onChange={onFilterChange}
            ariaLabel="Filter events"
            nowrap
          />
          {secondaryFilters ? <div className={s.secondaryFilters}>{secondaryFilters}</div> : null}
        </div>
      </div>
    </section>
  );
}
