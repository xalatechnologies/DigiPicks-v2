import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './StudioTierCard.module.css';

export type StudioTierVariant = 'starter' | 'advanced' | 'elite';

export interface StudioTierFeature {
  text: string;
  included: boolean;
}

export interface StudioTierCardProps {
  variant?: StudioTierVariant;
  tierLabel: string;
  name: string;
  price: string;
  period?: string;
  features: StudioTierFeature[];
  activeSubs?: number;
  popular?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function StudioTierCard({
  variant = 'starter',
  tierLabel,
  name,
  price,
  period = 'month',
  features,
  activeSubs,
  popular,
  onEdit,
  onDelete,
  className,
}: StudioTierCardProps) {
  const subsLabel =
    activeSubs !== undefined ? `${activeSubs.toLocaleString()} Active Subs` : undefined;

  return (
    <article className={cx(s.card, s[variant], className)}>
      {popular ? <span className={s.popular}>Popular</span> : null}
      <div className={s.head}>
        <span className={s.tierLabel}>{tierLabel}</span>
        <h3 className={s.name}>{name}</h3>
        <div className={s.priceRow}>
          <span className={s.price}>{price}</span>
          <span className={s.period}>/ {period}</span>
        </div>
      </div>
      <ul className={s.features}>
        {features.map((f, i) => (
          <li key={i} className={cx(s.feature, f.included ? s.featureOn : s.featureOff)}>
            <span className={f.included ? s.featureIcon : s.featureIconOff} aria-hidden>
              <Icon
                name={f.included ? (variant === 'elite' ? 'sparkles' : 'check') : 'x'}
                size={20}
              />
            </span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>
      <footer className={s.foot}>
        {subsLabel ? <span className={s.subs}>{subsLabel}</span> : <span />}
        <div className={s.actions}>
          <button
            type="button"
            className={s.iconBtn}
            aria-label={`Edit ${name}`}
            onClick={onEdit}
            disabled={!onEdit}
          >
            <Icon name="edit" size={18} />
          </button>
          <button
            type="button"
            className={cx(s.iconBtn, s.iconBtnDanger)}
            aria-label={`Archive ${name}`}
            onClick={onDelete}
            disabled={!onDelete}
          >
            <Icon name="trash" size={18} />
          </button>
        </div>
      </footer>
    </article>
  );
}
