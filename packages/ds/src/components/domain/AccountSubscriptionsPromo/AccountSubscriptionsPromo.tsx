import React from 'react';
import { cx } from '../../../utils/cx';
import { Button } from '../../atoms/Button/Button';
import s from './AccountSubscriptionsPromo.module.css';

export interface AccountSubscriptionsPromoProps {
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

export function AccountSubscriptionsPromo({
  title,
  body,
  ctaLabel = 'Switch to yearly',
  onCta,
  className,
}: AccountSubscriptionsPromoProps) {
  return (
    <article className={cx(s.promo, className)}>
      <div className={s.glow} aria-hidden="true" />
      <div className={s.copy}>
        <h4 className={s.title}>{title}</h4>
        {body ? <p className={s.body}>{body}</p> : null}
        {onCta ? (
          <Button variant="secondary" block onClick={onCta}>
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
