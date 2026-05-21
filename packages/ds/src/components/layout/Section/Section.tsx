import React from 'react';
import { motion } from 'framer-motion';
import { cx } from '../../../utils/cx';
import s from './Section.module.css';

export type SectionTone = 'default' | 'elevated' | 'inset';

export interface SectionProps {
  title?: string;
  eyebrow?: string;
  sub?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  /** Surface band — elevated full-bleed or inset panel on canvas. */
  tone?: SectionTone;
  /** Disable scroll-triggered reveal animation. Default: enabled. */
  noReveal?: boolean;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  eyebrow,
  sub,
  action,
  tone = 'default',
  noReveal,
  children,
  className,
}) => {
  const hasHeader = title || eyebrow || sub || action;
  const toneClass = tone === 'elevated' ? s.elevated : tone === 'inset' ? s.inset : undefined;

  const inner = (
    <div className={s.inner}>
      {hasHeader && (
        <motion.header
          className={s.head}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div className={s.headText}>
            {eyebrow && <div className={s.eyebrow}>{eyebrow}</div>}
            {title && <h2 className={s.title}>{title}</h2>}
            {sub && <p className={s.sub}>{sub}</p>}
          </div>
          {action && <div className={s.action}>{action}</div>}
        </motion.header>
      )}
      <div className={s.body}>{children}</div>
    </div>
  );

  const sectionClass = cx(s.section, toneClass, className);

  if (noReveal) {
    return <section className={sectionClass}>{inner}</section>;
  }

  return (
    <motion.section
      className={sectionClass}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {inner}
    </motion.section>
  );
};
