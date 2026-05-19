import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon, type IconName } from '../../atoms/Icon/Icon';
import s from './NavItem.module.css';

export interface NavItemProps {
  label: string;
  sub?: string;
  icon: IconName | (string & {});
  active?: boolean;
  badge?: React.ReactNode;
  /** Hide trailing chevron (studio sidebar). */
  hideChevron?: boolean;
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const NavItem: React.FC<NavItemProps> = ({
  label,
  sub,
  icon,
  active,
  badge,
  hideChevron,
  as,
  className,
  ...rest
}) => {
  const Comp = (as ?? 'a') as React.ElementType;
  return (
    <Comp className={cx(s.item, active && s.active, className)} {...rest}>
      <span className={s.icon}>
        <Icon name={icon} size={16} />
      </span>
      <span className={s.text}>
        <span className={s.label}>{label}</span>
        {sub && <span className={s.sub}>{sub}</span>}
      </span>
      {badge !== undefined && badge !== null && <span className={s.badge}>{badge}</span>}
      {!hideChevron ? <Icon name="chevron-right" size={14} className={s.chev} /> : null}
    </Comp>
  );
};
