import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Container.module.css';

export type ContainerSize = 'narrow' | 'md' | 'lg' | 'xl' | '2xl';
export type ContainerPad = 'none' | 'page';

export interface ContainerProps {
  size?: ContainerSize;
  /** Vertical padding. `'none'` (default) keeps the existing flush layout
   *  for nested usages. `'page'` adds top + bottom breathing room so
   *  top-level route pages don't kiss the AppHeader. */
  pad?: ContainerPad;
  children?: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const sizeClass: Record<ContainerSize, string> = {
  narrow: 'sizeNarrow',
  md: 'sizeMd',
  lg: 'sizeLg',
  xl: 'sizeXl',
  '2xl': 'size2xl',
};

export const Container: React.FC<ContainerProps> = ({
  size = 'xl',
  pad = 'none',
  children,
  className,
  as,
}) => {
  const Comp = (as ?? 'div') as React.ElementType;
  return (
    <Comp className={cx(s.container, s[sizeClass[size]], pad === 'page' && s.padPage, className)}>
      {children}
    </Comp>
  );
};
