import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import {
  StudioFilterPills,
  type StudioFilterPillOption,
} from '../../surfaces/StudioFilterPills/StudioFilterPills';
import s from './CreatorsDirectoryHero.module.css';

export interface CreatorsDirectoryHeroProps {
  title?: string;
  subtitle?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  sortOptions: StudioFilterPillOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  secondaryFilters?: React.ReactNode;
  className?: string;
}

export function CreatorsDirectoryHero({
  title = 'Find your edge.',
  subtitle = 'Follow elite analysts, track performance in real-time, and get curated picks from verified creators.',
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search creators, sports, or picks',
  sortOptions,
  sortValue,
  onSortChange,
  secondaryFilters,
  className,
}: CreatorsDirectoryHeroProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearchSubmit?.();
  }

  return (
    <section className={cx(s.wrap, className)}>
      <div className={s.copy}>
        <h1 className={s.title}>{title}</h1>
        <p className={s.sub}>{subtitle}</p>
      </div>

      <div className={s.controls}>
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

        <div className={s.filterRow}>
          <StudioFilterPills
            options={sortOptions}
            value={sortValue}
            onChange={onSortChange}
            ariaLabel="Sort creators"
            nowrap
          />
          {secondaryFilters ? <div className={s.secondaryFilters}>{secondaryFilters}</div> : null}
        </div>
      </div>
    </section>
  );
}
