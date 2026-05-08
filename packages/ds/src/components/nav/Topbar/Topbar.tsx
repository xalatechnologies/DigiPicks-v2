import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './Topbar.module.css';

export interface TopbarProps {
  title: string;
  crumb?: React.ReactNode;
  actions?: React.ReactNode;
  search?: string;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  crumb,
  actions,
  search,
  className,
}) => {
  return (
    <header className={cx(s.topbar, className)}>
      <div className={s.titleBlock}>
        {crumb && <div className={s.crumb}>{crumb}</div>}
        <h2 className={s.title}>{title}</h2>
      </div>
      <div className={s.spacer} />
      {search && (
        <div className={s.search}>
          <Icon name="search" size={14} className={s.searchIcon} />
          <input
            className={s.searchInput}
            placeholder={search}
            aria-label="Search"
          />
        </div>
      )}
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
};
