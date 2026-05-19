import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import { Field } from '../../forms/Field/Field';
import { Input } from '../../forms/Input/Input';
import { Segmented } from '../../nav/Segmented/Segmented';
import { InsightCard } from '../../surfaces/InsightCard/InsightCard';
import s from './StudioPlanConfigurator.module.css';

export interface StudioAccessRule {
  id: string;
  label: string;
  icon: IconName;
}

export interface StudioPlanConfiguratorProps {
  planName: string;
  price: string;
  interval: 'month' | 'year';
  features: string[];
  accessRules?: StudioAccessRule[];
  selectedAccess: string[];
  busy?: boolean;
  onPlanNameChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onIntervalChange: (v: 'month' | 'year') => void;
  onFeatureChange: (index: number, v: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
  onToggleAccess: (id: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  className?: string;
}

const DEFAULT_ACCESS: StudioAccessRule[] = [
  { id: 'articles', label: 'Articles', icon: 'feed' },
  { id: 'props', label: 'Prop Picks', icon: 'basketball' },
  { id: 'discord', label: 'Discord', icon: 'discord' },
  { id: 'videos', label: 'Videos', icon: 'play' },
];

const CHANGELOG = [
  { title: 'Updated VIP Elite Price', when: '2 hours ago', recent: true },
  { title: 'New Feature: Early Access', when: 'Yesterday, 11:30 PM', recent: false },
];

export function StudioPlanConfigurator({
  planName,
  price,
  interval,
  features,
  accessRules = DEFAULT_ACCESS,
  selectedAccess,
  busy,
  onPlanNameChange,
  onPriceChange,
  onIntervalChange,
  onFeatureChange,
  onAddFeature,
  onRemoveFeature,
  onToggleAccess,
  onDiscard,
  onSave,
  className,
}: StudioPlanConfiguratorProps) {
  return (
    <div className={cx(s.layout, className)}>
      <section className={s.main}>
        <header className={s.head}>
          <span className={s.headIcon} aria-hidden>
            <Icon name="plus" size={24} />
          </span>
          <div>
            <h3 className={s.title}>Configure New Plan</h3>
            <p className={s.sub}>Design a new value proposition for your audience.</p>
          </div>
        </header>

        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className={s.twoCol}>
            <Field label="Plan Name" htmlFor="studio-plan-name">
              <Input
                id="studio-plan-name"
                value={planName}
                onChange={(e) => onPlanNameChange(e.target.value)}
                placeholder="e.g. Early Bird Specials"
              />
            </Field>
            <Field label="Monthly Price ($)" htmlFor="studio-plan-price">
              <Input
                id="studio-plan-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder="49.99"
              />
            </Field>
          </div>

          <Field label="Billing Interval">
            <Segmented
              fullWidth
              size="md"
              ariaLabel="Billing interval"
              options={[
                { label: 'Monthly', value: 'month' },
                { label: 'Yearly (Save 20%)', value: 'year' },
              ]}
              value={interval}
              onChange={(v) => onIntervalChange(v as 'month' | 'year')}
            />
          </Field>

          <div>
            <div className={s.featureHead}>
              <span className={s.fieldLabel}>Plan Features</span>
              <button type="button" className={s.addFeature} onClick={onAddFeature}>
                + Add Feature
              </button>
            </div>
            <div className={s.featureList}>
              {features.map((feat, i) => (
                <div key={i} className={s.featureRow}>
                  <Icon name="list" size={16} aria-hidden />
                  <Input
                    value={feat}
                    onChange={(e) => onFeatureChange(i, e.target.value)}
                    aria-label={`Feature ${i + 1}`}
                  />
                  <button
                    type="button"
                    className={s.removeFeature}
                    aria-label="Remove feature"
                    onClick={() => onRemoveFeature(i)}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Field label="Content Access Rules">
            <div className={s.accessGrid} role="group" aria-label="Content access">
              {accessRules.map((rule) => {
                const on = selectedAccess.includes(rule.id);
                return (
                  <button
                    key={rule.id}
                    type="button"
                    className={cx(s.accessChip, on && s.accessOn)}
                    aria-pressed={on}
                    onClick={() => onToggleAccess(rule.id)}
                  >
                    <Icon name={rule.icon} size={22} />
                    <span className={s.accessLabel}>{rule.label}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <footer className={s.foot}>
            <Button type="button" variant="ghost" onClick={onDiscard} disabled={busy}>
              Discard
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              Save plan
            </Button>
          </footer>
        </form>
      </section>

      <aside className={s.aside}>
        <div className={s.preview}>
          <h4 className={s.previewTitle}>Preview: Web View</h4>
          <div className={s.previewFrame}>
            <div className={s.previewBar}>
              <span className={cx(s.previewLine, s.previewLineBar)} />
              <span className={s.previewDot} />
            </div>
            <div className={s.previewLineWide} />
            <div className={s.previewLineMid} />
            <div className={s.previewRows}>
              <span className={s.previewLine} />
              <span className={s.previewLine} />
              <span className={cx(s.previewLine, s.previewLinePartial)} />
            </div>
          </div>
        </div>

        <InsightCard
          tone="gold"
          title="Pro Tip"
          sub="Plans priced between $25 and $45 see the highest conversion rate for sports analysts on EdgePicks."
        />

        <div className={s.changelog}>
          <div className={s.changelogHead}>
            <Icon name="clock" size={18} />
            Change Log
          </div>
          <ul className={s.logList}>
            {CHANGELOG.map((entry) => (
              <li key={entry.title} className={s.logItem}>
                <span className={cx(s.logDot, !entry.recent && s.logDotMuted)} aria-hidden />
                <div>
                  <p className={s.logTitle}>{entry.title}</p>
                  <p className={s.logWhen}>{entry.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
