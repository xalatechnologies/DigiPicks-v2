import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Button } from '../../atoms/Button/Button';
import s from './LockedAnalysis.module.css';

export interface LockedAnalysisProps {
  creatorName?: string;
  onUnlock?: () => void;
  className?: string;
}

export function LockedAnalysis({ creatorName, onUnlock, className }: LockedAnalysisProps) {
  return (
    <div className={cx(s.locked, className)}>
      <div className={s.iconWrap}>
        <Icon name="lock" size={20} />
      </div>
      <div className={s.text}>
        <div className={s.title}>Premium analysis locked</div>
        <p className={s.body}>
          {creatorName
            ? `Unlock ${creatorName}'s full breakdown, model factors, and confidence rationale.`
            : 'Unlock the full breakdown, model factors, and confidence rationale.'}
        </p>
      </div>
      <Button variant="primary" size="md" onClick={onUnlock}>
        Unlock analysis
      </Button>
    </div>
  );
}
