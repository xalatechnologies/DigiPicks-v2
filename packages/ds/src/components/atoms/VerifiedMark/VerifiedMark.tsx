import React from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../Icon/Icon';
import s from './VerifiedMark.module.css';

export interface VerifiedMarkProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  size?: number;
}

export const VerifiedMark: React.FC<VerifiedMarkProps> = ({ size = 13, className, ...rest }) => {
  return (
    <span className={cx(s.mark, className)} {...rest}>
      <Icon name="verified" size={size} />
    </span>
  );
};
