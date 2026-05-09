import React from 'react';
import { Button, type ButtonProps } from '../Button/Button';
import { Icon } from '../Icon/Icon';

export interface FollowButtonProps {
  /** Whether the current user is already following. */
  following: boolean;
  /** Called with the next state when toggled. */
  onToggle: (next: boolean) => void | Promise<void>;
  size?: ButtonProps['size'];
  className?: string;
  /** Optional override label (e.g. "Saved" instead of "Following"). */
  followingLabel?: string;
  unfollowedLabel?: string;
  disabled?: boolean;
}

/**
 * Toggle button that flips between Follow / Following states. Visual
 * styling lives in Button — this is a thin wrapper that picks the right
 * variant + icon for each state. Caller owns the mutation call.
 */
export const FollowButton: React.FC<FollowButtonProps> = ({
  following,
  onToggle,
  size = 'sm',
  className,
  followingLabel = 'Following',
  unfollowedLabel = 'Follow',
  disabled,
}) => {
  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      size={size}
      className={className}
      disabled={disabled}
      onClick={() => onToggle(!following)}
    >
      <Icon name={following ? 'check' : 'plus'} size={13} />
      {following ? followingLabel : unfollowedLabel}
    </Button>
  );
};
