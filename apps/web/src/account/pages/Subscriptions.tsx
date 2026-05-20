import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Button,
  EmptyState,
  StudioPageHeader,
  StudioDashLayout,
  StudioDashCol,
  StudioSummaryGrid,
  FilterChips,
  AccountRefineCard,
  SectionHead,
  SubscriptionMembershipCard,
  type SubscriptionMembershipMeta,
  AccountBillingPanel,
  AccountSubscriptionsPromo,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { accountCrossLinks } from '../../lib/accountCrossLinks';
import { useStripePortal } from '../../lib/useStripePortal';
import type { Id } from '../../../../../convex/_generated/dataModel';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fmtPlan(plan: string): string {
  const label = plan.charAt(0).toUpperCase() + plan.slice(1);
  return `${label} plan`;
}

function nicheTag(niche?: string, sports?: string[]): string | undefined {
  if (niche) return niche;
  if (sports && sports.length > 0) return sports[0];
  return undefined;
}

function buildMeta(
  status: string,
  renewsAt?: number,
  cancelledAt?: number,
): SubscriptionMembershipMeta[] {
  if (status === 'past_due') {
    return [
      { label: 'Retrying payment', icon: 'clock', tone: 'default' },
      { label: 'Payment issue', tone: 'danger' },
    ];
  }
  if (status === 'cancelled') {
    const endLabel = cancelledAt
      ? `Cancelled ${fmtDate(cancelledAt)}`
      : renewsAt
        ? `Ended ${fmtDate(renewsAt)}`
        : 'Cancelled';
    return [{ label: endLabel, icon: 'x', tone: 'warn' }];
  }
  if (status === 'active') {
    const items: SubscriptionMembershipMeta[] = [];
    if (renewsAt) {
      items.push({ label: `Renews ${fmtDate(renewsAt)}`, icon: 'calendar' });
    }
    items.push({ label: 'Active', icon: 'check', tone: 'active' });
    return items;
  }
  return [{ label: status.replace('_', ' '), tone: 'default' }];
}

export function Subscriptions() {
  const navigate = useNavigate();
  const { openPortal } = useStripePortal();
  const subs = useQuery(api.subscriptions.mySubscriptions);
  const cancelSub = useMutation(api.subscriptions.cancel);
  const [cancelling, setCancelling] = useState<Id<'creators'> | null>(null);
  const [sportFilter, setSportFilter] = useState<string | null>(null);

  const isLoading = subs === undefined;
  const active = subs?.filter((s) => s.status === 'active') ?? [];
  const pastDue = subs?.filter((s) => s.status === 'past_due') ?? [];
  const cancelled = subs?.filter((s) => s.status === 'cancelled') ?? [];
  const totalMonthly = active.reduce((sum, s) => sum + s.creatorStartingPrice, 0);

  const renewingThisWeek = active.filter(
    (s) => s.renewsAt != null && s.renewsAt <= Date.now() + WEEK_MS,
  ).length;

  const recentSub = useMemo(() => {
    const all = subs ?? [];
    if (all.length === 0) return null;
    return [...all].sort((a, b) => b.startedAt - a.startedAt)[0];
  }, [subs]);

  const sportOptions = useMemo(() => {
    const sports = new Set<string>();
    for (const sub of subs ?? []) {
      for (const sport of sub.creatorSports ?? []) {
        sports.add(sport);
      }
    }
    return [...sports].sort();
  }, [subs]);

  const allSubs = useMemo(
    () => [...pastDue, ...active, ...cancelled],
    [pastDue, active, cancelled],
  );

  const displayList = useMemo(() => {
    if (!sportFilter) return allSubs;
    return allSubs.filter((sub) =>
      (sub.creatorSports ?? []).some((sport) => sport.toLowerCase() === sportFilter.toLowerCase()),
    );
  }, [allSubs, sportFilter]);

  const billingHistory = useMemo(() => {
    return [...(subs ?? [])]
      .filter((sub) => sub.startedAt)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 5)
      .map((sub) => ({
        id: sub._id,
        dateLabel: fmtDate(sub.startedAt),
        detail: `${sub.creatorName} · ${fmtPlan(sub.plan)}`,
        amount: `$${sub.creatorStartingPrice.toFixed(2)}`,
      }));
  }, [subs]);

  const summaryItems = useMemo(
    () => [
      {
        id: 'active',
        icon: 'users' as const,
        iconTone: 'primary' as const,
        label: 'Active subscriptions',
        value: String(active.length),
      },
      {
        id: 'spend',
        icon: 'dollar' as const,
        iconTone: 'amber' as const,
        label: 'Total monthly spend',
        value: `$${totalMonthly.toFixed(2)}`,
      },
      {
        id: 'renew',
        icon: 'calendar' as const,
        iconTone: 'violet' as const,
        label: 'Renewing this week',
        value: String(renewingThisWeek),
      },
      {
        id: 'recent',
        icon: 'user' as const,
        iconTone: 'primary' as const,
        label: 'Recently added',
        value: recentSub?.creatorName ?? '—',
        valueVariant: 'text' as const,
      },
    ],
    [active.length, totalMonthly, renewingThisWeek, recentSub],
  );

  async function handleCancel(creatorId: Id<'creators'>) {
    setCancelling(creatorId);
    try {
      await cancelSub({ creatorId });
    } catch {
      /* useQuery recovers */
    } finally {
      setCancelling(null);
    }
  }

  function renderSubscription(sub: (typeof displayList)[number]) {
    const isPastDue = sub.status === 'past_due';
    const isCancelled = sub.status === 'cancelled';

    return (
      <SubscriptionMembershipCard
        key={sub._id}
        creatorName={sub.creatorName}
        creatorMono={sub.creatorMono}
        creatorColor={sub.creatorColor}
        creatorVerified={sub.creatorVerified}
        nicheTag={nicheTag(sub.creatorNiche, sub.creatorSports)}
        planLabel={fmtPlan(sub.plan)}
        price={sub.creatorStartingPrice}
        meta={buildMeta(sub.status, sub.renewsAt, sub.cancelledAt)}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              block
              onClick={() => navigate(`/creators/${sub.creatorHandle}`)}
            >
              View creator
            </Button>
            {isPastDue ? (
              <Button
                variant="primary"
                size="sm"
                block
                onClick={() => navigate('/account/billing/payment-issue')}
              >
                Update now
              </Button>
            ) : isCancelled ? (
              <Button
                variant="primary"
                size="sm"
                block
                onClick={() => navigate(`/creators/${sub.creatorHandle}`)}
              >
                Resubscribe
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                block
                onClick={() => handleCancel(sub.creatorId)}
                disabled={cancelling === sub.creatorId}
              >
                {cancelling === sub.creatorId ? 'Cancelling…' : 'Manage'}
              </Button>
            )}
          </>
        }
      />
    );
  }

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Billing"
          title="Subscriptions"
          sub="Manage your active creator memberships."
          actions={
            <Button
              variant="primary"
              iconRight="arrow-right"
              onClick={() => navigate('/account/discover')}
            >
              Discover creators
            </Button>
          }
        />

        <StudioSummaryGrid items={summaryItems} columns={4} />

        <AccountRefineCard
          sub="Filter memberships by the sports your creators cover."
          summary={
            isLoading
              ? 'Loading subscriptions…'
              : `${displayList.length} membership${displayList.length === 1 ? '' : 's'} in view`
          }
          onReset={sportFilter ? () => setSportFilter(null) : undefined}
        >
          {sportOptions.length > 0 ? (
            <FilterChips
              options={sportOptions.map((s) => ({ label: s, value: s }))}
              value={sportFilter}
              onChange={setSportFilter}
              allLabel="All sports"
            />
          ) : null}
        </AccountRefineCard>

        <StudioDashLayout>
          <StudioDashCol span={8}>
            <Stack gap={4}>
              <SectionHead
                title="Your subscriptions"
                sub="Active, past-due, and cancelled plans."
              />

              {isLoading && <EmptyState icon="card" title="Loading subscriptions…" />}

              {!isLoading && displayList.length === 0 && (
                <EmptyState
                  icon="card"
                  title="No subscriptions yet"
                  subtitle="Discover creators and subscribe to start receiving premium picks."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      iconRight="arrow-right"
                      onClick={() => navigate('/account/discover')}
                    >
                      Browse creators
                    </Button>
                  }
                />
              )}

              {!isLoading && displayList.length > 0 && (
                <Stack gap={4}>{displayList.map(renderSubscription)}</Stack>
              )}
            </Stack>
          </StudioDashCol>

          <StudioDashCol span={4}>
            <Stack gap={6}>
              <AccountBillingPanel
                paymentBrand="Stripe"
                paymentLabel="Payment & invoices"
                paymentSub="Manage cards and download invoices in the Stripe portal."
                onUpdatePayment={() => navigate('/account/payment-methods')}
                history={billingHistory}
                onViewAllHistory={() => navigate('/account/billing-history')}
              />
              <AccountSubscriptionsPromo
                title="Go annual. Save 20% today."
                body="Switch eligible creator plans to yearly billing and keep more of your bankroll working."
                ctaLabel="Switch to yearly"
                onCta={() => navigate('/account/discover')}
              />
            </Stack>
          </StudioDashCol>
        </StudioDashLayout>

        <QuickActionGrid title="Related" items={accountCrossLinks('subscriptions', navigate)} />
      </Stack>
    </Container>
  );
}
