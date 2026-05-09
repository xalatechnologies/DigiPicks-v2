import React from 'react';
import { cx } from '../../../utils/cx';
import { Sparkline } from '../../atoms/Sparkline/Sparkline';
import { Bar, type BarTone } from '../../atoms/Bar/Bar';
import s from './PortfolioHero.module.css';

export type PortfolioHeroState = 'profit' | 'loss' | 'breakeven' | 'empty';

export interface PortfolioHeroKpi {
  label: string;
  value: React.ReactNode;
  /** Tints the value: profit (green) / loss (red) / streak (gold). */
  tone?: 'green' | 'red' | 'gold' | 'neutral';
}

export interface PortfolioHeroProps {
  /** Eyebrow above the title — e.g. "PORTFOLIO · PERSONALIZED". */
  eyebrow?: React.ReactNode;
  /** Headline — usually a personalized greeting. */
  title: React.ReactNode;
  /** Optional one-line caption under the title. */
  sub?: React.ReactNode;
  /** Win-rate value 0–100. When undefined the gauge is hidden. */
  winRate?: number;
  /** Win-rate caption shown to the right of the bar (e.g. "Profitable"). */
  winRateLabel?: string;
  /** Up to 4 KPIs rendered as an inline strip beneath the gauge. */
  kpis?: PortfolioHeroKpi[];
  /** Sparkline data (running net units, etc.). */
  spark?: number[];
  /** Right-side action slot (buttons, links). */
  actions?: React.ReactNode;
  /** Empty/zero state — collapses gauge, shows muted copy. */
  empty?: boolean;
  /** Empty-state title / subtitle / call to action. */
  emptyTitle?: React.ReactNode;
  emptySub?: React.ReactNode;
  emptyAction?: React.ReactNode;
  className?: string;
}

function gaugeTone(value: number): BarTone {
  if (value >= 60) return 'green';
  if (value >= 50) return 'primary';
  if (value >= 40) return 'amber';
  return 'red';
}

/**
 * Featured portfolio summary — the centrepiece of /account.
 * Big serif headline, ambient gradient, optional win-rate gauge, KPI
 * strip, sparkline, and a right-side action slot. Falls back to a
 * muted empty state when the user has no graded picks yet.
 */
export function PortfolioHero({
  eyebrow,
  title,
  sub,
  winRate,
  winRateLabel,
  kpis = [],
  spark,
  actions,
  empty,
  emptyTitle,
  emptySub,
  emptyAction,
  className,
}: PortfolioHeroProps) {
  const showGauge = !empty && typeof winRate === 'number';
  const tone = showGauge ? gaugeTone(winRate!) : 'primary';

  return (
    <section className={cx(s.hero, empty && s.empty, className)} aria-label="Portfolio summary">
      <div className={s.aurora} aria-hidden="true" />
      <div className={s.grain} aria-hidden="true" />

      <div className={s.head}>
        <div className={s.text}>
          {eyebrow && <div className={s.eyebrow}>{eyebrow}</div>}
          <h1 className={s.title}>{title}</h1>
          {sub && <p className={s.sub}>{sub}</p>}
        </div>
        {actions && <div className={s.actions}>{actions}</div>}
      </div>

      {empty ? (
        <div className={s.emptyState}>
          {emptyTitle && <div className={s.emptyTitle}>{emptyTitle}</div>}
          {emptySub && <div className={s.emptySub}>{emptySub}</div>}
          {emptyAction && <div className={s.emptyAction}>{emptyAction}</div>}
        </div>
      ) : (
        <div className={s.body}>
          {showGauge && (
            <div className={s.gauge}>
              <div className={s.gaugeHead}>
                <span className={s.gaugeLabel}>Win rate</span>
                <div className={s.gaugeReadout}>
                  <span className={s.gaugeValue}>{Math.round(winRate!)}</span>
                  <span className={s.gaugeUnit}>%</span>
                </div>
                {winRateLabel && (
                  <span className={cx(s.gaugeChip, s[`chip_${tone}`])}>{winRateLabel}</span>
                )}
              </div>
              <Bar value={Math.max(0, Math.min(100, winRate!))} tone={tone} size="md" />
            </div>
          )}

          {kpis.length > 0 && (
            <div className={s.kpiStrip}>
              {kpis.map((kpi, i) => (
                <div className={s.kpi} key={`${kpi.label}-${i}`}>
                  <div className={s.kpiLabel}>{kpi.label}</div>
                  <div className={cx(s.kpiValue, kpi.tone && s[`v_${kpi.tone}`])}>
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {spark && spark.length > 1 && (
            <div className={s.spark}>
              <Sparkline values={spark} width={520} height={44} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
