import React, { useEffect, useState } from 'react';
import { cx } from '../../../utils/cx';
import { Button } from '../../atoms/Button/Button';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminUserDetailPanel.module.css';

export interface AdminUserSubscriptionItem {
  id: string;
  creatorName: string;
  creatorHandle: string;
  plan: string;
  status: string;
  accessActive: boolean;
  renewsLabel: string;
}

export interface AdminUserDetailData {
  id: string;
  name: string;
  email: string;
  monogram: string;
  typeLabel: string;
  statusLabel: string;
  subscriptionCount: number;
  activeSubscriptionCount: number;
  overrideCount: number;
  subscriptions: AdminUserSubscriptionItem[];
}

export interface AdminUserHistoryItem {
  label: string;
  at: string;
}

export interface AdminUserDetailPanelProps {
  user: AdminUserDetailData | null;
  loading?: boolean;
  history?: AdminUserHistoryItem[];
  onEntitlements?: () => void;
  onCreatorProfile?: () => void;
  /** Sidebar column vs slide-over drawer body. */
  variant?: 'sidebar' | 'drawer';
  className?: string;
}

const TABS = ['Overview', 'Subscriptions', 'History'] as const;
type DetailTab = (typeof TABS)[number];

function subStatusClass(status: string, accessActive: boolean): string {
  if (!accessActive && status === 'past_due') return s.subStatusWarn;
  if (!accessActive) return s.subStatusBad;
  return s.subStatus;
}

export function AdminUserDetailPanel({
  user,
  loading,
  history = [],
  onEntitlements,
  onCreatorProfile,
  variant = 'sidebar',
  className,
}: AdminUserDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('Overview');
  const isDrawer = variant === 'drawer';
  const Root = isDrawer ? 'div' : 'aside';

  useEffect(() => {
    setTab('Overview');
  }, [user?.id]);

  if (isDrawer && (loading || !user)) {
    return (
      <div className={cx(s.wrapDrawer, className)}>
        <EmptyState icon="users" title={loading ? 'Loading user…' : 'User not found'} />
      </div>
    );
  }

  if (!isDrawer && !user && !loading) {
    return (
      <aside className={cx(s.wrap, className)} aria-label="User details">
        <div className={s.empty}>
          <EmptyState
            icon="users"
            title="Select a user"
            subtitle="Choose a row to review account type, subscriptions, and entitlements."
          />
        </div>
      </aside>
    );
  }

  if (!isDrawer && (loading || !user)) {
    return (
      <aside className={cx(s.wrap, className)} aria-label="User details">
        <div className={s.empty}>
          <EmptyState icon="users" title="Loading user…" />
        </div>
      </aside>
    );
  }

  if (!user) return null;

  return (
    <Root
      className={cx(isDrawer ? s.wrapDrawer : s.wrap, className)}
      aria-label={`Details for ${user.name}`}
    >
      <div className={s.hero}>
        <div className={s.heroFade} aria-hidden />
      </div>

      <div className={s.profile}>
        <span className={s.avatar} aria-hidden>
          {user.monogram}
        </span>
        <div className={s.headRow}>
          {!isDrawer ? <h3 className={s.title}>{user.name}</h3> : null}
          <p className={s.sub}>{user.email}</p>
          <span className={s.typeBadge}>{user.typeLabel}</span>
        </div>
      </div>

      <div className={s.tabs} role="tablist" aria-label="User detail sections">
        {TABS.map((label) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === label}
            className={cx(s.tab, tab === label && s.tabActive)}
            onClick={() => setTab(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={s.body}>
        {tab === 'Overview' ? (
          <>
            <section>
              <h4 className={s.sectionTitle}>Account</h4>
              <div className={s.statGrid}>
                <div className={s.statCard}>
                  <p className={s.statLabel}>Status</p>
                  <p className={s.statValue}>{user.statusLabel}</p>
                </div>
                <div className={s.statCard}>
                  <p className={s.statLabel}>Subscriptions</p>
                  <p className={s.statValue}>{user.subscriptionCount}</p>
                </div>
                <div className={s.statCard}>
                  <p className={s.statLabel}>Active access</p>
                  <p className={s.statValue}>{user.activeSubscriptionCount}</p>
                </div>
                <div className={s.statCard}>
                  <p className={s.statLabel}>Overrides</p>
                  <p className={s.statValue}>{user.overrideCount}</p>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {tab === 'Subscriptions' ? (
          <section>
            <h4 className={s.sectionTitle}>
              Active subscriptions ({user.activeSubscriptionCount})
            </h4>
            {user.subscriptions.length === 0 ? (
              <EmptyState
                icon="card"
                title="No subscriptions"
                subtitle="This user is not subscribed to any creators."
              />
            ) : (
              <ul className={s.subList}>
                {user.subscriptions.map((sub) => (
                  <li key={sub.id} className={s.subItem}>
                    <div>
                      <p className={s.subName}>{sub.creatorName}</p>
                      <p className={s.subMeta}>
                        @{sub.creatorHandle} · {sub.plan}
                      </p>
                    </div>
                    <span className={subStatusClass(sub.status, sub.accessActive)}>
                      {sub.accessActive ? 'Active' : sub.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {tab === 'History' ? (
          <section>
            <h4 className={s.sectionTitle}>Admin history</h4>
            {history.length === 0 ? (
              <EmptyState
                icon="audit"
                title="No audit events"
                subtitle="Actions on this user will appear here."
              />
            ) : (
              <ul className={s.history}>
                {history.map((item, i) => (
                  <li key={`${item.label}-${item.at}-${i}`} className={s.historyItem}>
                    <p className={s.historyLabel}>{item.label}</p>
                    <p className={s.historyAt}>{item.at}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      <footer className={s.footer}>
        <div className={s.footerRow}>
          {onEntitlements ? (
            <Button variant="primary" size="sm" iconLeft="lock" onClick={onEntitlements}>
              Entitlements
            </Button>
          ) : null}
          {onCreatorProfile ? (
            <Button variant="secondary" size="sm" iconLeft="verified" onClick={onCreatorProfile}>
              Creator profile
            </Button>
          ) : null}
        </div>
      </footer>
    </Root>
  );
}
