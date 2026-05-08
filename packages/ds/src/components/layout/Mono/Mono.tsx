import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Mono.module.css';

export interface MonoProps {
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export const Mono: React.FC<MonoProps> = ({ children, as, className }) => {
  const Comp = (as ?? 'span') as React.ElementType;
  return <Comp className={cx(s.mono, className)}>{children}</Comp>;
};
