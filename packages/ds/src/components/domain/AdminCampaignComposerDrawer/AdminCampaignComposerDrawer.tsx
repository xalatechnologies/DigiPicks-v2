import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Button } from '../../atoms/Button/Button';
import { Field } from '../../forms/Field/Field';
import { Input } from '../../forms/Input/Input';
import { Select } from '../../forms/Select/Select';
import { TextArea } from '../../forms/TextArea/TextArea';
import { Stack } from '../../layout/Stack/Stack';
import s from './AdminCampaignComposerDrawer.module.css';

export type AdminCampaignChannel = 'email' | 'push' | 'in_app';

export interface AdminCampaignComposerDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  channel: AdminCampaignChannel;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onChannelChange: (value: AdminCampaignChannel) => void;
  onSave: () => void;
  busy?: boolean;
  error?: string | null;
}

export function AdminCampaignComposerDrawer({
  open,
  onClose,
  title,
  body,
  channel,
  onTitleChange,
  onBodyChange,
  onChannelChange,
  onSave,
  busy,
  error,
}: AdminCampaignComposerDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="New campaign" className={s.drawerWide}>
      <div className={s.panelHost}>
        <p className={s.intro}>Draft a broadcast for email, push, or in-app delivery.</p>
        <Stack gap={4}>
          <Field label="Campaign title">
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Internal name for tracking"
              maxLength={120}
            />
          </Field>
          <Field label="Channel">
            <Select
              value={channel}
              onChange={(e) => onChannelChange(e.target.value as AdminCampaignChannel)}
            >
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="in_app">In-app</option>
            </Select>
          </Field>
          <Field label="Message content">
            <TextArea
              rows={6}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="Write the notification body…"
              maxLength={4000}
            />
          </Field>
          {error ? <p className={s.error}>{error}</p> : null}
          <div className={s.actions}>
            <Button variant="primary" disabled={busy} onClick={onSave}>
              Save draft
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
