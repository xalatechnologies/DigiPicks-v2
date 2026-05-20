import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AccountTopicChips.module.css';

export interface AccountTopicChipsProps {
  topics: string[];
  onSelect?: (topic: string) => void;
  className?: string;
}

export function AccountTopicChips({ topics, onSelect, className }: AccountTopicChipsProps) {
  if (topics.length === 0) return null;

  return (
    <div className={cx(s.wrap, className)}>
      {topics.map((topic) => (
        <button key={topic} type="button" className={s.chip} onClick={() => onSelect?.(topic)}>
          {topic}
        </button>
      ))}
    </div>
  );
}
