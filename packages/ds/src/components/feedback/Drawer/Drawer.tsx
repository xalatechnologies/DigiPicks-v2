import React from 'react';
import { cx } from '../../../utils/cx';
import { activateFocusTrap } from '../../../utils/focusTrap';
import { Icon } from '../../atoms/Icon/Icon';
import s from './Drawer.module.css';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Accessible name when the visible title is omitted. */
  ariaLabel?: string;
  /** Close-only chrome — content supplies its own heading. */
  hideHeader?: boolean;
  /** Remove default body padding for full-bleed panel layouts. */
  flushBody?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  ariaLabel,
  hideHeader = false,
  flushBody = false,
  children,
  className,
}) => {
  const dialogRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let releaseTrap: (() => void) | undefined;
    if (dialogRef.current) {
      releaseTrap = activateFocusTrap(dialogRef.current as HTMLElement);
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      releaseTrap?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={s.overlay} onClick={onClose} role="presentation">
      <aside
        ref={dialogRef as React.RefObject<HTMLElement>}
        className={cx(s.drawer, className)}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={hideHeader ? s.headMinimal : s.head}>
          {!hideHeader && title ? <h2 className={s.title}>{title}</h2> : null}
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </header>
        <div className={cx(s.body, flushBody && s.bodyFlush)}>{children}</div>
      </aside>
    </div>
  );
};
