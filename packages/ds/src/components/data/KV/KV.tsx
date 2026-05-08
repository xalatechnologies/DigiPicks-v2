import React from 'react';
import { cx } from '../../../utils/cx';
import s from './KV.module.css';

export interface KVProps {
  k: React.ReactNode;
  v: React.ReactNode;
  mono?: boolean;
  className?: string;
}

export function KV({ k, v, mono, className }: KVProps) {
  return (
    <div className={cx(s.kv, className)}>
      <span className={s.k}>{k}</span>
      <span className={cx(s.v, mono && s.mono)}>{v}</span>
    </div>
  );
}
