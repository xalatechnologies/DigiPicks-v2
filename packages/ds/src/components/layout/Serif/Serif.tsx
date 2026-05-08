import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Serif.module.css';

export interface SerifProps {
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export const Serif: React.FC<SerifProps> = ({ children, as, className }) => {
  const Comp = (as ?? 'span') as React.ElementType;
  return <Comp className={cx(s.serif, className)}>{children}</Comp>;
};
