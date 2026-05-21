import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './LandingLiveChapter.module.css';

export interface LandingLiveChapterProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  /** When true, shows a pulsing live indicator beside the eyebrow. */
  live?: boolean;
  headerAction?: React.ReactNode;
  /** Label above the trending rail (left column). */
  trendingLabel?: string;
  trendingSub?: string;
  trending: React.ReactNode;
  featuredLabel?: string;
  featured: React.ReactNode;
  /** Shown in the featured panel while event data loads. */
  featuredLoading?: boolean;
  /** Shown when `featured` is empty and not loading. */
  featuredEmpty?: React.ReactNode;
  featuredAction?: React.ReactNode;
  tone?: 'default' | 'elevated';
  className?: string;
}

/** Asymmetric live-network chapter: trending rail + featured event. */
export function LandingLiveChapter({
  eyebrow,
  title,
  sub,
  live,
  headerAction,
  trendingLabel = 'Trending picks',
  trendingSub,
  trending,
  featuredLabel = "Tonight's marquee",
  featured,
  featuredLoading,
  featuredEmpty,
  featuredAction,
  tone = 'default',
  className,
}: LandingLiveChapterProps) {
  const showFeaturedEmpty = !featuredLoading && !featured;

  return (
    <section
      className={cx(s.chapter, tone === 'elevated' && s.elevated, className)}
      aria-labelledby="landing-live-title"
    >
      <div className={s.inner}>
        <header className={s.head}>
          <div className={s.headText}>
            {eyebrow || live ? (
              <div className={s.eyebrowRow}>
                {eyebrow ? <span className={s.eyebrow}>{eyebrow}</span> : null}
                {live ? (
                  <span className={s.liveBadge}>
                    <span className={s.liveDot} aria-hidden />
                    Live
                  </span>
                ) : null}
              </div>
            ) : null}
            <h2 id="landing-live-title" className={s.title}>
              {title}
            </h2>
            {sub ? <p className={s.sub}>{sub}</p> : null}
          </div>
          {headerAction ? <div className={s.headAction}>{headerAction}</div> : null}
        </header>

        <div className={s.layout}>
          <div className={s.trendingCol}>
            <div className={s.trendingHead}>
              <div className={s.trendingHeadLeft}>
                <Icon name="flame" size={16} className={s.trendingIcon} />
                <span className={s.trendingTitle}>{trendingLabel}</span>
              </div>
              {trendingSub ? <span className={s.trendingSub}>{trendingSub}</span> : null}
            </div>
            <div className={s.trendingBody}>{trending}</div>
          </div>

          <aside className={s.featuredCol} aria-label={featuredLabel}>
            <div className={s.featuredPanel}>
              <span className={s.featuredLabel}>{featuredLabel}</span>
              {featuredLoading ? (
                <div
                  className={s.featuredSkeleton}
                  aria-busy="true"
                  aria-label="Loading marquee event"
                />
              ) : showFeaturedEmpty ? (
                <div className={s.featuredEmpty}>
                  {featuredEmpty ?? (
                    <>
                      <div className={s.featuredEmptyIcon}>
                        <Icon name="calendar" size={22} />
                      </div>
                      <p className={s.featuredEmptyTitle}>No marquee on the board yet</p>
                      <p className={s.featuredEmptySub}>
                        Events populate closer to kickoff. Browse the full slate for upcoming
                        matchups.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className={s.featuredCard}>{featured}</div>
              )}
              {featuredAction ? <div className={s.featuredFoot}>{featuredAction}</div> : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
