import React from 'react';
import { cx } from '../../../utils/cx';
import { Divider } from '../../layout/Divider/Divider';
import s from './RowList.module.css';

export interface RowListProps<T> {
  /** Items to render. */
  items: ReadonlyArray<T>;
  /** Render function for one item. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Stable key per item. Defaults to index — provide for non-trivial lists. */
  getKey?: (item: T, index: number) => React.Key;
  /** Hide the inter-row dividers. */
  noDivider?: boolean;
  /** Vertical gap between rows when dividers are off. Defaults to 0 (rows hug). */
  gap?: 0 | 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Render a divider-separated list of rows. Replaces the
 * `<Stack gap={0}>{items.map((it, i) => <Fragment><Divider/><Row/></Fragment>)}</Stack>`
 * idiom that appears throughout the app.
 *
 * Pair with PersonRow / SwitchRow / SubscriptionTile / any custom row.
 *
 * @example
 *   <RowList
 *     items={subs}
 *     getKey={(s) => s._id}
 *     renderItem={(sub) => (
 *       <PersonRow name={sub.creatorName} sub={sub.plan} mono={sub.mono} />
 *     )}
 *   />
 */
export function RowList<T>({
  items,
  renderItem,
  getKey,
  noDivider = false,
  gap = 0,
  className,
}: RowListProps<T>) {
  const gapClass = s[`gap${gap}` as `gap${typeof gap}`];
  return (
    <div className={cx(s.list, gapClass, className)} role="list">
      {items.map((item, i) => (
        <React.Fragment key={getKey ? getKey(item, i) : i}>
          {i > 0 && !noDivider && gap === 0 && <Divider />}
          <div className={s.row} role="listitem">
            {renderItem(item, i)}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
