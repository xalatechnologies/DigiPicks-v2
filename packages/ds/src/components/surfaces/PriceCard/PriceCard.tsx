import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './PriceCard.module.css';

export interface PriceCardProps {
  name: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
  cta?: React.ReactNode;
  className?: string;
}

export function PriceCard({
  name,
  price,
  period = 'mo',
  features,
  featured,
  cta,
  className,
}: PriceCardProps) {
  return (
    <div className={cx(s.card, featured && s.featured, className)}>
      <span className={s.shine} aria-hidden="true" />
      <div className={s.head}>
        <div className={s.name}>{name}</div>
        <div className={s.priceRow}>
          <span className={s.price}>{price}</span>
          <span className={s.period}>/{period}</span>
        </div>
      </div>
      <ul className={s.features}>
        {features.map((f, i) => (
          <li key={i} className={s.feature}>
            <span className={s.tick}>
              <Icon name="check" size={14} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {cta && <div className={s.cta}>{cta}</div>}
    </div>
  );
}
