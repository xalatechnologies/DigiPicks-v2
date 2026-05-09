import React from 'react';
import { cx } from '../../../utils/cx';
import { Mono } from '../../layout/Mono/Mono';
import { Muted } from '../../layout/Muted/Muted';
import s from './OddsGrid.module.css';

export interface OddsBook {
  key: string;
  title: string;
}

export interface OddsCell {
  /** Decimal odds (The Odds API native format). */
  price: number;
  /** Optional spread/total line, e.g. -3.5 or 47.5. */
  point?: number;
}

export interface OddsRow {
  /** Display label, e.g. "Moneyline · Lakers" or "Over 47.5". */
  label: string;
  /** Market key, e.g. "h2h" / "spreads" / "totals" — used as React key. */
  market: string;
  /** Outcome key, e.g. team name or "Over"/"Under" — used as React key. */
  side: string;
  /** Map of book key → cell, omitted for books that don't price this row. */
  cells: Record<string, OddsCell | undefined>;
}

export interface OddsGridProps {
  books: OddsBook[];
  rows: OddsRow[];
  /** Highlight the best (highest decimal odds) cell on each row. */
  highlightBest?: boolean;
  className?: string;
}

function formatDecimal(price: number): string {
  return price.toFixed(2);
}

function formatPoint(point: number | undefined): string {
  if (point === undefined) return '';
  return point > 0 ? `+${point}` : `${point}`;
}

function bestPriceBookKey(row: OddsRow): string | null {
  let bestKey: string | null = null;
  let bestPrice = -Infinity;
  for (const [key, cell] of Object.entries(row.cells)) {
    if (!cell) continue;
    if (cell.price > bestPrice) {
      bestPrice = cell.price;
      bestKey = key;
    }
  }
  return bestKey;
}

export function OddsGrid({
  books,
  rows,
  highlightBest = true,
  className,
}: OddsGridProps) {
  if (rows.length === 0) {
    return (
      <div className={cx(s.empty, className)}>
        <Muted>No odds yet for this event.</Muted>
      </div>
    );
  }

  return (
    <div className={cx(s.wrap, className)}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={s.cornerHead}>Market</th>
            {books.map((b) => (
              <th key={b.key} className={s.bookHead}>
                {b.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const bestKey = highlightBest ? bestPriceBookKey(row) : null;
            return (
              <tr key={`${row.market}-${row.side}-${row.label}`}>
                <td className={s.rowLabel}>{row.label}</td>
                {books.map((b) => {
                  const cell = row.cells[b.key];
                  if (!cell) {
                    return (
                      <td key={b.key} className={s.cell}>
                        <Muted>—</Muted>
                      </td>
                    );
                  }
                  const isBest = bestKey === b.key;
                  return (
                    <td
                      key={b.key}
                      className={cx(s.cell, isBest && s.cellBest)}
                    >
                      <Mono>{formatDecimal(cell.price)}</Mono>
                      {cell.point !== undefined && (
                        <span className={s.point}>{formatPoint(cell.point)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
