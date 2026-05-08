import React from 'react';
import { cx } from '../../../utils/cx';
import s from './FormDots.module.css';

export interface FormDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  last10: string;
}

function dotClass(c: string): string {
  if (c === 'W') return s.win;
  if (c === 'L') return s.loss;
  if (c === '-') return s.empty;
  return s.muted;
}

export const FormDots: React.FC<FormDotsProps> = ({ last10, className, ...rest }) => {
  return (
    <div className={cx(s.dots, className)} {...rest}>
      {last10.split('').map((c, i) => (
        <span key={i} className={cx(s.dot, dotClass(c))} />
      ))}
    </div>
  );
};
