import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { Mono } from '../../layout/Mono/Mono';
import { Muted } from '../../layout/Muted/Muted';
import { Stack } from '../../layout/Stack/Stack';
import { Row } from '../../layout/Row/Row';
import { Field } from '../../forms/Field/Field';
import { Input } from '../../forms/Input/Input';

export interface ReferralShareModalProps {
  open: boolean;
  onClose: () => void;
  /** Referral code from api.referrals.mintMyCode. */
  code: string | null;
  /** Public URL the code attaches to (e.g. https://digipicks.com/?ref=...). */
  shareUrl: string;
  /** Called when user clicks "Copy link". */
  onCopy?: () => void;
  /** Conversions count + lifetime cents earned. */
  stats?: { conversions: number; lifetimeCents: number };
}

function fmtUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Modal that hands the user their referral code + share link, plus current
 * payout summary. Caller is responsible for clipboard copy + analytics.
 */
export const ReferralShareModal: React.FC<ReferralShareModalProps> = ({
  open,
  onClose,
  code,
  shareUrl,
  onCopy,
  stats,
}) => {
  const link = code ? `${shareUrl}${shareUrl.includes('?') ? '&' : '?'}ref=${code}` : '';

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      onCopy?.();
    } catch {
      // Fallback handled by host.
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share your referral link"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      }
    >
      <Stack gap={4}>
        <Muted>
          Send your link to friends and creators. You earn 10% of their first
          subscription invoice the moment they convert — no cap.
        </Muted>

        <Field label="Your link">
          <Row gap={2}>
            <Input value={link} readOnly aria-label="Referral link" />
            <Button variant="primary" size="md" onClick={handleCopy} disabled={!link}>
              <Icon name="link" size={13} />
              Copy
            </Button>
          </Row>
        </Field>

        {code && (
          <Field label="Code">
            <Mono>{code}</Mono>
          </Field>
        )}

        {stats && (
          <Field label="Earnings">
            <Row gap={4}>
              <span>{stats.conversions} conversions</span>
              <span>{fmtUsd(stats.lifetimeCents)} lifetime</span>
            </Row>
          </Field>
        )}
      </Stack>
    </Modal>
  );
};
