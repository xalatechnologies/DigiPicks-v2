import React from 'react';
import { cx } from '../../../utils/cx';
import { KV } from '../../data/KV/KV';
import { Stack } from '../../layout/Stack/Stack';
import s from './AdminSettingsPanel.module.css';

export interface AdminEnvRow {
  key: string;
  value: string;
}

export interface AdminSettingRow {
  id: string;
  key: string;
  value: string;
  updatedLabel: string;
}

export interface AdminSettingsPanelProps {
  envRows: AdminEnvRow[];
  settings: AdminSettingRow[];
  onEditSetting?: (id: string) => void;
  className?: string;
}

export function AdminSettingsPanel({
  envRows,
  settings,
  onEditSetting,
  className,
}: AdminSettingsPanelProps) {
  return (
    <div className={cx(s.panel, className)}>
      <div>
        <p className={s.sectionTitle}>Environment (read-only)</p>
        <div className={s.envList}>
          {envRows.map((row) => (
            <KV key={row.key} k={row.key} v={row.value} />
          ))}
        </div>
      </div>

      <div>
        <p className={s.sectionTitle}>Platform settings</p>
        <Stack gap={2}>
          {settings.length === 0 ? (
            <p className={s.settingValue}>No custom platform settings stored yet.</p>
          ) : (
            settings.map((row) => (
              <div key={row.id} className={s.settingRow}>
                <div>
                  <p className={s.settingKey}>{row.key}</p>
                  <p className={s.settingValue}>
                    {row.value} · {row.updatedLabel}
                  </p>
                </div>
                {onEditSetting ? (
                  <button type="button" className={s.editBtn} onClick={() => onEditSetting(row.id)}>
                    Edit
                  </button>
                ) : null}
              </div>
            ))
          )}
        </Stack>
      </div>
    </div>
  );
}
