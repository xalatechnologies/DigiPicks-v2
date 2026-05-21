import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon, type IconName } from '../../atoms/Icon/Icon';
import s from './AdminCampaignTemplateGrid.module.css';

export interface AdminCampaignTemplate {
  id: string;
  title: string;
  category: string;
  icon: IconName;
}

export interface AdminCampaignTemplateGridProps {
  templates: AdminCampaignTemplate[];
  onSelect?: (id: string) => void;
  className?: string;
}

export function AdminCampaignTemplateGrid({
  templates,
  onSelect,
  className,
}: AdminCampaignTemplateGridProps) {
  return (
    <section className={cx(s.wrap, className)} aria-label="Campaign templates">
      <div className={s.head}>
        <h3 className={s.title}>Template library</h3>
      </div>
      <div className={s.grid}>
        {templates.map((tpl) => (
          <button key={tpl.id} type="button" className={s.card} onClick={() => onSelect?.(tpl.id)}>
            <span className={s.iconWrap} aria-hidden>
              <Icon name={tpl.icon} size={20} />
            </span>
            <p className={s.cardTitle}>{tpl.title}</p>
            <p className={s.cardCategory}>{tpl.category}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
