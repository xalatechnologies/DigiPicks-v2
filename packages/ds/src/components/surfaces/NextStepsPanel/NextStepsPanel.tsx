import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './NextStepsPanel.module.css';

export interface NextStepsItem {
  id: string | number;
  label: string;
  done?: boolean;
  onClick?: () => void;
}

export interface NextStepsPanelProps {
  title: string;
  sub?: string;
  items: NextStepsItem[];
  className?: string;
}

export function NextStepsPanel({ title, sub, items, className }: NextStepsPanelProps) {
  return (
    <article className={cx(s.panel, className)}>
      <div className={s.content}>
        <h2 className={s.title}>{title}</h2>
        {sub ? <p className={s.sub}>{sub}</p> : null}
        <ul className={s.list}>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={s.row}
                onClick={item.onClick}
                disabled={!item.onClick}
              >
                <span className={cx(s.check, item.done && s.checkDone)}>
                  {item.done ? <Icon name="check" size={12} /> : null}
                </span>
                <span className={cx(s.label, item.done && s.labelDone)}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
