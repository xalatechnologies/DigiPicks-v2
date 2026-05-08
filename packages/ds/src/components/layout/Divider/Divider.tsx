import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Divider.module.css';

export interface DividerProps {
  strong?: boolean;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ strong, className }) => {
  return <hr className={cx(s.divider, strong && s.strong, className)} />;
};
