import React from 'react';
import { cx } from '../../../utils/cx';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Muted } from '../../layout/Muted/Muted';
import { AdminInspectorDrawerShell } from '../AdminInspectorDrawerShell/AdminInspectorDrawerShell';
import {
  AdminDetailDrawerBody,
  AdminDetailMetaCard,
  AdminDetailSection,
} from '../AdminDetailDrawerBody/AdminDetailDrawerBody';
import bd from '../AdminDetailDrawerBody/AdminDetailDrawerBody.module.css';
import s from './AdminBillingDetailDrawer.module.css';

export interface AdminBillingIncident {
  id: string;
  title: string;
  amountLabel: string;
  meta: string;
  urgent?: boolean;
}

export interface AdminBillingDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  subscriberName?: string;
  subscriberEmail?: string;
  creatorLabel?: string;
  planLabel?: string;
  priceLabel?: string;
  statusLabel?: string;
  statusTone?: 'green' | 'amber' | 'red' | 'mute';
  healthLabel?: string;
  entitlementLabel?: string;
  entitlementMeta?: string;
  renewsLabel?: string;
  startedLabel?: string;
  stripeSubscriptionId?: string;
  incidents?: AdminBillingIncident[];
  onOpenRefunds?: () => void;
  onOpenSubscriber?: () => void;
  onOpenCreator?: () => void;
}

const STATUS_TONE: Record<string, 'green' | 'amber' | 'red' | 'mute'> = {
  green: 'green',
  amber: 'amber',
  red: 'red',
  mute: 'mute',
};

export function AdminBillingDetailDrawer({
  open,
  onClose,
  loading,
  subscriberName,
  subscriberEmail,
  creatorLabel,
  planLabel,
  statusLabel,
  statusTone = 'mute',
  healthLabel,
  entitlementLabel,
  entitlementMeta,
  renewsLabel,
  startedLabel,
  priceLabel,
  stripeSubscriptionId,
  incidents = [],
  onOpenRefunds,
  onOpenSubscriber,
  onOpenCreator,
}: AdminBillingDetailDrawerProps) {
  const ariaLabel = loading ? 'Loading subscription' : (subscriberName ?? 'Subscription');
  const title = loading ? 'Loading subscription…' : (subscriberName ?? 'Subscription');

  const subtitle = (
    <>
      {subscriberEmail ? <p>{subscriberEmail}</p> : null}
      {creatorLabel && planLabel ? (
        <p>
          {creatorLabel} · {planLabel}
          {priceLabel ? ` · ${priceLabel}` : ''}
        </p>
      ) : null}
    </>
  );

  const footer = (
    <>
      {onOpenRefunds ? (
        <Button variant="primary" onClick={onOpenRefunds}>
          Open refunds queue
        </Button>
      ) : null}
      {onOpenSubscriber ? (
        <Button variant="secondary" onClick={onOpenSubscriber}>
          View subscriber
        </Button>
      ) : null}
      {onOpenCreator ? (
        <Button variant="outline" onClick={onOpenCreator}>
          View creator
        </Button>
      ) : null}
    </>
  );

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {loading ? (
        <div className={bd.scroll}>
          <Muted>Fetching subscription details…</Muted>
        </div>
      ) : (
        <AdminDetailDrawerBody
          title={title}
          subtitle={subtitle}
          badges={
            <>
              {statusLabel ? (
                <Badge tone={STATUS_TONE[statusTone] ?? 'mute'}>{statusLabel}</Badge>
              ) : null}
              {healthLabel ? <Badge tone="blue">{healthLabel}</Badge> : null}
            </>
          }
          footer={footer}
          footerLayout="row"
        >
          {entitlementLabel ? (
            <AdminDetailSection title="Current entitlement">
              <div className={bd.entitlement}>
                <p className={bd.entitlementLabel}>{entitlementLabel}</p>
                {entitlementMeta ? <p className={bd.entitlementMeta}>{entitlementMeta}</p> : null}
              </div>
            </AdminDetailSection>
          ) : null}

          <div className={bd.metaGrid}>
            <AdminDetailMetaCard label="Renewal" value={renewsLabel} />
            <AdminDetailMetaCard label="Started" value={startedLabel} />
            {stripeSubscriptionId ? (
              <AdminDetailMetaCard label="Stripe subscription" value={stripeSubscriptionId} />
            ) : null}
          </div>

          {incidents.length > 0 ? (
            <AdminDetailSection title={`Billing incidents (${incidents.length})`}>
              <div className={s.incidents}>
                {incidents.map((inc) => (
                  <div key={inc.id} className={cx(s.incident, inc.urgent && s.incidentUrgent)}>
                    <div className={s.incidentTop}>
                      <p className={s.incidentTitle}>{inc.title}</p>
                      <span className={s.incidentAmount}>{inc.amountLabel}</span>
                    </div>
                    <p className={s.incidentMeta}>{inc.meta}</p>
                  </div>
                ))}
              </div>
            </AdminDetailSection>
          ) : null}
        </AdminDetailDrawerBody>
      )}
    </AdminInspectorDrawerShell>
  );
}
