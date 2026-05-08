import React from 'react';
import { Badge, type BadgeTone } from '../Badge/Badge';

export type Grade = 'win' | 'loss' | 'push' | 'void' | 'disputed' | 'pending' | (string & {});

export interface GradeBadgeProps {
  grade?: Grade;
  className?: string;
}

const GRADE_MAP: Record<string, { tone: BadgeTone; label: string }> = {
  win: { tone: 'green', label: 'Win' },
  loss: { tone: 'red', label: 'Loss' },
  push: { tone: 'mute', label: 'Push' },
  void: { tone: 'mute', label: 'Void' },
  disputed: { tone: 'violet', label: 'Disputed' },
  pending: { tone: 'amber', label: 'Pending' },
};

export const GradeBadge: React.FC<GradeBadgeProps> = ({ grade, className }) => {
  const key = !grade ? 'pending' : grade;
  const entry = GRADE_MAP[key];
  if (!entry) {
    return (
      <Badge tone="mute" className={className}>
        {grade}
      </Badge>
    );
  }
  return (
    <Badge tone={entry.tone} dot className={className}>
      {entry.label}
    </Badge>
  );
};
