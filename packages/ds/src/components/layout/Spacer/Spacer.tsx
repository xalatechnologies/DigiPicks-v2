import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Spacer.module.css';

export interface SpacerProps {
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({ className }) => {
  return <div className={cx(s.spacer, className)} aria-hidden="true" />;
};
