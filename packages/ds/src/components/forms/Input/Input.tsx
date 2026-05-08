import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...rest },
  ref,
) {
  return <input ref={ref} type={type} className={cx(s.input, className)} {...rest} />;
});
