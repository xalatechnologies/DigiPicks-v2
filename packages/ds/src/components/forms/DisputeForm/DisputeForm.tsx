import React from 'react';
import { cx } from '../../../utils/cx';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';
import { TextArea } from '../TextArea/TextArea';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { Stack } from '../../layout/Stack/Stack';
import { Row } from '../../layout/Row/Row';
import { Muted } from '../../layout/Muted/Muted';

export interface DisputeFormProps {
  busy?: boolean;
  error?: string | null;
  onSubmit: (args: { reason: string; detail: string }) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

/**
 * Compact dispute-open form. Single-line reason + multiline detail.
 * Renders inline (e.g. inside a PickCard "Open dispute" expand) — caller
 * controls visibility. Validation is server-side; this just trims.
 */
export const DisputeForm: React.FC<DisputeFormProps> = ({
  busy,
  error,
  onSubmit,
  onCancel,
  className,
}) => {
  const [reason, setReason] = React.useState('');
  const [detail, setDetail] = React.useState('');

  async function handleSubmit() {
    const r = reason.trim();
    if (!r) return;
    await onSubmit({ reason: r, detail: detail.trim() });
  }

  return (
    <div className={cx(className)}>
      <Stack gap={3}>
        <Muted>
          Disputes go to platform admins for review. Be specific about what
          you'd like re-checked — odds source, timing, or grading.
        </Muted>
        <Field label="Reason" required>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Short reason (e.g. wrong final score)"
          />
        </Field>
        <Field label="Detail" help="Optional — links, sources, screenshots.">
          <TextArea
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={2000}
          />
        </Field>
        {error && <Muted>{error}</Muted>}
        <Row gap={2}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={busy || !reason.trim()}
          >
            <Icon name="flag" size={13} />
            {busy ? 'Submitting…' : 'Open dispute'}
          </Button>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          )}
        </Row>
      </Stack>
    </div>
  );
};
