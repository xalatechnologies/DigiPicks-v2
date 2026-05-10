import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Stack.module.css';

export type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackMaxWidth = 'narrow' | 'sub' | 'prose' | 'wide';

export interface StackProps {
  gap?: StackGap;
  /** Cross-axis alignment. Defaults to CSS default (stretch). Set to
   *  `end` to right-align inside a `Row between` right column when
   *  children have different widths (e.g. small Badge above wider Button). */
  align?: StackAlign;
  /** Reading-width cap. Used on hero title columns so a long subtitle
   *  doesn't stretch the column and push the action group onto a wrap.
   *  - narrow: 40ch
   *  - sub:    50ch
   *  - prose:  60ch
   *  - wide:   72ch */
  maxWidth?: StackMaxWidth;
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

const gapClass = (g: StackGap) => `gap${g}`;
const alignClass: Record<StackAlign, string> = {
  start: 'alignStart',
  center: 'alignCenter',
  end: 'alignEnd',
  stretch: 'alignStretch',
};
const maxWidthClass: Record<StackMaxWidth, string> = {
  narrow: 'mwNarrow',
  sub: 'mwSub',
  prose: 'mwProse',
  wide: 'mwWide',
};

export const Stack: React.FC<StackProps> = ({
  gap = 3,
  align,
  maxWidth,
  children,
  as,
  className,
}) => {
  const Comp = (as ?? 'div') as React.ElementType;
  return (
    <Comp
      className={cx(
        s.stack,
        s[gapClass(gap)],
        align && s[alignClass[align]],
        maxWidth && s[maxWidthClass[maxWidth]],
        className,
      )}
    >
      {children}
    </Comp>
  );
};
