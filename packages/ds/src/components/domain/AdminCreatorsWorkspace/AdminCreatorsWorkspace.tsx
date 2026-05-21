import React from 'react';
import { cx } from '../../../utils/cx';
import s from './AdminCreatorsWorkspace.module.css';

export interface AdminCreatorsWorkspaceProps {
  /** Filters + table stack. */
  directory: React.ReactNode;
  /** Sticky creator inspector panel. */
  inspector: React.ReactNode;
  className?: string;
}

/**
 * Split admin layout for creator directory (8+4 editorial rhythm).
 */
export function AdminCreatorsWorkspace({
  directory,
  inspector,
  className,
}: AdminCreatorsWorkspaceProps) {
  return (
    <div className={cx(s.workspace, className)}>
      <div className={s.directory}>{directory}</div>
      <div className={s.inspector}>{inspector}</div>
    </div>
  );
}
