import React from 'react';
import { cx } from '../../../utils/cx';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { ConfidenceGauge } from '../../atoms/ConfidenceGauge/ConfidenceGauge';
import s from './AIAssistPanel.module.css';

export interface AISuggestion {
  summary: string;
  confidence: number;
  reasoning: string;
}

export interface AIAssistPanelProps {
  /** Current suggestion, or null when none requested yet. */
  suggestion: AISuggestion | null;
  /** Disable the trigger while the action is mid-flight. */
  busy?: boolean;
  /** Called when the user clicks "Suggest" — host fires the action. */
  onSuggest: () => void | Promise<void>;
  /** Called when the user clicks "Use suggestion" to accept and pre-fill. */
  onAccept?: (suggestion: AISuggestion) => void;
  /** Called when the user dismisses the panel. */
  onDismiss?: () => void;
  /** Optional error message to surface (action threw / rate-limited). */
  error?: string | null;
  className?: string;
}

/**
 * Inline AI co-write surface for the CreatePick form. Renders one of:
 *   - empty state with "Suggest" CTA
 *   - busy spinner state
 *   - populated suggestion with accept / dismiss controls
 *
 * The panel is purely presentational — the consumer owns the action call,
 * rate-limiting, and error display so the AI side stays testable.
 */
export const AIAssistPanel: React.FC<AIAssistPanelProps> = ({
  suggestion,
  busy,
  onSuggest,
  onAccept,
  onDismiss,
  error,
  className,
}) => {
  if (!suggestion) {
    return (
      <div className={cx(s.panel, className)}>
        <div className={s.head}>
          <Icon name="sparkles" size={16} />
          <span className={s.headTitle}>AI co-write</span>
        </div>
        <p className={s.copy}>
          Sketch the bet — AI drafts a tight summary, confidence score, and
          reasoning you can edit before publishing.
        </p>
        {error && <div className={s.error}>{error}</div>}
        <Button variant="primary" size="sm" onClick={onSuggest} disabled={busy}>
          <Icon name="sparkles" size={13} />
          {busy ? 'Thinking…' : 'Suggest'}
        </Button>
      </div>
    );
  }

  return (
    <div className={cx(s.panel, s.populated, className)}>
      <div className={s.head}>
        <Icon name="sparkles" size={16} />
        <span className={s.headTitle}>Suggested by AI</span>
        <ConfidenceGauge value={suggestion.confidence} label="AI confidence" />
      </div>
      <p className={s.summary}>{suggestion.summary}</p>
      <p className={s.reasoning}>{suggestion.reasoning}</p>
      {error && <div className={s.error}>{error}</div>}
      <div className={s.actions}>
        {onAccept && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAccept(suggestion)}
            disabled={busy}
          >
            <Icon name="check" size={13} />
            Use suggestion
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onSuggest} disabled={busy}>
          <Icon name="sparkles" size={13} />
          Re-roll
        </Button>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss} disabled={busy}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
};
