import React, { useEffect, useState } from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
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

function statusTone(label: string): 'green' | 'red' | 'amber' | 'mute' {
  const key = label.toLowerCase();
  if (key.includes('suspend') || key.includes('ban')) return 'red';
  if (key.includes('pending') || key.includes('review')) return 'amber';
  if (key.includes('active') || key.includes('live')) return 'green';
  return 'mute';
}

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

  const isSuspended = creator.statusLabel.toLowerCase().includes('suspend');
  const status = statusTone(creator.statusLabel);

  const performanceStats = [
    { icon: 'dollar' as const, label: 'Est. monthly', value: creator.revenueLabel },
    { icon: 'users' as const, label: 'Active subs', value: creator.subscribersLabel },
    { icon: 'chart' as const, label: 'Win rate', value: creator.winRateLabel },
  ];

  return (
    <Root
      className={cx(isDrawer ? s.wrapDrawer : s.wrap, className)}
      aria-label={`Details for ${creator.name}`}
    >
      {!isDrawer ? (
        <div className={s.hero}>
          <div className={s.heroFade} aria-hidden />
          <Badge tone={status} dot className={s.statusBadge}>
            {creator.statusLabel}
          </Badge>
        </div>
      ) : null}

      <header className={cx(s.profile, isDrawer && s.profileDrawer)}>
        <div className={s.identity}>
          <Avatar mono={creator.avatarMono} color={creator.avatarColor} size={isDrawer ? 72 : 96} />
          <div className={s.identityCopy}>
            <div className={s.nameRow}>
              <h3 className={s.title}>{creator.name}</h3>
              {creator.verified ? <VerifiedMark size={18} /> : null}
            </div>
            <p className={s.handle}>@{creator.handle}</p>
            <p className={s.niche}>{creator.nicheLine}</p>
            {isDrawer ? (
              <div className={s.metaRow}>
                <Badge tone={status} dot>
                  {creator.statusLabel}
                </Badge>
                {creator.verified ? (
                  <Badge tone="blue" icon={<Icon name="verified" size={12} />}>
                    Verified
                  </Badge>
                ) : (
                  <Badge tone="mute">Not verified</Badge>
                )}
              </div>
            ) : null}
          </div>
        </div>
        {onToggleVerified ? (
          <Button
            variant={creator.verified ? 'secondary' : 'primary'}
            size="sm"
            className={s.verifyBtn}
            onClick={onToggleVerified}
            disabled={busy}
          >
            {creator.verified ? 'Unverify' : 'Verify'}
          </Button>
        ) : null}
      </header>

      {isDrawer ? (
        <div className={s.trustBanner} aria-label="Trust score">
          <div className={s.trustCopy}>
            <span className={s.trustEyebrow}>Trust score</span>
            <span className={s.trustValue}>{creator.trustScoreLabel}</span>
          </div>
          <Icon name="shield" size={28} className={s.trustIcon} />
        </div>
      ) : null}

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
            <section className={s.section}>
              <h4 className={s.sectionTitle}>Revenue & audience</h4>
              <div className={s.statGrid}>
                {performanceStats.map((stat) => (
                  <div key={stat.label} className={s.statCard}>
                    <span className={s.statIconWrap} aria-hidden>
                      <Icon name={stat.icon} size={16} />
                    </span>
                    <p className={s.statLabel}>{stat.label}</p>
                    <p className={s.statValue}>{stat.value}</p>
                  </div>
                ))}
                {!isDrawer ? (
                  <div className={s.statCard}>
                    <span className={s.statIconWrap} aria-hidden>
                      <Icon name="shield" size={16} />
                    </span>
                    <p className={s.statLabel}>Trust score</p>
                    <p className={s.statValue}>{creator.trustScoreLabel}</p>
                  </div>
                ) : null}
              </div>
            </section>
            <section className={s.section}>
              <h4 className={s.sectionTitle}>Track record</h4>
              <div className={s.recordStrip}>
                <div className={s.recordBlock}>
                  <span className={s.recordLabel}>W · L · P</span>
                  <span className={s.recordValue}>{creator.record}</span>
                </div>
                <div className={s.recordDivider} aria-hidden />
                <div className={s.recordBlock}>
                  <span className={s.recordLabel}>Member since</span>
                  <span className={s.recordValue}>{creator.joinedLabel}</span>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className={s.section}>
            <h4 className={s.sectionTitle}>Admin history</h4>
            {history.length === 0 ? (
              <EmptyState
                icon="audit"
                title="No audit events"
                subtitle="Actions on this creator will appear here."
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
        )}
      </div>

      <footer className={s.footer}>
        <div className={s.footerPrimary}>
          {onViewProfile ? (
            <Button
              variant="primary"
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
              variant="secondary"
              size="sm"
              iconLeft="shield"
              onClick={onModeration}
              disabled={busy}
            >
              Moderation
            </Button>
          ) : null}
        </div>
        {isSuspended
          ? onActivate && (
              <Button variant="outline" size="sm" block onClick={onActivate} disabled={busy}>
                Activate account
              </Button>
            )
          : onSuspend && (
              <Button
                variant="ghost"
                size="sm"
                block
                className={s.suspendBtn}
                onClick={onSuspend}
                disabled={busy}
              >
                Suspend account
              </Button>
            )}
      </footer>
    </Root>
  );
}
