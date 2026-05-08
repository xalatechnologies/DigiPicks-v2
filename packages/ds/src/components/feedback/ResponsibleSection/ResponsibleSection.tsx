import React from 'react';
import { cx } from '../../../utils/cx';
import { Section } from '../../layout/Section/Section';
import { ResponsibleNote, type ResponsibleNoteProps } from '../ResponsibleNote/ResponsibleNote';
import s from './ResponsibleSection.module.css';

export interface ResponsibleSectionProps extends ResponsibleNoteProps {
  /** Disable scroll-triggered reveal (default: enabled). */
  noReveal?: boolean;
  /** Add bottom breathing room — used as the page-closer (default: true). */
  pad?: boolean;
  className?: string;
}

/**
 * Page-closing responsible-gambling note. Wraps `<ResponsibleNote />` in a
 * `<Section />` with consistent bottom spacing — used at the foot of every
 * public page so the call-out lands the same way everywhere.
 */
export const ResponsibleSection: React.FC<ResponsibleSectionProps> = ({
  noReveal,
  pad = true,
  className,
  ...noteProps
}) => {
  return (
    <Section noReveal={noReveal} className={cx(pad && s.pad, className)}>
      <ResponsibleNote {...noteProps} />
    </Section>
  );
};
