import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

export interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'initial' | 'animate' | 'whileInView' | 'variants'> {
  /** Direction the element animates from. Default 'up' (slides up from below). */
  direction?: RevealDirection;
  /** Distance in px to translate from. Default 24. */
  distance?: number;
  /** Delay in seconds before the animation starts. */
  delay?: number;
  /** Duration in seconds. Default 0.6. */
  duration?: number;
  /** Scroll-trigger viewport amount (0..1). Default 0.2. */
  amount?: number;
  /** Whether the animation should re-run when re-entering. Default false. */
  once?: boolean;
  /** Use `as` to render a different element (e.g. 'section', 'article'). */
  as?: React.ElementType;
  children: React.ReactNode;
}

const offsets: Record<RevealDirection, { x: number; y: number }> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  none: { x: 0, y: 0 },
};

export function Reveal({
  direction = 'up',
  distance = 24,
  delay = 0,
  duration = 0.6,
  amount = 0.2,
  once = true,
  as,
  children,
  ...rest
}: RevealProps) {
  const offset = offsets[direction];
  const Comp: any = as ? (motion as any)[as as string] ?? motion.div : motion.div;
  return (
    <Comp
      initial={{ opacity: 0, x: offset.x * distance, y: offset.y * distance }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.22, 0.61, 0.36, 1],
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
