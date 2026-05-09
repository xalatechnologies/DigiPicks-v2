import React from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { PriceCard } from '../../surfaces/PriceCard/PriceCard';
import { Button } from '../../atoms/Button/Button';
import { Muted } from '../../layout/Muted/Muted';
import s from './PricingModal.module.css';

export type PricingPlan = 'free' | 'premium' | 'vip';

export interface PricingTier {
  plan: PricingPlan;
  name: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
  /** Set false when the creator hasn't configured a Stripe price for this tier. */
  available?: boolean;
}

export interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  creatorName: string;
  tiers: PricingTier[];
  onSubscribe: (plan: PricingPlan) => void | Promise<void>;
  busyPlan?: PricingPlan | null;
}

export function PricingModal({
  open,
  onClose,
  creatorName,
  tiers,
  onSubscribe,
  busyPlan,
}: PricingModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Subscribe to ${creatorName}`}
      className={s.modal}
    >
      <div className={s.grid}>
        {tiers.map((tier) => {
          const available = tier.available ?? true;
          const busy = busyPlan === tier.plan;
          const cta = (
            <Button
              variant={tier.featured ? 'primary' : 'outline'}
              size="md"
              block
              disabled={!available || busyPlan !== null}
              onClick={() => onSubscribe(tier.plan)}
            >
              {!available
                ? 'Not configured'
                : busy
                  ? 'Opening checkout…'
                  : tier.plan === 'free'
                    ? 'Subscribe for free'
                    : 'Continue with Stripe'}
            </Button>
          );
          return (
            <PriceCard
              key={tier.plan}
              name={tier.name}
              price={tier.price}
              period={tier.period}
              features={tier.features}
              featured={tier.featured}
              cta={cta}
            />
          );
        })}
      </div>
      <Muted>
        Subscriptions renew monthly. Cancel anytime from your account
        settings — Stripe handles billing and refunds.
      </Muted>
    </Modal>
  );
}
