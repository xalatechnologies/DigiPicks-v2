import React from 'react';
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
import s from './AdminPayoutDetailDrawer.module.css';

export interface AdminPayoutHistoryItem {
  id: string;
  periodLabel: string;
  amountLabel: string;
  status: string;
  paidLabel: string;
}

export interface AdminPayoutDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  creatorName?: string;
  handleLine?: string;
  nicheLine?: string;
  connectLabel?: string;
  connectTone?: 'green' | 'amber' | 'red' | 'mute';
  accountTail?: string;
  paidLabel?: string;
  pendingLabel?: string;
  failedCount?: number;
  history?: AdminPayoutHistoryItem[];
  onOpenCreator?: () => void;
  onOpenBilling?: () => void;
}

const CONNECT_TONE: Record<string, 'green' | 'amber' | 'red' | 'mute'> = {
  green: 'green',
  amber: 'amber',
  red: 'red',
  mute: 'mute',
};

function historyStatusTone(status: string): 'green' | 'amber' | 'red' | 'mute' {
  if (status === 'paid') return 'green';
  if (status === 'pending') return 'amber';
  if (status === 'failed') return 'red';
  return 'mute';
}

export function AdminPayoutDetailDrawer({
  open,
  onClose,
  loading,
  creatorName,
  handleLine,
  nicheLine,
  connectLabel,
  connectTone = 'mute',
  accountTail,
  paidLabel,
  pendingLabel,
  failedCount = 0,
  history = [],
  onOpenCreator,
  onOpenBilling,
}: AdminPayoutDetailDrawerProps) {
  const ariaLabel = loading ? 'Loading payout details' : (creatorName ?? 'Creator payout');
  const title = loading ? 'Loading payout details…' : (creatorName ?? 'Creator payout');

  const subtitle = (
    <>
      {handleLine ? <p>{handleLine}</p> : null}
      {nicheLine ? <p>{nicheLine}</p> : null}
    </>
  );

  const footer = (
    <>
      {onOpenCreator ? (
        <Button variant="primary" onClick={onOpenCreator}>
          View creator
        </Button>
      ) : null}
      {onOpenBilling ? (
        <Button variant="secondary" onClick={onOpenBilling}>
          Subscriptions & billing
        </Button>
      ) : null}
    </>
  );

  return (
    <AdminInspectorDrawerShell open={open} onClose={onClose} ariaLabel={ariaLabel}>
      {loading ? (
        <div className={bd.scroll}>
          <Muted>Fetching Connect and payout history…</Muted>
        </div>
      ) : (
        <AdminDetailDrawerBody
          title={title}
          subtitle={subtitle}
          badges={
            <>
              {connectLabel ? (
                <Badge tone={CONNECT_TONE[connectTone] ?? 'mute'}>{connectLabel}</Badge>
              ) : null}
              {failedCount > 0 ? (
                <Badge tone="red">
                  {failedCount} failed payout{failedCount === 1 ? '' : 's'}
                </Badge>
              ) : null}
            </>
          }
          footer={footer}
          footerLayout="grid"
        >
          <div className={bd.metaGrid}>
            <AdminDetailMetaCard label="Paid to date" value={paidLabel} />
            <AdminDetailMetaCard label="Pending" value={pendingLabel} />
            {accountTail ? (
              <AdminDetailMetaCard label="Connect account" value={`…${accountTail}`} />
            ) : null}
          </div>

          {history.length > 0 ? (
            <AdminDetailSection title="Payout history">
              <div className={s.history}>
                {history.map((item) => (
                  <div key={item.id} className={s.historyRow}>
                    <div className={s.historyTop}>
                      <p className={s.historyTitle}>{item.periodLabel}</p>
                      <span className={s.historyAmount}>{item.amountLabel}</span>
                    </div>
                    <div className={s.historyMeta}>
                      <Badge tone={historyStatusTone(item.status)}>{item.status}</Badge>
                      <span>Paid {item.paidLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </AdminDetailSection>
          ) : (
            <Muted>No payout records yet. Rows sync from Stripe Connect after onboarding.</Muted>
          )}
        </AdminDetailDrawerBody>
      )}
    </AdminInspectorDrawerShell>
  );
}
