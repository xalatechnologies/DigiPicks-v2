import React from 'react';
import { cx } from '../../../utils/cx';
import lift from '../../../utils/lightMarketingSurface.module.css';
import { Icon } from '../../atoms/Icon/Icon';
import s from './TrendingCarousel.module.css';

export interface TrendingItem {
  id: string;
  title: string;
  sub?: string;
  /** Sport tag rendered as a pill. */
  sport?: string;
  /** Trending score rendered top-right. */
  score?: number;
  /** Click handler for the whole tile. */
  onClick?: () => void;
}

export interface TrendingCarouselProps {
  items: TrendingItem[];
  /** Heading rendered above the rail. */
  title?: string;
  sub?: string;
  /** When true, render a shimmery skeleton row. */
  loading?: boolean;
  /** Hide the built-in heading (e.g. when wrapped by LandingLiveChapter). */
  hideHeader?: boolean;
  className?: string;
}

/**
 * Horizontal trending rail for the Landing page. Pure presentation —
 * caller passes an items array sourced from `api.trending.trending`.
 * The list scrolls horizontally on overflow; tile width is content-driven.
 */
export const TrendingCarousel: React.FC<TrendingCarouselProps> = ({
  items,
  title = 'Trending right now',
  sub,
  loading,
  hideHeader,
  className,
}) => {
  return (
    <section className={cx(s.section, className)}>
      {!hideHeader ? (
        <header className={s.head}>
          <div className={s.headLeft}>
            <Icon name="flame" size={16} className={s.headIcon} />
            <h2 className={s.title}>{title}</h2>
            {sub && <span className={s.sub}>{sub}</span>}
          </div>
        </header>
      ) : null}
      <div className={s.rail}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cx(s.tile, s.skeleton)} aria-hidden />
          ))
        ) : items.length === 0 ? (
          <div className={cx(s.empty, lift.surface)} role="status">
            <Icon name="flame" size={18} className={s.emptyIcon} />
            <p className={s.emptyTitle}>No trending picks yet</p>
            <p className={s.emptySub}>Hot picks appear as creators publish and grades roll in.</p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cx(s.tile, lift.surface)}
              onClick={item.onClick}
            >
              {item.sport && <span className={s.sport}>{item.sport}</span>}
              {typeof item.score === 'number' && (
                <span className={s.score}>
                  <Icon name="flame" size={11} />
                  {Math.round(item.score)}
                </span>
              )}
              <span className={s.tileTitle}>{item.title}</span>
              {item.sub && <span className={s.tileSub}>{item.sub}</span>}
            </button>
          ))
        )}
      </div>
    </section>
  );
};
