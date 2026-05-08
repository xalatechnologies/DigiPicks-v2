import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cx } from '../../../utils/cx';
import s from './Grid.module.css';

export type GridGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12;

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: GridGap;
  dense?: boolean;
  /** Stagger child entry animations on scroll. Children are wrapped in motion items. Default: true. */
  stagger?: boolean;
  /** Time between each child's entry animation (seconds). */
  staggerDelay?: number;
  as?: React.ElementType;
}

const GAP: Record<GridGap, string> = {
  0: '0',
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  7: 'var(--space-7)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
  },
};

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid(
  {
    cols = 3,
    gap = 5,
    dense,
    stagger = true,
    staggerDelay = 0.08,
    as: Comp = 'div',
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const cssVars = {
    '--grid-cols': cols,
    '--grid-gap': GAP[gap],
    ...style,
  } as React.CSSProperties;

  if (!stagger) {
    return (
      <Comp
        ref={ref}
        className={cx(s.grid, dense && s.dense, className)}
        style={cssVars}
        {...rest}
      >
        {children}
      </Comp>
    );
  }

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: staggerDelay },
    },
  };

  return (
    <motion.div
      ref={ref as React.ForwardedRef<HTMLDivElement>}
      className={cx(s.grid, dense && s.dense, className)}
      style={cssVars}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={containerVariants}
      {...(rest as Record<string, unknown>)}
    >
      {React.Children.map(children, (child, i) =>
        React.isValidElement(child) ? (
          <motion.div key={(child as any).key ?? i} variants={itemVariants}>
            {child}
          </motion.div>
        ) : (
          child
        ),
      )}
    </motion.div>
  );
});
