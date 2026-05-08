import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Muted.module.css';

export interface MutedProps {
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export const Muted: React.FC<MutedProps> = ({ children, as, className }) => {
  const Comp = (as ?? 'span') as React.ElementType;
  return <Comp className={cx(s.muted, className)}>{children}</Comp>;
};
