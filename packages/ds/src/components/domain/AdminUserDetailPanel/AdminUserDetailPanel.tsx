import React, { useEffect, useState } from 'react';
import { cx } from '../../../utils/cx';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
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

function statusTone(label: string): 'green' | 'red' | 'amber' | 'mute' {
  const key = label.toLowerCase();
  if (key.includes('suspend') || key.includes('ban') || key.includes('disabled')) return 'red';
  if (key.includes('pending') || key.includes('past_due') || key.includes('issue')) return 'amber';
  if (key.includes('active')) return 'green';
  return 'mute';
}

function subStatusTone(status: string, accessActive: boolean): 'green' | 'amber' | 'red' | 'mute' {
  if (accessActive) return 'green';
  if (status === 'past_due') return 'amber';
  return 'red';
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

  const status = statusTone(user.statusLabel);
  const overviewStats = [
    { icon: 'user' as const, label: 'Account status', value: user.statusLabel },
    { icon: 'card' as const, label: 'Subscriptions', value: String(user.subscriptionCount) },
    { icon: 'users' as const, label: 'Active access', value: String(user.activeSubscriptionCount) },
    { icon: 'lock' as const, label: 'Overrides', value: String(user.overrideCount) },
  ];

  return (
    <Root
      className={cx(isDrawer ? s.wrapDrawer : s.wrap, className)}
      aria-label={`Details for ${user.name}`}
    >
      {!isDrawer ? (
        <div className={s.hero}>
          <div className={s.heroFade} aria-hidden />
          <Badge tone={status} dot className={s.statusBadge}>
            {user.statusLabel}
          </Badge>
        </div>
      ) : null}

      <header className={cx(s.profile, isDrawer && s.profileDrawer)}>
        <div className={s.identity}>
          <span className={s.avatar} aria-hidden>
            {user.monogram}
          </span>
          <div className={s.identityCopy}>
            <h3 className={s.title}>{user.name}</h3>
            <p className={s.email}>{user.email}</p>
            {isDrawer ? (
              <div className={s.metaRow}>
                <Badge tone={status} dot>
                  {user.statusLabel}
                </Badge>
                <Badge tone="blue">{user.typeLabel}</Badge>
              </div>
            ) : (
              <span className={s.typeBadge}>{user.typeLabel}</span>
            )}
          </div>
        </div>
      </header>

      {isDrawer ? (
        <div className={s.highlightBanner} aria-label="Active subscriptions">
          <div className={s.highlightCopy}>
            <span className={s.highlightEyebrow}>Active subscriptions</span>
            <span className={s.highlightValue}>{user.activeSubscriptionCount}</span>
          </div>
          <Icon name="card" size={28} className={s.highlightIcon} />
        </div>
      ) : null}

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
          <section className={s.section}>
            <h4 className={s.sectionTitle}>Account</h4>
            <div className={s.statGrid}>
              {overviewStats.map((stat) => (
                <div key={stat.label} className={s.statCard}>
                  <span className={s.statIconWrap} aria-hidden>
                    <Icon name={stat.icon} size={16} />
                  </span>
                  <p className={s.statLabel}>{stat.label}</p>
                  <p className={s.statValue}>{stat.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === 'Subscriptions' ? (
          <section className={s.section}>
            <h4 className={s.sectionTitle}>
              Subscriptions ({user.activeSubscriptionCount} active)
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
                    <div className={s.subCopy}>
                      <p className={s.subName}>{sub.creatorName}</p>
                      <p className={s.subMeta}>
                        @{sub.creatorHandle} · {sub.plan}
                      </p>
                      {sub.renewsLabel ? (
                        <p className={s.subRenews}>Renews {sub.renewsLabel}</p>
                      ) : null}
                    </div>
                    <Badge tone={subStatusTone(sub.status, sub.accessActive)} dot>
                      {sub.accessActive ? 'Active' : sub.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {tab === 'History' ? (
          <section className={s.section}>
            <h4 className={s.sectionTitle}>Admin history</h4>
            {history.length === 0 ? (
              <EmptyState
                icon="audit"
                title="No audit events"
                subtitle="Actions on this user will appear here."
              />
            ) : (
              <ul className={s.timeline}>
                {history.map((item, i) => (
                  <li key={`${item.label}-${item.at}-${i}`} className={s.timelineItem}>
                    <span className={s.timelineDot} aria-hidden />
                    <div className={s.timelineBody}>
                      <p className={s.timelineLabel}>{item.label}</p>
                      <p className={s.timelineAt}>{item.at}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      <footer className={s.footer}>
        <div className={s.footerPrimary}>
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
