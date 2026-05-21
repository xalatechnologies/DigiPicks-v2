import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { Button } from '../../atoms/Button/Button';
import { Field } from '../../forms/Field/Field';
import { Input } from '../../forms/Input/Input';
import { TextArea } from '../../forms/TextArea/TextArea';
import { Row } from '../../layout/Row/Row';
import { Stack } from '../../layout/Stack/Stack';
import s from '../AdminCampaignComposerDrawer/AdminCampaignComposerDrawer.module.css';

export interface AdminCouponComposerDrawerProps {
  open: boolean;
  onClose: () => void;
  code: string;
  stripeCouponId: string;
  percentOff: string;
  maxRedemptions: string;
  expiresOn: string;
  notes: string;
  onCodeChange: (v: string) => void;
  onStripeCouponIdChange: (v: string) => void;
  onPercentOffChange: (v: string) => void;
  onMaxRedemptionsChange: (v: string) => void;
  onExpiresOnChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSave: () => void;
  busy?: boolean;
  error?: string | null;
}

export function AdminCouponComposerDrawer({
  open,
  onClose,
  code,
  stripeCouponId,
  percentOff,
  maxRedemptions,
  expiresOn,
  notes,
  onCodeChange,
  onStripeCouponIdChange,
  onPercentOffChange,
  onMaxRedemptionsChange,
  onExpiresOnChange,
  onNotesChange,
  onSave,
  busy,
  error,
}: AdminCouponComposerDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="New coupon" className={s.drawerWide}>
      <div className={s.panelHost}>
        <p className={s.intro}>Create the coupon in Stripe first, then map it here.</p>
        <Stack gap={4}>
          <Field label="Code" help="Visible to customers. e.g. LAUNCH50">
            <Input
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              maxLength={32}
              placeholder="LAUNCH50"
            />
          </Field>
          <Field label="Stripe coupon ID">
            <Input
              value={stripeCouponId}
              onChange={(e) => onStripeCouponIdChange(e.target.value)}
              placeholder="VWb1tGtQ"
            />
          </Field>
          <Row gap={3} wrap>
            <Field label="Percent off (display)">
              <Input
                type="number"
                min={0}
                max={100}
                value={percentOff}
                onChange={(e) => onPercentOffChange(e.target.value)}
              />
            </Field>
            <Field label="Max redemptions (0 = unlimited)">
              <Input
                type="number"
                min={0}
                value={maxRedemptions}
                onChange={(e) => onMaxRedemptionsChange(e.target.value)}
              />
            </Field>
          </Row>
          <Field label="Expires (optional)">
            <Input
              type="date"
              value={expiresOn}
              onChange={(e) => onExpiresOnChange(e.target.value)}
            />
          </Field>
          <Field label="Internal notes">
            <TextArea rows={2} value={notes} onChange={(e) => onNotesChange(e.target.value)} />
          </Field>
          {error ? <p className={s.error}>{error}</p> : null}
          <div className={s.actions}>
            <Button variant="primary" disabled={busy} onClick={onSave}>
              Create coupon
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
