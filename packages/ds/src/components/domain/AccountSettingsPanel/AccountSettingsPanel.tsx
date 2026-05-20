import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import type { IconName } from '../../atoms/Icon/Icon';
import s from './AccountSettingsPanel.module.css';

export interface AccountSettingsPanelProps {
  title: string;
  icon?: IconName;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AccountSettingsPanel({
  title,
  icon,
  children,
  footer,
  className,
}: AccountSettingsPanelProps) {
  return (
    <section className={cx(s.panel, className)}>
      <div className={s.head}>
        <h2 className={s.title}>{title}</h2>
        {icon ? <Icon name={icon} size={24} className={s.headIcon} aria-hidden="true" /> : null}
      </div>
      <div className={s.body}>{children}</div>
      {footer ? <footer className={s.foot}>{footer}</footer> : null}
    </section>
  );
}
