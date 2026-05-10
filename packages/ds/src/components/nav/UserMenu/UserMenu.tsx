import React from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import { Icon, type IconName } from '../../atoms/Icon/Icon';
import s from './UserMenu.module.css';

export interface UserMenuItem {
  /** Visible label. Required unless `divider`. */
  label?: string;
  /** Optional supporting line under the label (e.g. "12 unread"). */
  hint?: React.ReactNode;
  icon?: IconName;
  /** Click handler — wired via the host so the host can navigate / sign out
   *  / open a modal etc. The menu closes after the handler runs. */
  onClick?: () => void;
  /** When true, renders a thin horizontal rule and ignores the other fields. */
  divider?: boolean;
  /** Renders the row in the danger tone (red text + icon). Used for sign out. */
  destructive?: boolean;
  /** Optional trailing element — useful for badges (e.g. unread count). */
  trailing?: React.ReactNode;
}

export interface UserMenuProps {
  /** Identity shown at the top of the dropdown. */
  user: {
    name?: string;
    email?: string;
    mono?: string;
    color?: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  /** Menu rows in display order. Use `{ divider: true }` to insert a rule. */
  items: UserMenuItem[];
  /** Side the dropdown opens on. Defaults to `right` so the menu doesn't
   *  spill off-screen when the trigger is on the right edge of a header. */
  align?: 'left' | 'right';
  /** Optional aria-label for the trigger button. */
  triggerLabel?: string;
  className?: string;
}

/**
 * Avatar-triggered dropdown menu used in the public header. Composes
 * Avatar (atom) for the trigger + a positioned panel for the items.
 * Closes on outside click and on item click. Pure presentation — the
 * host wires every item's `onClick` to navigation / sign out.
 */
export function UserMenu({
  user,
  items,
  align = 'right',
  triggerLabel = 'Account menu',
  className,
}: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number; right: number } | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // Recompute the panel's screen-coordinate position whenever the menu
  // opens, the viewport resizes, or the document scrolls. Since the
  // panel is portaled to <body> we use `position: fixed` and pin to the
  // trigger's bounding rect — this side-steps every nested-overflow /
  // z-index issue (AppLayout's grid + main `position: relative` etc).
  React.useEffect(() => {
    if (!open) return;
    function update() {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      setPos({
        top: r.bottom + 8,
        left: r.left,
        right: window.innerWidth - r.right,
      });
    }
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const initial = user.mono ?? (user.name ? user.name.charAt(0).toUpperCase() : 'U');
  const color = user.color ?? 'var(--primary)';

  const panel =
    open && pos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className={cx(s.panel, align === 'left' ? s.alignLeft : s.alignRight)}
            role="menu"
            style={
              align === 'left'
                ? ({ top: pos.top, left: pos.left } as React.CSSProperties)
                : ({ top: pos.top, right: pos.right } as React.CSSProperties)
            }
          >
            <div className={s.header}>
              <Avatar mono={initial} color={color} size={36} />
              <div className={s.who}>
                <div className={s.name}>
                  <span className={s.nameText}>{user.name ?? 'Signed in'}</span>
                  {user.verified && <VerifiedMark size={11} />}
                </div>
                {user.email && <div className={s.email}>{user.email}</div>}
              </div>
            </div>

            <ul className={s.list}>
              {items.map((item, i) => {
                if (item.divider) {
                  return <li key={`d-${i}`} className={s.divider} aria-hidden="true" />;
                }
                return (
                  <li key={`i-${i}-${item.label ?? ''}`}>
                    <button
                      type="button"
                      role="menuitem"
                      className={cx(s.item, item.destructive && s.itemDanger)}
                      onClick={() => {
                        setOpen(false);
                        item.onClick?.();
                      }}
                    >
                      {item.icon && <Icon name={item.icon} size={14} className={s.itemIcon} />}
                      <span className={s.itemBody}>
                        <span className={s.itemLabel}>{item.label}</span>
                        {item.hint && <span className={s.itemHint}>{item.hint}</span>}
                      </span>
                      {item.trailing && <span className={s.itemTrailing}>{item.trailing}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={cx(s.root, className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cx(
          s.trigger,
          user.name ? s.triggerExpanded : s.triggerCompact,
          open && s.triggerOpen,
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar mono={initial} color={color} size={28} />
        {user.name && (
          <span className={s.triggerText}>
            <span className={s.triggerName}>{user.name}</span>
          </span>
        )}
        {user.name && (
          <Icon
            name="chevron-down"
            size={12}
            className={cx(s.triggerChev, open && s.triggerChevOpen)}
          />
        )}
      </button>
      {panel}
    </div>
  );
}
