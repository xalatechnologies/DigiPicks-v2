import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Table.module.css';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  card?: boolean;
}

export function Table({ card, className, children, ...rest }: TableProps) {
  const tableEl = (
    <table className={cx(s.tbl, className)} {...rest}>
      {children}
    </table>
  );
  if (!card) return tableEl;
  return <div className={s.card}>{tableEl}</div>;
}

export interface TheadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export function THead({ className, children, ...rest }: TheadProps) {
  return (
    <thead className={cx(s.thead, className)} {...rest}>
      {children}
    </thead>
  );
}

export interface TbodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
export function TBody({ className, children, ...rest }: TbodyProps) {
  return (
    <tbody className={cx(s.tbody, className)} {...rest}>
      {children}
    </tbody>
  );
}

export interface TrProps extends React.HTMLAttributes<HTMLTableRowElement> {}
export function Tr({ className, children, ...rest }: TrProps) {
  return (
    <tr className={cx(s.tr, className)} {...rest}>
      {children}
    </tr>
  );
}

export interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
  actions?: boolean;
}
export function Th({ numeric, actions, className, children, ...rest }: ThProps) {
  return (
    <th
      className={cx(s.th, numeric && s.num, actions && s.actions, className)}
      {...rest}
    >
      {children}
    </th>
  );
}

export interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
  actions?: boolean;
}
export function Td({ numeric, actions, className, children, ...rest }: TdProps) {
  return (
    <td
      className={cx(s.td, numeric && s.num, actions && s.actions, className)}
      {...rest}
    >
      {children}
    </td>
  );
}
