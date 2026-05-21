import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Stack } from '../../layout/Stack/Stack';
import { Muted } from '../../layout/Muted/Muted';
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
  const title = loading ? 'Loading payout details…' : (creatorName ?? 'Creator payout');

  return (
    <Drawer open={open} onClose={onClose} title={title} className={s.drawerWide}>
      <div className={s.panelHost}>
        {loading ? (
          <Muted>Fetching Connect and payout history…</Muted>
        ) : (
          <Stack gap={6}>
            <div className={s.hero}>
              {handleLine ? <p className={s.sub}>{handleLine}</p> : null}
              {nicheLine ? <p className={s.sub}>{nicheLine}</p> : null}
              <div className={s.badges}>
                {connectLabel ? (
                  <Badge tone={CONNECT_TONE[connectTone] ?? 'mute'}>{connectLabel}</Badge>
                ) : null}
                {failedCount > 0 ? (
                  <Badge tone="red">
                    {failedCount} failed payout{failedCount === 1 ? '' : 's'}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className={s.metaGrid}>
              <div>
                <p className={s.metaLabel}>Paid to date</p>
                <p className={s.metaValue}>{paidLabel ?? '—'}</p>
              </div>
              <div>
                <p className={s.metaLabel}>Pending</p>
                <p className={s.metaValue}>{pendingLabel ?? '—'}</p>
              </div>
              {accountTail ? (
                <div>
                  <p className={s.metaLabel}>Connect account</p>
                  <p className={s.metaValue}>…{accountTail}</p>
                </div>
              ) : null}
            </div>

            {history.length > 0 ? (
              <section>
                <h4 className={s.sectionHead}>Payout history</h4>
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
              </section>
            ) : (
              <Muted>No payout records yet. Rows sync from Stripe Connect after onboarding.</Muted>
            )}

            <div className={s.actions}>
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
            </div>
          </Stack>
        )}
      </div>
    </Drawer>
  );
}
