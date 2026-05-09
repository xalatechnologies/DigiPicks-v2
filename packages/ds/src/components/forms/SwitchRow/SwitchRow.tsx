import React from 'react';
import { cx } from '../../../utils/cx';
import { Switch } from '../../atoms/Switch/Switch';
import { TitleSub } from '../../layout/TitleSub/TitleSub';
import s from './SwitchRow.module.css';

export interface SwitchRowProps {
  /** Primary label text, e.g. "Pick alerts". */
  label: React.ReactNode;
  /** Helper / muted description below the label. */
  sub?: React.ReactNode;
  /** Current toggle state. */
  checked: boolean;
  /** Called with the next toggle state when the switch is flipped. */
  onChange: (next: boolean) => void;
  /** When true, the switch ignores clicks and renders muted. */
  disabled?: boolean;
  className?: string;
}

/**
 * Title + sub label on the left, Switch on the right.
 * Replaces the repeated `<Row between><Stack/><Switch/></Row>` toggle
 * pattern in Settings (and anywhere else a labeled toggle is needed).
 */
export function SwitchRow({
  label,
  sub,
  checked,
  onChange,
  disabled,
  className,
}: SwitchRowProps) {
  return (
    <div className={cx(s.row, className)}>
      <TitleSub title={label} sub={sub} />
      <Switch
        checked={checked}
        onChange={(next) => {
          if (disabled) return;
          onChange(next);
        }}
      />
    </div>
  );
}
