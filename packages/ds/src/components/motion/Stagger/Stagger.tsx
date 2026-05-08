import React from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

export interface StaggerProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'initial' | 'whileInView' | 'variants'> {
  /** Stagger delay between each child (in seconds). Default 0.08. */
  staggerChildren?: number;
  /** Initial delay before the first child animates (in seconds). */
  delayChildren?: number;
  /** Scroll-trigger viewport amount. Default 0.15. */
  amount?: number;
  once?: boolean;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

const containerVariants: Variants = {
  hidden: {},
  show: {},
};

export function Stagger({
  staggerChildren = 0.08,
  delayChildren = 0,
  amount = 0.15,
  once = true,
  as,
  className,
  children,
  ...rest
}: StaggerProps) {
  const Comp: any = as ? (motion as any)[as as string] ?? motion.div : motion.div;
  const variants: Variants = {
    ...containerVariants,
    show: {
      transition: { staggerChildren, delayChildren },
    },
  };
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={variants}
      {...rest}
    >
      {children}
    </Comp>
  );
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
  },
};

export interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  as?: React.ElementType;
  children?: React.ReactNode;
}

export function StaggerItem({ as, children, ...rest }: StaggerItemProps) {
  const Comp: any = as ? (motion as any)[as as string] ?? motion.div : motion.div;
  return (
    <Comp variants={itemVariants} {...rest}>
      {children}
    </Comp>
  );
}
