import React, { useId, useRef } from 'react';
import { cx } from '../../../utils/cx';
import { Icon } from '../../atoms/Icon/Icon';
import s from './FileUploadZone.module.css';

export interface FileUploadZoneProps {
  title?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  fileCount?: number;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
}

/** Dashed drop target for proof uploads (click to browse). */
export function FileUploadZone({
  title = 'Drag and drop screenshots',
  hint = 'Upload verified third-party logs, profit/loss statements, or verification profile exports.',
  accept = 'image/*,.pdf',
  multiple = true,
  fileCount = 0,
  onFilesSelected,
  className,
}: FileUploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    onFilesSelected?.(Array.from(list));
    e.target.value = '';
  }

  return (
    <div
      className={cx(s.zone, className)}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <span className={s.icon} aria-hidden="true">
        <Icon name="inbox" size={48} />
      </span>
      <p className={s.title}>{title}</p>
      <p className={s.hint}>{hint}</p>
      {fileCount > 0 ? (
        <p className={s.count}>
          {fileCount} file{fileCount === 1 ? '' : 's'} selected
        </p>
      ) : null}
      <input
        ref={inputRef}
        id={inputId}
        className={s.input}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
    </div>
  );
}
