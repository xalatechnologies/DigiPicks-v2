import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { Button, type ButtonProps } from '@digipicks/ds';
import { DEV_DEMO_UNLOCK, openCreatorStudioForDev } from './devDemoLogin';

export interface DevCreatorStudioButtonProps extends Pick<ButtonProps, 'variant' | 'size'> {
  label?: string;
  onDevError?: (message: string) => void;
}

/**
 * QA-only control — rendered only when `VITE_DEV_UNLOCK_DASHBOARD` is enabled.
 * Skips the `/auth` form and opens the creator studio for layout testing.
 */
export function DevCreatorStudioButton({
  variant = 'outline',
  size,
  label = 'Open creator studio (dev)',
  onDevError,
}: DevCreatorStudioButtonProps) {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);

  if (!DEV_DEMO_UNLOCK) return null;

  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading}
      iconLeft="grid"
      onClick={() =>
        void openCreatorStudioForDev({
          signIn,
          navigate,
          setLoading,
          setError: onDevError,
        })
      }
    >
      {loading ? 'Opening studio…' : label}
    </Button>
  );
}
