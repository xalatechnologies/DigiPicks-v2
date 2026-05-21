import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Button } from '../../atoms/Button/Button';
import { Field } from '../../forms/Field/Field';
import { Input } from '../../forms/Input/Input';
import { Stack } from '../../layout/Stack/Stack';
import s from '../AdminCampaignComposerDrawer/AdminCampaignComposerDrawer.module.css';

export interface AdminSettingsEditDrawerProps {
  open: boolean;
  onClose: () => void;
  settingKey: string;
  value: string;
  onKeyChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onSave: () => void;
  busy?: boolean;
  error?: string | null;
  isNew?: boolean;
}

export function AdminSettingsEditDrawer({
  open,
  onClose,
  settingKey,
  value,
  onKeyChange,
  onValueChange,
  onSave,
  busy,
  error,
  isNew,
}: AdminSettingsEditDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isNew ? 'New platform setting' : 'Edit setting'}
      className={s.drawerWide}
    >
      <div className={s.panelHost}>
        <Stack gap={4}>
          <Field label="Key">
            <Input
              value={settingKey}
              onChange={(e) => onKeyChange(e.target.value)}
              disabled={!isNew}
              maxLength={64}
            />
          </Field>
          <Field label="Value">
            <Input value={value} onChange={(e) => onValueChange(e.target.value)} maxLength={512} />
          </Field>
          {error ? <p className={s.error}>{error}</p> : null}
          <div className={s.actions}>
            <Button variant="primary" disabled={busy} onClick={onSave}>
              Save
            </Button>
            <Button variant="outline" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
          </div>
        </Stack>
      </div>
    </Drawer>
  );
}
