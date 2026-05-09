import React from 'react';
import { cx } from '../../../utils/cx';
import { Badge } from '../../atoms/Badge/Badge';
import { Icon } from '../../atoms/Icon/Icon';
import { ConfidenceGauge } from '../../atoms/ConfidenceGauge/ConfidenceGauge';
import s from './AISummary.module.css';

export interface AISummaryProps {
  summary: string;
  /** 0–100 AI confidence. */
  confidence?: number;
  /** Long-form reasoning, shown when expanded. */
  reasoning?: string;
  /** Optional model label, e.g. "claude-haiku-4-5". */
  model?: string;
  className?: string;
}

export const AISummary: React.FC<AISummaryProps> = ({
  summary,
  confidence,
  reasoning,
  model,
  className,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasReasoning = Boolean(reasoning && reasoning.trim().length > 0);

  return (
    <div className={cx(s.card, className)}>
      <div className={s.head}>
        <Badge tone="violet" icon={<Icon name="sparkles" size={11} />}>
          AI insight
        </Badge>
        {model && <span className={s.model}>{model}</span>}
      </div>

      <p className={s.summary}>{summary}</p>

      {confidence !== undefined && (
        <ConfidenceGauge value={confidence} label="AI confidence" />
      )}

      {hasReasoning && (
        <button
          type="button"
          className={s.toggle}
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
        >
          {expanded ? 'Hide reasoning' : 'Show reasoning'}
          <Icon name={expanded ? 'arrow-up' : 'arrow-down'} size={11} />
        </button>
      )}

      {hasReasoning && expanded && (
        <p className={s.reasoning}>{reasoning}</p>
      )}
    </div>
  );
};
