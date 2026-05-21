import React from 'react';
import { cx } from '../../../utils/cx';
import s from './OddsIntelWorkspace.module.css';

export interface OddsIntelWorkspaceProps {
  rail: React.ReactNode;
  panel: React.ReactNode;
  className?: string;
}

/** Event slate (rail) + active odds comparison (panel). */
export function OddsIntelWorkspace({ rail, panel, className }: OddsIntelWorkspaceProps) {
  return (
    <div className={cx(s.workspace, className)}>
      <div className={s.rail}>{rail}</div>
      <div className={s.panel}>{panel}</div>
    </div>
  );
}
