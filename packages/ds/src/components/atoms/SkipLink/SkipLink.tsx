import React from 'react';
import { cx } from '../../../utils/cx';
import s from './SkipLink.module.css';

export interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Anchor target id, defaults to `main-content`. */
  targetId?: string;
  /** Visible label, defaults to "Skip to main content". */
  label?: string;
}

/**
 * WCAG 2.4.1 / 2.4.3 — Skip-to-main link. Visually hidden until focused
 * (first Tab on a fresh page lands here), then jumps the user past nav
 * chrome straight into the page's primary content.
 *
 * Layouts must render this as the first focusable element and add
 * `id="main-content"` (or the supplied targetId) on their `<main>` element.
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  label = 'Skip to main content',
  className,
  ...rest
}) => {
  return (
    <a href={`#${targetId}`} className={cx(s.skip, className)} {...rest}>
      {label}
    </a>
  );
};
