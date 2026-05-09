import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import { TextArea } from '../../forms/TextArea/TextArea';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './ChatPanel.module.css';

export interface ChatPanelMessage {
  id: string;
  senderName: string;
  senderHandle?: string;
  senderMono: string;
  senderColor: string;
  senderVerified?: boolean;
  body: string;
  createdAt: number;
  isOwn?: boolean;
}

export interface ChatPanelProps {
  messages: ChatPanelMessage[];
  loading?: boolean;
  draft: string;
  onDraftChange: (next: string) => void;
  onSend: () => void | Promise<void>;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  className?: string;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ChatPanel({
  messages,
  loading,
  draft,
  onDraftChange,
  onSend,
  sending,
  disabled,
  placeholder = 'Write a message…',
  emptyTitle = 'No messages yet.',
  emptySubtitle = 'Start the conversation — your message will appear here.',
  className,
}: ChatPanelProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!disabled && !sending && draft.trim().length > 0) {
        void onSend();
      }
    }
  }

  return (
    <div className={cx(s.panel, className)}>
      <div className={s.scroll} ref={scrollRef}>
        {loading ? (
          <EmptyState icon="message" title="Loading messages…" />
        ) : messages.length === 0 ? (
          <EmptyState
            icon="message"
            title={emptyTitle}
            subtitle={emptySubtitle}
          />
        ) : (
          <div className={s.list}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={cx(s.row, m.isOwn ? s.own : s.other)}
              >
                {!m.isOwn && (
                  <Avatar mono={m.senderMono} color={m.senderColor} size={32} />
                )}
                <div className={s.bubbleWrap}>
                  <div className={s.meta}>
                    <span className={s.name}>{m.senderName}</span>
                    {m.senderVerified && <VerifiedMark size={10} />}
                    {m.senderHandle && (
                      <span className={s.handle}>@{m.senderHandle}</span>
                    )}
                    <span className={s.time}>{formatTime(m.createdAt)}</span>
                  </div>
                  <div className={cx(s.bubble, m.isOwn && s.bubbleOwn)}>
                    {m.body}
                  </div>
                </div>
                {m.isOwn && (
                  <Avatar mono={m.senderMono} color={m.senderColor} size={32} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={s.composer}>
        <TextArea
          rows={2}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled || sending}
        />
        <Button
          variant="primary"
          size="sm"
          disabled={disabled || sending || draft.trim().length === 0}
          onClick={() => void onSend()}
        >
          <Icon name="arrow-right" size={13} />
          Send
        </Button>
      </div>
    </div>
  );
}
