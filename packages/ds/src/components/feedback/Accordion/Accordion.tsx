import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Accordion.module.css';

export interface AccordionProps {
  children?: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ children, className }) => {
  return <div className={cx(s.accordion, className)}>{children}</div>;
};
