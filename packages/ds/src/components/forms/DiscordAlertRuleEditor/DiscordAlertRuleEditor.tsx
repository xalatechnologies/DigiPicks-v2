import React from 'react';
import { cx } from '../../../utils/cx';
import { Select } from '../Select/Select';
import { SwitchRow } from '../SwitchRow/SwitchRow';
import s from './DiscordAlertRuleEditor.module.css';

export type DiscordAlertConfidence = 'low' | 'medium' | 'high';

export interface DiscordAlertRules {
  newPick?: boolean;
  pickGraded?: boolean;
  oddsMovement?: boolean;
  creatorLive?: boolean;
  aiInsight?: boolean;
  announcement?: boolean;
  /** Floor for "newPick" / "aiInsight" deliveries — host enforces. */
  minConfidence?: DiscordAlertConfidence;
}

export interface DiscordAlertRuleEditorProps {
  value: DiscordAlertRules;
  onChange: (next: DiscordAlertRules) => void;
  disabled?: boolean;
  className?: string;
}

interface RuleDef {
  key: keyof Omit<DiscordAlertRules, 'minConfidence'>;
  label: string;
  sub: string;
}

const RULES: RuleDef[] = [
  {
    key: 'newPick',
    label: 'New picks',
    sub: 'Notify the channel when a creator publishes a new pick.',
  },
  {
    key: 'pickGraded',
    label: 'Pick graded',
    sub: 'Send the result (W/L/Push/Void) when grading completes.',
  },
  {
    key: 'oddsMovement',
    label: 'Odds movement',
    sub: 'Alert on significant line movement in tracked markets.',
  },
  {
    key: 'creatorLive',
    label: 'Creator goes live',
    sub: 'Drop a join link when a followed creator starts a stream.',
  },
  {
    key: 'aiInsight',
    label: 'AI insights',
    sub: 'Share AI-generated angle summaries — clearly labeled.',
  },
  {
    key: 'announcement',
    label: 'Announcements',
    sub: 'Manual broadcasts from creators or DigiPicks staff.',
  },
];

/**
 * List of toggleable Discord alert rules + a confidence floor select.
 * The host owns the value and merges patches via `onChange`.
 */
export function DiscordAlertRuleEditor({
  value,
  onChange,
  disabled,
  className,
}: DiscordAlertRuleEditorProps) {
  function patch<K extends keyof DiscordAlertRules>(key: K, next: DiscordAlertRules[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className={cx(s.editor, className)}>
      <ul className={s.list} role="list">
        {RULES.map((rule) => (
          <li key={rule.key} className={s.item}>
            <SwitchRow
              label={rule.label}
              sub={rule.sub}
              checked={Boolean(value[rule.key])}
              onChange={(next) => patch(rule.key, next)}
              disabled={disabled}
            />
          </li>
        ))}
      </ul>
      <div className={s.confidence}>
        <label className={s.confidenceLabel} htmlFor="discord-min-confidence">
          Minimum AI confidence
        </label>
        <Select
          id="discord-min-confidence"
          value={value.minConfidence ?? 'medium'}
          onChange={(e) => patch('minConfidence', e.target.value as DiscordAlertConfidence)}
          disabled={disabled}
        >
          <option value="low">Low — send all picks</option>
          <option value="medium">Medium — send vetted picks only</option>
          <option value="high">High — only top-rated picks</option>
        </Select>
      </div>
    </div>
  );
}
