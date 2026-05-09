import React from 'react';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Segmented } from '../../nav/Segmented/Segmented';
import s from './EventForm.module.css';

export type EventFormVisibility = 'public' | 'premium' | 'private';

export interface EventFormValue {
  sport: string;
  league: string;
  home: string;
  away: string;
  /** Display string e.g. "9:00 PM CET" — exactly what surfaces on the card. */
  time: string;
  /** Unix ms timestamp of event start. */
  startsAt: number;
  /** Optional override for the rendered title; defaults to "home vs away". */
  title: string;
  sourceUrl: string;
  visibility: EventFormVisibility;
}

export interface EventFormProps {
  value: EventFormValue;
  onChange: (next: EventFormValue) => void;
  sports: ReadonlyArray<string>;
  disabled?: boolean;
}

const VISIBILITY_OPTIONS = [
  { value: 'public' as const, label: 'Public' },
  { value: 'premium' as const, label: 'Premium' },
  { value: 'private' as const, label: 'Private' },
];

function toLocalInputValue(ms: number): string {
  if (!ms || Number.isNaN(ms)) return '';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(input: string): number {
  if (!input) return 0;
  const t = new Date(input).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function EventForm({ value, onChange, sports, disabled }: EventFormProps) {
  const set = <K extends keyof EventFormValue>(key: K, next: EventFormValue[K]) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className={s.form}>
      <div className={s.row2}>
        <Field label="Sport" required htmlFor="evf-sport">
          <Select
            id="evf-sport"
            value={value.sport}
            onChange={(e) => set('sport', e.target.value)}
            disabled={disabled}
          >
            <option value="" disabled>
              Choose sport…
            </option>
            {sports.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="League / competition" required htmlFor="evf-league">
          <Input
            id="evf-league"
            value={value.league}
            onChange={(e) => set('league', e.target.value)}
            placeholder="e.g. Champions League, IPL"
            disabled={disabled}
          />
        </Field>
      </div>

      <div className={s.row2}>
        <Field label="Home / first participant" required htmlFor="evf-home">
          <Input
            id="evf-home"
            value={value.home}
            onChange={(e) => set('home', e.target.value)}
            placeholder="Liverpool"
            disabled={disabled}
          />
        </Field>

        <Field label="Away / second participant" required htmlFor="evf-away">
          <Input
            id="evf-away"
            value={value.away}
            onChange={(e) => set('away', e.target.value)}
            placeholder="Chelsea"
            disabled={disabled}
          />
        </Field>
      </div>

      <div className={s.row2}>
        <Field
          label="Starts at"
          required
          htmlFor="evf-starts"
          help="Local time. Stored as UTC."
        >
          <Input
            id="evf-starts"
            type="datetime-local"
            value={toLocalInputValue(value.startsAt)}
            onChange={(e) => set('startsAt', fromLocalInputValue(e.target.value))}
            disabled={disabled}
          />
        </Field>

        <Field
          label="Display time"
          required
          htmlFor="evf-time"
          help="What shows on the card, e.g. 9:00 PM CET."
        >
          <Input
            id="evf-time"
            value={value.time}
            onChange={(e) => set('time', e.target.value)}
            placeholder="9:00 PM CET"
            disabled={disabled}
          />
        </Field>
      </div>

      <Field
        label="Title"
        htmlFor="evf-title"
        help="Optional. Defaults to “home vs away”."
      >
        <Input
          id="evf-title"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={`${value.home || 'Home'} vs ${value.away || 'Away'}`}
          disabled={disabled}
        />
      </Field>

      <Field
        label="Source URL"
        htmlFor="evf-source"
        help="Optional. Link to fixture page, federation listing, or stream."
      >
        <Input
          id="evf-source"
          type="url"
          value={value.sourceUrl}
          onChange={(e) => set('sourceUrl', e.target.value)}
          placeholder="https://"
          disabled={disabled}
        />
      </Field>

      <Field
        label="Visibility"
        help="Public events surface on /events. Premium and Private gate access by subscription / direct link (rolling out in Phase 3)."
      >
        <Segmented
          value={value.visibility}
          onChange={(next) => set('visibility', next as EventFormVisibility)}
          options={VISIBILITY_OPTIONS}
        />
      </Field>
    </div>
  );
}
