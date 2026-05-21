import React from 'react';
import { cx } from '../../../utils/cx';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Stack } from '../../layout/Stack/Stack';
import { Muted } from '../../layout/Muted/Muted';
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
  const title = loading ? 'Loading subscription…' : (subscriberName ?? 'Subscription');

  return (
    <Drawer open={open} onClose={onClose} title={title} className={s.drawerWide}>
      <div className={s.panelHost}>
        {loading ? (
          <Muted>Fetching subscription details…</Muted>
        ) : (
          <Stack gap={6}>
            <div className={s.hero}>
              {subscriberEmail ? <p className={s.sub}>{subscriberEmail}</p> : null}
              {creatorLabel && planLabel ? (
                <p className={s.sub}>
                  {creatorLabel} · {planLabel}
                  {priceLabel ? ` · ${priceLabel}` : ''}
                </p>
              ) : null}
              <div className={s.badges}>
                {statusLabel ? (
                  <Badge tone={STATUS_TONE[statusTone] ?? 'mute'}>{statusLabel}</Badge>
                ) : null}
                {healthLabel ? <Badge tone="blue">{healthLabel}</Badge> : null}
              </div>
            </div>

            {entitlementLabel ? (
              <section>
                <h4 className={s.sectionHead}>Current entitlement</h4>
                <div className={s.entitlement}>
                  <p className={s.entitlementLabel}>{entitlementLabel}</p>
                  {entitlementMeta ? <p className={s.entitlementMeta}>{entitlementMeta}</p> : null}
                </div>
              </section>
            ) : null}

            <div className={s.metaGrid}>
              <div>
                <p className={s.metaLabel}>Renewal</p>
                <p className={s.metaValue}>{renewsLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Started</p>
                <p className={s.metaValue}>{startedLabel ?? '—'}</p>
              </div>
              {stripeSubscriptionId ? (
                <div>
                  <p className={s.metaLabel}>Stripe subscription</p>
                  <p className={s.metaValue}>{stripeSubscriptionId}</p>
                </div>
              ) : null}
            </div>

            {incidents.length > 0 ? (
              <section>
                <h4 className={s.sectionHead}>Billing incidents ({incidents.length})</h4>
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
              </section>
            ) : null}

            <div className={s.actions}>
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
            </div>
          </Stack>
        )}
      </div>
    </Drawer>
  );
}
