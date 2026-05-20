import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, InsightCard, Button } from '@digipicks/ds';
import { canDevAutoSignInCreator } from '../lib/devDemoLogin';
import { STUDIO } from '../lib/studioRoutes';

export interface StudioDevHintProps {
  message: string;
}

/** Inline dev-preview notice for studio pages (composes DS only). */
export function StudioDevHint({ message }: StudioDevHintProps) {
  const navigate = useNavigate();
  const canSignIn = canDevAutoSignInCreator();

  return (
    <InsightCard
      tone="amber"
      icon={<Icon name="help" size={22} />}
      title="Dev preview"
      sub={message}
      action={
        canSignIn ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/auth?next=${encodeURIComponent(STUDIO.overview)}`)}
          >
            Sign in
          </Button>
        ) : undefined
      }
    />
  );
}
