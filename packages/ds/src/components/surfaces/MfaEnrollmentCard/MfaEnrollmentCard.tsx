import React from 'react';
import { cx } from '../../../utils/cx';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { Mono } from '../../layout/Mono/Mono';
import { Muted } from '../../layout/Muted/Muted';
import { Input } from '../../forms/Input/Input';
import { Field } from '../../forms/Field/Field';
import s from './MfaEnrollmentCard.module.css';

export type MfaState = 'idle' | 'enrolling' | 'enrolled';

export interface MfaEnrollmentSecrets {
  secret: string;
  otpauthUri: string;
  recoveryCodes: string[];
}

export interface MfaEnrollmentCardProps {
  state: MfaState;
  /** Provided when state === 'enrolling'. */
  secrets?: MfaEnrollmentSecrets;
  /** Number of recovery codes still unused — drives the warning copy. */
  remainingRecoveryCodes?: number;
  /** Last time the user verified a code (ms epoch). */
  lastVerifiedAt?: number | null;
  busy?: boolean;
  error?: string | null;

  onStartEnroll: () => void | Promise<void>;
  onConfirmEnroll: (code: string) => void | Promise<void>;
  onDisable: () => void | Promise<void>;
  onVerify?: (code: string) => void | Promise<void>;

  className?: string;
}

/**
 * Settings → Security panel for MFA. Three-state machine:
 *   idle      — never enrolled. Single "Enable MFA" CTA.
 *   enrolling — secret + otpauth URI shown, recovery codes displayed once,
 *               user submits a verification code to finalize.
 *   enrolled  — confirmation + recovery code count + disable affordance.
 *
 * The component is presentational; consumer owns the calls into
 * api.mfa.enrollStart / verifySetup / disable.
 */
export const MfaEnrollmentCard: React.FC<MfaEnrollmentCardProps> = ({
  state,
  secrets,
  remainingRecoveryCodes,
  lastVerifiedAt,
  busy,
  error,
  onStartEnroll,
  onConfirmEnroll,
  onDisable,
  onVerify,
  className,
}) => {
  const [code, setCode] = React.useState('');

  if (state === 'idle') {
    return (
      <div className={cx(s.card, className)}>
        <header className={s.head}>
          <Icon name="shield" size={18} />
          <span className={s.title}>Two-factor authentication</span>
        </header>
        <p className={s.copy}>
          Add a TOTP code from Google Authenticator, 1Password, or Authy.
          Required for sensitive creator + admin actions once enrolled.
        </p>
        {error && <div className={s.error}>{error}</div>}
        <Button variant="primary" size="sm" onClick={onStartEnroll} disabled={busy}>
          <Icon name="key" size={13} />
          {busy ? 'Generating…' : 'Enable MFA'}
        </Button>
      </div>
    );
  }

  if (state === 'enrolling' && secrets) {
    return (
      <div className={cx(s.card, className)}>
        <header className={s.head}>
          <Icon name="shield" size={18} />
          <span className={s.title}>Finish enrollment</span>
        </header>
        <p className={s.copy}>
          Scan this URI with your authenticator, then enter the 6-digit code
          to confirm. Your recovery codes are shown once below — copy them
          to a safe place before you finish.
        </p>

        <Field label="otpauth:// URI">
          <Mono className={s.mono}>{secrets.otpauthUri}</Mono>
        </Field>

        <Field label="Manual secret">
          <Mono className={s.mono}>{secrets.secret}</Mono>
        </Field>

        <Field label="Recovery codes (single-use)">
          <div className={s.codes}>
            {secrets.recoveryCodes.map((rc) => (
              <Mono key={rc} className={s.code}>
                {rc}
              </Mono>
            ))}
          </div>
        </Field>

        <Field label="6-digit code from your app">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
          />
        </Field>

        {error && <div className={s.error}>{error}</div>}

        <div className={s.actions}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConfirmEnroll(code)}
            disabled={busy || code.length !== 6}
          >
            <Icon name="check" size={13} />
            Confirm enrollment
          </Button>
        </div>
      </div>
    );
  }

  // enrolled
  const verifiedRel = lastVerifiedAt
    ? `${Math.max(1, Math.round((Date.now() - lastVerifiedAt) / 60000))}m ago`
    : '—';
  const recoveryWarning =
    typeof remainingRecoveryCodes === 'number' && remainingRecoveryCodes <= 3;

  return (
    <div className={cx(s.card, s.enrolled, className)}>
      <header className={s.head}>
        <Icon name="shield" size={18} />
        <span className={s.title}>MFA enabled</span>
      </header>
      <p className={s.copy}>
        Two-factor authentication is on. Sensitive actions require a fresh
        code every 15 minutes.
      </p>

      <div className={s.stats}>
        <div className={s.stat}>
          <Muted>Last verified</Muted>
          <span>{verifiedRel}</span>
        </div>
        <div className={s.stat}>
          <Muted>Recovery codes</Muted>
          <span>{remainingRecoveryCodes ?? 0} remaining</span>
        </div>
      </div>

      {recoveryWarning && (
        <div className={s.warn}>
          <Icon name="flag" size={13} />
          You're running low on recovery codes — regenerate them after your
          next sign-in.
        </div>
      )}

      {onVerify && (
        <>
          <Field label="Verify a code (refresh freshness)">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </Field>
          <div className={s.actions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onVerify(code)}
              disabled={busy || code.length !== 6}
            >
              Verify
            </Button>
          </div>
        </>
      )}

      {error && <div className={s.error}>{error}</div>}

      <div className={s.actions}>
        <Button variant="danger" size="sm" onClick={onDisable} disabled={busy}>
          Disable MFA
        </Button>
      </div>
    </div>
  );
};
