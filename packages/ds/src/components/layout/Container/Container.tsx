import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Container.module.css';

export type ContainerSize = 'narrow' | 'md' | 'lg' | 'xl' | '2xl';

export interface ContainerProps {
  size?: ContainerSize;
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
  children,
  className,
  as,
}) => {
  const Comp = (as ?? 'div') as React.ElementType;
  return <Comp className={cx(s.container, s[sizeClass[size]], className)}>{children}</Comp>;
};
