import React from 'react';
import { cx } from '../../../utils/cx';
import { Button } from '../../atoms/Button/Button';
import s from './AccountBillingPanel.module.css';

export interface AccountBillingHistoryItem {
  id: string;
  dateLabel: string;
  detail: string;
  amount: string;
}

export interface AccountBillingPanelProps {
  paymentLabel?: string;
  paymentSub?: string;
  paymentBrand?: string;
  onUpdatePayment?: () => void;
  history?: AccountBillingHistoryItem[];
  onViewAllHistory?: () => void;
  emptyHistoryLabel?: string;
  className?: string;
}

export function AccountBillingPanel({
  paymentLabel = 'Card on file',
  paymentSub,
  paymentBrand = 'CARD',
  onUpdatePayment,
  history = [],
  onViewAllHistory,
  emptyHistoryLabel = 'No billing history yet.',
  className,
}: AccountBillingPanelProps) {
  return (
    <div className={cx(s.panel, className)}>
      <section className={s.section} aria-labelledby="billing-payment-heading">
        <h3 id="billing-payment-heading" className={s.title}>
          Payment method
        </h3>
        <div className={s.methodCard}>
          <div className={s.methodLeft}>
            <span className={s.brand} aria-hidden="true">
              {paymentBrand}
            </span>
            <div className={s.methodCopy}>
              <p className={s.methodLabel}>{paymentLabel}</p>
              {paymentSub ? <p className={s.methodSub}>{paymentSub}</p> : null}
            </div>
          </div>
        </div>
        {onUpdatePayment ? (
          <Button variant="secondary" block iconLeft="card" onClick={onUpdatePayment}>
            Update payment method
          </Button>
        ) : null}
      </section>

      <section className={s.section} aria-labelledby="billing-history-heading">
        <h3 id="billing-history-heading" className={s.title}>
          Billing history
        </h3>
        {history.length === 0 ? (
          <p className={s.empty}>{emptyHistoryLabel}</p>
        ) : (
          <div className={s.history}>
            {history.map((row) => (
              <div key={row.id} className={s.historyRow}>
                <div className={s.historyCopy}>
                  <p className={s.historyDate}>{row.dateLabel}</p>
                  <p className={s.historyDetail}>{row.detail}</p>
                </div>
                <p className={s.historyAmount}>{row.amount}</p>
              </div>
            ))}
          </div>
        )}
        {onViewAllHistory && history.length > 0 ? (
          <button type="button" className={s.linkBtn} onClick={onViewAllHistory}>
            View all transactions
          </button>
        ) : null}
      </section>
    </div>
  );
}
