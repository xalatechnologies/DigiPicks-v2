import React, { useState } from 'react';
import { cx } from '../../../utils/cx';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Field } from '../../forms/Field/Field';
import { Input } from '../../forms/Input/Input';
import { Select } from '../../forms/Select/Select';
import { TextArea } from '../../forms/TextArea/TextArea';
import { Tabs } from '../../nav/Tabs/Tabs';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './AdminUserEntitlementsPanel.module.css';

export type AdminEntitlementStatus = 'active' | 'expired' | 'revoked';
export type AdminEntitlementSource = 'subscription' | 'manual_override' | 'promo' | 'trial';
export type AdminResourceType = 'subscription' | 'pick_feed' | 'telegram' | 'discord' | 'channel';

export interface AdminEntitlementRow {
  id: string;
  kind: 'subscription' | 'override';
  resourceType: AdminResourceType;
  resourceId: string;
  creatorName: string;
  creatorHandle: string;
  status: AdminEntitlementStatus;
  source: AdminEntitlementSource;
  validUntil?: number;
  reason?: string;
  canRevoke: boolean;
}

export interface AdminSubscriptionRow {
  id: string;
  creatorName: string;
  creatorHandle: string;
  plan: string;
  status: string;
  accessActive: boolean;
  renewsAt?: number;
}

export interface AdminAccessLogRow {
  id: string;
  resourceId: string;
  result: 'allowed' | 'denied';
  reason?: string;
  createdAt: number;
}

export interface AdminCreatorOption {
  id: string;
  name: string;
  handle: string;
}

export interface AdminUserEntitlementsProfile {
  name: string;
  email: string;
  monogram: string;
  typeLabel: string;
  statusLabel: string;
  statusTone: 'green' | 'amber' | 'red' | 'mute';
}

export type AdminGrantResourceType = 'pick_feed' | 'telegram' | 'discord' | 'channel';

export interface AdminUserEntitlementsGrantForm {
  creatorId: string;
  resourceType: AdminGrantResourceType;
  resourceId: string;
  reason: string;
}

export interface AdminUserEntitlementsPanelProps {
  loading?: boolean;
  profile: AdminUserEntitlementsProfile;
  subscriptions: AdminSubscriptionRow[];
  entitlements: AdminEntitlementRow[];
  accessLogs: AdminAccessLogRow[];
  creators: AdminCreatorOption[];
  grant: AdminUserEntitlementsGrantForm;
  onGrantChange: (patch: Partial<AdminUserEntitlementsGrantForm>) => void;
  onGrant: () => void;
  onRevoke?: (entitlementId: string) => void;
  busy?: boolean;
  error?: string | null;
  formatDate: (ms: number) => string;
  className?: string;
}

const TABS = [
  { label: 'Active access', value: 'access' },
  { label: 'Grant override', value: 'grant' },
  { label: 'Access logs', value: 'logs' },
];

const RESOURCE_OPTIONS: { value: AdminGrantResourceType; label: string }[] = [
  { value: 'pick_feed', label: 'Pick feed' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'discord', label: 'Discord' },
  { value: 'channel', label: 'Channel' },
];

function sourceLabel(source: AdminEntitlementSource): string {
  switch (source) {
    case 'subscription':
      return 'Subscription';
    case 'manual_override':
      return 'Manual override';
    case 'promo':
      return 'Promo';
    case 'trial':
      return 'Trial';
    default:
      return source;
  }
}

function statusTone(status: AdminEntitlementStatus): 'green' | 'red' | 'mute' {
  if (status === 'active') return 'green';
  if (status === 'revoked') return 'red';
  return 'mute';
}

function resourceLabel(type: AdminResourceType): string {
  switch (type) {
    case 'pick_feed':
      return 'Pick feed';
    case 'telegram':
      return 'Telegram';
    case 'discord':
      return 'Discord';
    case 'channel':
      return 'Channel';
    case 'subscription':
      return 'Subscription';
    default:
      return type;
  }
}

export function AdminUserEntitlementsPanel({
  loading,
  profile,
  subscriptions,
  entitlements,
  accessLogs,
  creators,
  grant,
  onGrantChange,
  onGrant,
  onRevoke,
  busy,
  error,
  formatDate,
  className,
}: AdminUserEntitlementsPanelProps) {
  const [tab, setTab] = useState('access');

  const activeEntitlements = entitlements.filter((e) => e.status === 'active');
  const canSubmitGrant = Boolean(grant.creatorId && grant.resourceId.trim());

  function handleCreatorChange(creatorId: string) {
    const creator = creators.find((c) => c.id === creatorId);
    const nextResourceId =
      grant.resourceId.trim() || (creator ? `pick_feed:${creator.handle}` : '');
    onGrantChange({ creatorId, resourceId: nextResourceId });
  }

  if (loading) {
    return (
      <div className={cx(s.wrap, className)}>
        <EmptyState icon="lock" title="Loading entitlements…" />
      </div>
    );
  }

  return (
    <div className={cx(s.wrap, className)}>
      <div className={s.profile}>
        <div className={s.identity}>
          <span className={s.avatar} aria-hidden>
            {profile.monogram}
          </span>
          <div className={s.copy}>
            <h2 className={s.name}>{profile.name}</h2>
            <p className={s.email}>{profile.email}</p>
            <div className={s.meta}>
              <Badge tone={profile.statusTone} dot>
                {profile.statusLabel}
              </Badge>
              <Badge tone="blue">{profile.typeLabel}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} ariaLabel="Entitlements sections" />

      <div className={s.body}>
        {tab === 'access' ? (
          <div className={s.grid}>
            <section className={s.panel}>
              <h3 className={s.panelTitle}>Subscriptions</h3>
              <p className={s.panelSub}>
                Stripe-backed access. Active subscriptions grant pick-feed entitlements
                automatically.
              </p>
              {subscriptions.length === 0 ? (
                <EmptyState
                  icon="card"
                  title="No subscriptions"
                  subtitle="This user is not subscribed to any creators."
                />
              ) : (
                <ul className={s.list}>
                  {subscriptions.map((sub) => (
                    <li key={sub.id} className={s.row}>
                      <div className={s.rowCopy}>
                        <p className={s.rowTitle}>{sub.creatorName}</p>
                        <p className={s.rowMeta}>
                          @{sub.creatorHandle} · {sub.plan} · {sub.status}
                        </p>
                      </div>
                      <div className={s.rowAside}>
                        <Badge tone={sub.accessActive ? 'green' : 'amber'} dot>
                          {sub.accessActive ? 'Active' : sub.status}
                        </Badge>
                        {sub.renewsAt ? (
                          <span className={s.rowMeta}>Renews {formatDate(sub.renewsAt)}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={s.panel}>
              <h3 className={s.panelTitle}>Entitlements</h3>
              <p className={s.panelSub}>
                {activeEntitlements.length} active grant
                {activeEntitlements.length === 1 ? '' : 's'} including overrides.
              </p>
              {entitlements.length === 0 ? (
                <EmptyState
                  icon="lock"
                  title="No entitlements"
                  subtitle="Grant a manual override from the Grant override tab."
                />
              ) : (
                <ul className={s.list}>
                  {entitlements.map((row) => (
                    <li key={row.id} className={s.row}>
                      <div className={s.rowCopy}>
                        <p className={s.rowTitle}>
                          {row.creatorName} <span className={s.rowMeta}>@{row.creatorHandle}</span>
                        </p>
                        <p className={s.rowMeta}>
                          {resourceLabel(row.resourceType)} · {row.resourceId}
                        </p>
                        {row.reason ? <p className={s.rowMeta}>Note: {row.reason}</p> : null}
                      </div>
                      <div className={s.rowAside}>
                        <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                        <Badge tone="mute">{sourceLabel(row.source)}</Badge>
                        {row.validUntil ? (
                          <span className={s.rowMeta}>Until {formatDate(row.validUntil)}</span>
                        ) : null}
                        {row.canRevoke && onRevoke ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => onRevoke(row.id)}
                          >
                            Revoke
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}

        {tab === 'grant' ? (
          <section className={s.panel}>
            <h3 className={s.panelTitle}>Grant manual override</h3>
            <p className={s.panelSub}>
              Issue pick-feed or channel access outside Stripe. Changes are audited and appear
              immediately in the access log.
            </p>
            <div className={s.grantForm}>
              <Field label="Creator" help="Who receives the entitlement.">
                <Select
                  value={grant.creatorId}
                  onChange={(e) => handleCreatorChange(e.target.value)}
                >
                  <option value="">Select creator…</option>
                  {creators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (@{c.handle})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Resource type">
                <Select
                  value={grant.resourceType}
                  onChange={(e) =>
                    onGrantChange({
                      resourceType: e.target.value as AdminGrantResourceType,
                    })
                  }
                >
                  {RESOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Resource ID"
                help="Stable identifier for this access grant (e.g. pick_feed:handle)."
              >
                <Input
                  value={grant.resourceId}
                  onChange={(e) => onGrantChange({ resourceId: e.target.value })}
                  placeholder="pick_feed:creator-handle"
                />
              </Field>
              <Field label="Reason" help="Stored on the entitlement and audit log.">
                <TextArea
                  rows={3}
                  value={grant.reason}
                  onChange={(e) => onGrantChange({ reason: e.target.value })}
                  placeholder="Why this override is being granted…"
                  maxLength={500}
                />
              </Field>
              {error ? <p className={s.error}>{error}</p> : null}
              <Button
                variant="primary"
                iconLeft="lock"
                disabled={busy || !canSubmitGrant}
                onClick={onGrant}
              >
                Grant access
              </Button>
            </div>
          </section>
        ) : null}

        {tab === 'logs' ? (
          <section className={s.panel}>
            <h3 className={s.panelTitle}>Access logs</h3>
            <p className={s.panelSub}>Recent allow/deny decisions for this user.</p>
            {accessLogs.length === 0 ? (
              <EmptyState
                icon="audit"
                title="No access logs"
                subtitle="Access checks will appear here when this user hits gated content."
              />
            ) : (
              <ul className={s.timeline}>
                {accessLogs.map((log) => (
                  <li key={log.id} className={s.timelineItem}>
                    <span
                      className={cx(
                        s.timelineDot,
                        log.result === 'allowed' ? s.timelineDotAllowed : s.timelineDotDenied,
                      )}
                      aria-hidden
                    />
                    <div className={s.timelineBody}>
                      <p className={s.timelineLabel}>
                        {log.result === 'allowed' ? 'Allowed' : 'Denied'} · {log.resourceId}
                      </p>
                      {log.reason ? <p className={s.timelineAt}>{log.reason}</p> : null}
                      <p className={s.timelineAt}>{formatDate(log.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
