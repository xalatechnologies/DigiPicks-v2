import React from 'react';
import { Drawer } from '../../feedback/Drawer/Drawer';
import { PersonRow } from '../PersonRow/PersonRow';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { InsightCard } from '../../surfaces/InsightCard/InsightCard';
import { Field } from '../../forms/Field/Field';
import { TextArea } from '../../forms/TextArea/TextArea';
import { Muted } from '../../layout/Muted/Muted';
import { Stack } from '../../layout/Stack/Stack';
import s from './ApplicationReviewDrawer.module.css';

export interface ApplicationReviewHistoryItem {
  id: string;
  action: string;
  timeLabel: string;
  detail?: string;
}

export interface ApplicationReviewDrawerApplicant {
  name: string;
  handle: string;
  email: string;
  sport: string;
  niche: string;
  nicheChip: string;
  status: string;
  statusLabel: string;
  statusTone: 'blue' | 'green' | 'red' | 'amber' | 'mute' | 'violet' | 'gold';
  submittedLabel: string;
  overview: string;
  existingFollowing?: string;
  priceHint?: string;
  proofCount: number;
  winClaim?: string;
  reviewNotes?: string;
  aiScore?: number;
  aiReasoning?: string;
}

export interface ApplicationReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  applicant: ApplicationReviewDrawerApplicant | null;
  loading?: boolean;
  history: ApplicationReviewHistoryItem[];
  note: string;
  onNoteChange: (value: string) => void;
  busy?: boolean;
  error?: string | null;
  onApprove: () => void;
  onReject: () => void;
  onRequestInfo: () => void;
  onFlag: () => void;
  onMarkInReview: () => void;
  onAddNote: () => void;
}

export function ApplicationReviewDrawer({
  open,
  onClose,
  applicant,
  loading,
  history,
  note,
  onNoteChange,
  busy,
  error,
  onApprove,
  onReject,
  onRequestInfo,
  onFlag,
  onMarkInReview,
  onAddNote,
}: ApplicationReviewDrawerProps) {
  const title = applicant ? applicant.name : 'Application review';

  return (
    <Drawer open={open} onClose={onClose} title={title}>
      {loading || !applicant ? (
        <Muted>Loading application…</Muted>
      ) : (
        <Stack gap={0}>
          <section className={s.section}>
            <PersonRow
              name={applicant.name}
              sub={`@${applicant.handle} · ${applicant.email}`}
              mono={applicant.name
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
              trailing={
                <Badge tone={applicant.statusTone} dot>
                  {applicant.statusLabel}
                </Badge>
              }
            />
            <Muted>Submitted {applicant.submittedLabel}</Muted>
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Professional overview</h3>
            <p className={s.overview}>{applicant.overview}</p>
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Declared metrics</h3>
            <div className={s.metrics}>
              <div className={s.metric}>
                <p className={s.metricLabel}>Primary niche</p>
                <p className={s.metricValue}>{applicant.nicheChip}</p>
              </div>
              <div className={s.metric}>
                <p className={s.metricLabel}>Declared audience</p>
                <p className={s.metricValue}>{applicant.existingFollowing ?? '—'}</p>
              </div>
              {applicant.priceHint ? (
                <div className={s.metric}>
                  <p className={s.metricLabel}>Price hint</p>
                  <p className={s.metricValue}>{applicant.priceHint}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Evidence</h3>
            <div className={s.evidenceRow}>
              <span className={s.evidenceItem}>
                <Icon name="audit" size={16} />
                {applicant.proofCount} proof file{applicant.proofCount === 1 ? '' : 's'} declared
              </span>
              {applicant.winClaim ? (
                <span className={s.evidenceItem}>
                  <Icon name="trophy" size={16} />
                  Win claim
                </span>
              ) : null}
            </div>
            <InsightCard
              tone="amber"
              title="Secure attachments ship later"
              sub={`${applicant.proofCount} proof file${applicant.proofCount === 1 ? '' : 's'} declared on the application — file storage and preview are not wired yet.`}
            />
          </section>

          {applicant.aiScore != null ? (
            <section className={s.section}>
              <h3 className={s.sectionTitle}>AI advisory</h3>
              <InsightCard
                tone={applicant.aiScore >= 70 ? 'green' : applicant.aiScore >= 40 ? 'amber' : 'red'}
                eyebrow="Authenticity score"
                title={`${applicant.aiScore} / 100`}
                sub={applicant.aiReasoning}
              />
            </section>
          ) : null}

          {applicant.reviewNotes ? (
            <section className={s.section}>
              <h3 className={s.sectionTitle}>Internal notes</h3>
              <p className={s.notesBlock}>{applicant.reviewNotes}</p>
            </section>
          ) : null}

          <section className={s.section}>
            <h3 className={s.sectionTitle}>Internal history</h3>
            {history.length === 0 ? (
              <Muted>No audit events yet.</Muted>
            ) : (
              <ul className={s.historyList}>
                {history.map((item) => (
                  <li key={item.id} className={s.historyItem}>
                    <p className={s.historyAction}>{item.action}</p>
                    <p className={s.historyMeta}>
                      {item.timeLabel}
                      {item.detail ? ` · ${item.detail}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className={s.footer}>
            <Field label="Admin note">
              <TextArea
                rows={3}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Add context for the team or applicant…"
              />
            </Field>
            {error ? <p className={s.error}>{error}</p> : null}
            <div className={s.actions}>
              <Button variant="primary" disabled={busy} onClick={onApprove}>
                Approve creator
              </Button>
              <Button variant="danger" disabled={busy} onClick={onReject}>
                Reject
              </Button>
              <Button variant="secondary" disabled={busy} onClick={onRequestInfo}>
                Request info
              </Button>
              <Button variant="secondary" disabled={busy || !note.trim()} onClick={onAddNote}>
                Add admin note
              </Button>
              <Button variant="ghost" size="sm" disabled={busy} onClick={onMarkInReview}>
                Mark in review
              </Button>
              <Button variant="ghost" size="sm" disabled={busy} onClick={onFlag}>
                Flag application
              </Button>
            </div>
          </div>
        </Stack>
      )}
    </Drawer>
  );
}
