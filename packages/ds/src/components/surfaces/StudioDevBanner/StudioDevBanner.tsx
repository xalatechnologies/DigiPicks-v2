import React from 'react';
import { cx } from '../../../utils/cx';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Mono } from '../../layout/Mono/Mono';
import s from './StudioDevBanner.module.css';

export interface StudioDevBannerProps {
  onExit?: () => void;
  onSignIn?: () => void;
  className?: string;
}

export function StudioDevBanner({ onExit, onSignIn, className }: StudioDevBannerProps) {
  return (
    <div className={cx(s.banner, className)} role="status">
      <Badge tone="amber">Dev preview</Badge>
      <p className={s.copy}>
        Sample metrics and tables. Set <Mono>VITE_DEV_CREATOR_EMAIL</Mono> and{' '}
        <Mono>VITE_DEV_CREATOR_PASSWORD</Mono> in <Mono>.env.local</Mono> for live Convex data.
      </p>
      <div className={s.actions}>
        {onSignIn ? (
          <Button variant="secondary" size="sm" onClick={onSignIn}>
            Sign in
          </Button>
        ) : null}
        {onExit ? (
          <Button variant="ghost" size="sm" onClick={onExit}>
            Exit preview
          </Button>
        ) : null}
      </div>
    </div>
  );
}
