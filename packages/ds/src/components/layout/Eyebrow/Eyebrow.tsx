import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Eyebrow.module.css';

export interface EyebrowProps {
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export const Eyebrow: React.FC<EyebrowProps> = ({ children, as, className }) => {
  const Comp = (as ?? 'span') as React.ElementType;
  return <Comp className={cx(s.eyebrow, className)}>{children}</Comp>;
};
