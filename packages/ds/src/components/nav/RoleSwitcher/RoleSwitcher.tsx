import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon, type IconName } from '../../atoms/Icon/Icon';
import s from './RoleSwitcher.module.css';

export interface RoleSwitcherRole {
  id: string;
  label: string;
  tag: string;
  icon: IconName | (string & {});
  color: string;
}

export interface RoleSwitcherProps {
  role: string;
  roles: RoleSwitcherRole[];
  onChange: (id: string) => void;
  className?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  role,
  roles,
  onChange,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cur = roles.find((r) => r.id === role) ?? roles[0];
  if (!cur) return null;

  return (
    <div ref={ref} className={cx(s.wrap, className)}>
      <button
        type="button"
        className={s.pill}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={s.iconCircle} style={{ '--rs-color': cur.color } as React.CSSProperties}>
          <Icon name={cur.icon} size={13} />
        </span>
        <span className={s.name}>{cur.label}</span>
        <span className={s.tag}>{cur.tag}</span>
        <Icon name="arrow-up" size={12} className={cx(s.chev, open && s.chevOpen)} />
      </button>

      {open && (
        <div className={s.menu} role="listbox">
          <div className={s.menuTitle}>Switch role</div>
          {roles.map((r) => {
            const isCurrent = r.id === role;
            return (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={isCurrent}
                className={cx(s.option, isCurrent && s.optionCurrent)}
                onClick={() => {
                  onChange(r.id);
                  setOpen(false);
                }}
              >
                <span
                  className={s.iconCircle}
                  style={{ '--rs-color': r.color } as React.CSSProperties}
                >
                  <Icon name={r.icon} size={12} />
                </span>
                <span className={s.optionLabel}>{r.label}</span>
                <span className={s.tag}>{r.tag}</span>
                {isCurrent && <Icon name="check" size={13} className={s.check} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
