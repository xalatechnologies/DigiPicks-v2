import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../Icon/Icon';
import type { ButtonProps, ButtonSize } from '../Button/Button';
import s from './DiscordConnectButton.module.css';

/** Discord-branded action button used by the M20 integration surfaces.
 *
 * Mirrors `Button`'s API minus `variant` (the variant is fixed: Discord
 * blurple). Two visual states are driven by props:
 *   - `connected={true}` flips the label to "Disconnect" and the surface
 *     to the muted variant.
 *   - `loading={true}` keeps the user-supplied label but disables the
 *     button and shows a small pulsing dot.
 *
 * Internal use of the Discord brand tokens (`--discord-blurple`,
 * `--discord-blurple-hover`) is intentional — these are theme-stable
 * identity colors per CLAUDE.md §3 and live in `tokens.css`.
 */
export interface DiscordConnectButtonProps extends Omit<ButtonProps, 'variant' | 'iconLeft'> {
  /** When true, shows a pulsing in-flight indicator and disables clicks. */
  loading?: boolean;
  /** When true, swaps the label to "Disconnect" + uses the muted style. */
  connected?: boolean;
  /** Optional override for the connected label. */
  connectedLabel?: React.ReactNode;
  /** Optional override for the disconnected label. */
  connectLabel?: React.ReactNode;
}

const ICON_SIZE: Record<ButtonSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
};

export const DiscordConnectButton = React.forwardRef<HTMLButtonElement, DiscordConnectButtonProps>(
  function DiscordConnectButton(
    {
      size = 'md',
      iconOnly,
      block,
      iconRight,
      loading,
      connected,
      connectLabel = 'Connect Discord',
      connectedLabel = 'Disconnect',
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) {
    const cls = cx(
      s.btn,
      connected ? s.connected : s.connect,
      size !== 'md' && s[size],
      iconOnly && s.icon,
      block && s.block,
      loading && s.loading,
      className,
    );
    const iconSize = ICON_SIZE[size];
    const label = children ?? (connected ? connectedLabel : connectLabel);

    return (
      <button
        ref={ref}
        type="button"
        className={cls}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <span className={s.dot} aria-hidden="true" />
        ) : (
          <Icon name="discord" size={iconSize} />
        )}
        {!iconOnly && label}
        {iconRight && <Icon name={iconRight} size={iconSize} />}
      </button>
    );
  },
);

DiscordConnectButton.displayName = 'DiscordConnectButton';
