import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import s from './CreatorSubscribeCard.module.css';

export interface CreatorSubscribeFeature {
  icon: IconName;
  text: string;
}

export interface CreatorSubscribeCardProps {
  price: string;
  period?: string;
  eyebrow?: string;
  features: CreatorSubscribeFeature[];
  subscribeLabel?: string;
  onSubscribe?: () => void;
  disabled?: boolean;
  footerNote?: string;
  className?: string;
}

export function CreatorSubscribeCard({
  price,
  period = 'mo',
  eyebrow = 'Monthly access',
  features,
  subscribeLabel = 'Get full access now',
  onSubscribe,
  disabled,
  footerNote = 'Billed monthly. Cancel anytime with one click.',
  className,
}: CreatorSubscribeCardProps) {
  return (
    <article className={cx(s.card, className)}>
      <div className={s.head}>
        <p className={s.eyebrow}>{eyebrow}</p>
        <p className={s.price}>
          {price}
          <span className={s.period}>/{period}</span>
        </p>
      </div>
      <div className={s.body}>
        <ul className={s.list}>
          {features.map((feature) => (
            <li key={feature.text} className={s.item}>
              <Icon name={feature.icon} size={18} className={s.itemIcon} />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        {onSubscribe ? (
          <Button variant="primary" block onClick={onSubscribe} disabled={disabled}>
            {subscribeLabel}
          </Button>
        ) : null}
        {footerNote ? <p className={s.foot}>{footerNote}</p> : null}
      </div>
    </article>
  );
}
