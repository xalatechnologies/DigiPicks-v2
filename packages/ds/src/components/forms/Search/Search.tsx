import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import { Kbd } from '../../atoms/Kbd/Kbd';
import s from './Search.module.css';

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  kbd?: string;
}

export const Search = React.forwardRef<HTMLInputElement, SearchProps>(function Search(
  { kbd, className, placeholder = 'Search', type = 'search', ...rest },
  ref,
) {
  return (
    <div className={cx(s.search, className)}>
      <Icon name="search" size={16} className={s.icon} />
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={s.input}
        {...rest}
      />
      {kbd && (
        <span className={s.kbd}>
          <Kbd>{kbd}</Kbd>
        </span>
      )}
    </div>
  );
});
