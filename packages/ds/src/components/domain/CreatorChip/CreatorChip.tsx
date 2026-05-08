import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import s from './CreatorChip.module.css';

export interface CreatorChipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  name: string;
  handle: string;
  mono: string;
  color: string;
  verified?: boolean;
  size?: number;
  sub?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const CreatorChip = React.forwardRef<HTMLDivElement, CreatorChipProps>(function CreatorChip(
  { name, handle, mono, color, verified, size = 28, sub, onClick, className, ...rest },
  ref,
) {
  const interactive = Boolean(onClick);
  return (
    <div
      ref={ref}
      className={cx(s.chip, interactive && s.interactive, className)}
      onClick={onClick}
      {...rest}
    >
      <Avatar mono={mono} color={color} size={size} />
      <div className={s.text}>
        <div className={s.name}>
          <span className={s.nameLabel}>{name}</span>
          {verified && <VerifiedMark size={13} />}
        </div>
        <div className={s.handle}>{sub ?? handle}</div>
      </div>
    </div>
  );
});
