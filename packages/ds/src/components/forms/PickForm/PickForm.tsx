import React from 'react';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { TextArea } from '../TextArea/TextArea';
import { Segmented } from '../../nav/Segmented/Segmented';
import s from './PickForm.module.css';

export type PickFormAccess = 'free' | 'premium' | 'vip';
export type PickFormConfidence = 'Low' | 'Medium' | 'High';

export interface PickFormValue {
  title: string;
  sport: string;
  league: string;
  eventName: string;
  eventTime: string;
  market: string;
  selection: string;
  odds: string;
  units: string;
  confidence: PickFormConfidence;
  body: string;
  access: PickFormAccess;
}

export interface PickFormProps {
  value: PickFormValue;
  onChange: (next: PickFormValue) => void;
  sports: ReadonlyArray<string>;
  markets: ReadonlyArray<string>;
  accessOptions: ReadonlyArray<{ label: string; value: PickFormAccess }>;
  confidenceOptions: ReadonlyArray<{ label: string; value: PickFormConfidence }>;
  disabled?: boolean;
}

function PickFormSection({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={s.section} aria-labelledby={`pick-${eyebrow.replace(/\s+/g, '-')}`}>
      <div className={s.sectionHead}>
        <span className={s.sectionEyebrow} id={`pick-${eyebrow.replace(/\s+/g, '-')}`}>
          {eyebrow}
        </span>
        <h3 className={s.sectionTitle}>{title}</h3>
        {sub ? <p className={s.sectionSub}>{sub}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PickForm({
  value,
  onChange,
  sports,
  markets,
  accessOptions,
  confidenceOptions,
  disabled,
}: PickFormProps) {
  const set = <K extends keyof PickFormValue>(key: K, next: PickFormValue[K]) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className={s.form}>
      <PickFormSection
        eyebrow="Step 1"
        title="Headline"
        sub="A short title subscribers scan in their feed."
      >
        <Field label="Pick title" required htmlFor="pf-title">
          <Input
            id="pf-title"
            value={value.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Arsenal vs Chelsea — BTTS Yes"
            disabled={disabled}
          />
        </Field>
      </PickFormSection>

      <PickFormSection
        eyebrow="Step 2"
        title="Matchup"
        sub="Sport, competition, and when the event kicks off."
      >
        <div className={s.row2}>
          <Field label="Sport" required htmlFor="pf-sport">
            <Select
              id="pf-sport"
              value={value.sport}
              onChange={(e) => set('sport', e.target.value)}
              disabled={disabled}
            >
              {sports.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="League / competition" htmlFor="pf-league">
            <Input
              id="pf-league"
              value={value.league}
              onChange={(e) => set('league', e.target.value)}
              placeholder="e.g. Premier League, IPL"
              disabled={disabled}
            />
          </Field>
        </div>

        <div className={s.row2}>
          <Field label="Event" required htmlFor="pf-event">
            <Input
              id="pf-event"
              value={value.eventName}
              onChange={(e) => set('eventName', e.target.value)}
              placeholder="Liverpool vs Chelsea"
              disabled={disabled}
            />
          </Field>

          <Field
            label="Kickoff / display time"
            htmlFor="pf-time"
            help="Shown on the pick card — use your subscribers' timezone."
          >
            <Input
              id="pf-time"
              value={value.eventTime}
              onChange={(e) => set('eventTime', e.target.value)}
              placeholder="Saturday 3:00 PM ET"
              disabled={disabled}
            />
          </Field>
        </div>
      </PickFormSection>

      <PickFormSection
        eyebrow="Step 3"
        title="The wager"
        sub="Market, line, price, and how you're sizing the play."
      >
        <div className={s.row2}>
          <Field label="Market" required htmlFor="pf-market">
            <Select
              id="pf-market"
              value={value.market}
              onChange={(e) => set('market', e.target.value)}
              disabled={disabled}
            >
              {markets.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Confidence" htmlFor="pf-confidence">
            <Select
              id="pf-confidence"
              value={value.confidence}
              onChange={(e) => set('confidence', e.target.value as PickFormConfidence)}
              disabled={disabled}
            >
              {confidenceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className={s.row3}>
          <Field label="Selection" required htmlFor="pf-selection">
            <Input
              id="pf-selection"
              value={value.selection}
              onChange={(e) => set('selection', e.target.value)}
              placeholder="Over 2.5"
              disabled={disabled}
            />
          </Field>

          <Field label="Odds" htmlFor="pf-odds">
            <Input
              id="pf-odds"
              value={value.odds}
              onChange={(e) => set('odds', e.target.value)}
              placeholder="-110"
              disabled={disabled}
            />
          </Field>

          <Field label="Units" htmlFor="pf-units">
            <Input
              id="pf-units"
              value={value.units}
              onChange={(e) => set('units', e.target.value)}
              placeholder="1u"
              disabled={disabled}
            />
          </Field>
        </div>
      </PickFormSection>

      <PickFormSection
        eyebrow="Step 4"
        title="Analysis"
        sub="Reasoning subscribers read after unlocking — be specific on form, injuries, and line value."
      >
        <Field label="Write-up" help="Supports plain text; line breaks are preserved.">
          <TextArea
            rows={8}
            value={value.body}
            onChange={(e) => set('body', e.target.value)}
            placeholder="Walk through your read: matchup context, key numbers, and why this line still has value…"
            disabled={disabled}
          />
        </Field>
      </PickFormSection>

      <PickFormSection
        eyebrow="Step 5"
        title="Who can see this"
        sub="Free picks are public. Premium and VIP require an active plan."
      >
        <Field label="Access tier">
          <Segmented
            options={[...accessOptions]}
            value={value.access}
            onChange={(v) => set('access', v as PickFormAccess)}
            ariaLabel="Pick access level"
          />
        </Field>
      </PickFormSection>
    </div>
  );
}
