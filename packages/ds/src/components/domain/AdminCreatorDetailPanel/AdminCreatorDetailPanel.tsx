import React, { useEffect, useState } from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminCreatorDetailPanel.module.css';

export interface AdminCreatorDetailData {
  id: string;
  name: string;
  handle: string;
  avatarMono: string;
  avatarColor: string;
  nicheLine: string;
  statusLabel: string;
  verified: boolean;
  trustScoreLabel: string;
  winRateLabel: string;
  record: string;
  subscribersLabel: string;
  revenueLabel: string;
  joinedLabel: string;
}

export interface AdminCreatorHistoryItem {
  label: string;
  at: string;
}

export interface AdminCreatorDetailPanelProps {
  creator: AdminCreatorDetailData | null;
  loading?: boolean;
  history?: AdminCreatorHistoryItem[];
  busy?: boolean;
  error?: string | null;
  onViewProfile?: () => void;
  onModeration?: () => void;
  onToggleVerified?: () => void;
  onSuspend?: () => void;
  onActivate?: () => void;
  /** Sidebar column vs slide-over drawer body. */
  variant?: 'sidebar' | 'drawer';
  className?: string;
}

const TABS = ['Performance', 'History'] as const;
type DetailTab = (typeof TABS)[number];

export function AdminCreatorDetailPanel({
  creator,
  loading,
  history = [],
  busy,
  error,
  onViewProfile,
  onModeration,
  onToggleVerified,
  onSuspend,
  onActivate,
  variant = 'sidebar',
  className,
}: AdminCreatorDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>('Performance');
  const isDrawer = variant === 'drawer';
  const Root = isDrawer ? 'div' : 'aside';

  useEffect(() => {
    setTab('Performance');
  }, [creator?.id]);

  if (isDrawer && (loading || !creator)) {
    return (
      <div className={cx(s.wrapDrawer, className)}>
        <EmptyState icon="verified" title={loading ? 'Loading creator…' : 'Creator not found'} />
      </div>
    );
  }

  if (!isDrawer && !creator && !loading) {
    return (
      <aside className={cx(s.wrap, className)} aria-label="Creator details">
        <div className={s.empty}>
          <EmptyState
            icon="verified"
            title="Select a creator"
            subtitle="Choose a row to inspect performance, verification, and admin actions."
          />
        </div>
      </aside>
    );
  }

  if (!isDrawer && (loading || !creator)) {
    return (
      <aside className={cx(s.wrap, className)} aria-label="Creator details">
        <div className={s.empty}>
          <EmptyState icon="verified" title="Loading creator…" />
        </div>
      </aside>
    );
  }

  if (!creator) return null;

  const isSuspended = creator.statusLabel.toLowerCase() === 'suspended';

  return (
    <Root
      className={cx(isDrawer ? s.wrapDrawer : s.wrap, className)}
      aria-label={`Details for ${creator.name}`}
    >
      <div className={s.hero}>
        <div className={s.heroFade} aria-hidden />
        <span className={s.statusPill}>
          <span className={s.statusLive} aria-hidden />
          {creator.statusLabel}
        </span>
      </div>

      <div className={s.profile}>
        <div className={s.avatarWrap}>
          <Avatar mono={creator.avatarMono} color={creator.avatarColor} size={96} />
        </div>
        <div className={s.headRow}>
          <div>
            {!isDrawer ? <h3 className={s.title}>{creator.name}</h3> : null}
            <p className={s.sub}>
              @{creator.handle} · {creator.nicheLine}
            </p>
          </div>
          {onToggleVerified ? (
            <Button
              variant={creator.verified ? 'secondary' : 'primary'}
              size="sm"
              onClick={onToggleVerified}
              disabled={busy}
            >
              {creator.verified ? 'Unverify' : 'Verify'}
            </Button>
          ) : null}
        </div>
      </div>

      <div className={s.tabs} role="tablist" aria-label="Creator detail sections">
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
        {error ? <p className={s.error}>{error}</p> : null}

        {tab === 'Performance' ? (
          <>
            <section>
              <h4 className={s.sectionTitle}>Revenue & audience</h4>
              <div className={s.statGrid}>
                <div className={s.statCard}>
                  <p className={s.statLabel}>Est. monthly</p>
                  <p className={s.statValue}>{creator.revenueLabel}</p>
                </div>
                <div className={s.statCard}>
                  <p className={s.statLabel}>Active subs</p>
                  <p className={s.statValue}>{creator.subscribersLabel}</p>
                </div>
                <div className={s.statCard}>
                  <p className={s.statLabel}>Trust score</p>
                  <p className={s.statValue}>{creator.trustScoreLabel}</p>
                </div>
                <div className={s.statCard}>
                  <p className={s.statLabel}>Win rate</p>
                  <p className={s.statValue}>{creator.winRateLabel}</p>
                </div>
              </div>
            </section>
            <section>
              <h4 className={s.sectionTitle}>Track record</h4>
              <div className={s.recordRow}>
                <span className={s.recordChip}>{creator.record}</span>
                <span className={s.recordChip}>Joined {creator.joinedLabel}</span>
              </div>
            </section>
          </>
        ) : (
          <section>
            <h4 className={s.sectionTitle}>Admin history</h4>
            {history.length === 0 ? (
              <EmptyState
                icon="audit"
                title="No audit events"
                subtitle="Actions on this creator will appear here."
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
        )}
      </div>

      <footer className={s.footer}>
        <div className={s.footerRow}>
          {onViewProfile ? (
            <Button
              variant="secondary"
              size="sm"
              iconLeft="eye"
              onClick={onViewProfile}
              disabled={busy}
            >
              View profile
            </Button>
          ) : null}
          {onModeration ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeft="shield"
              onClick={onModeration}
              disabled={busy}
            >
              Moderation
            </Button>
          ) : null}
        </div>
        <div className={s.footerRow}>
          {isSuspended
            ? onActivate && (
                <Button variant="primary" size="sm" onClick={onActivate} disabled={busy}>
                  Activate account
                </Button>
              )
            : onSuspend && (
                <Button variant="outline" size="sm" onClick={onSuspend} disabled={busy}>
                  Suspend account
                </Button>
              )}
        </div>
      </footer>
    </Root>
  );
}
