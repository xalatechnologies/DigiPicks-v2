import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './AccordionItem.module.css';

export interface AccordionItemProps {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultOpen,
  className,
}) => {
  const [open, setOpen] = React.useState(!!defaultOpen);

  return (
    <div className={cx(s.item, open && s.open, className)}>
      <button
        type="button"
        className={s.header}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={s.title}>{title}</span>
        <Icon name="chevron-down" size={16} className={s.chev} />
      </button>
      {open && <div className={s.body}>{children}</div>}
    </div>
  );
};
