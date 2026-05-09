import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { VerifiedMark } from '../../atoms/VerifiedMark/VerifiedMark';
import { TextArea } from '../../forms/TextArea/TextArea';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './ChatPanel.module.css';

export interface ChatPanelReaction {
  emoji: string;
  count: number;
  /** True when the calling user is in this reaction's userIds. */
  reactedByMe: boolean;
}

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
  /** Aggregated reactions, derived in the host page. */
  reactions?: ChatPanelReaction[];
}

export interface ChatPanelProps {
  messages: ChatPanelMessage[];
  loading?: boolean;
  draft: string;
  onDraftChange: (next: string) => void;
  onSend: () => void | Promise<void>;
  /** Toggle a reaction on a message — host calls api.messages.toggleReaction. */
  onToggleReaction?: (messageId: string, emoji: string) => void | Promise<void>;
  /** Quick-reaction emojis offered in the picker. Defaults to a small set. */
  quickEmojis?: string[];
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  className?: string;
}

const DEFAULT_QUICK_EMOJIS = ['👍', '🔥', '💯', '😂', '🎯', '👀'];

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
  onToggleReaction,
  quickEmojis = DEFAULT_QUICK_EMOJIS,
  sending,
  disabled,
  placeholder = 'Write a message…',
  emptyTitle = 'No messages yet.',
  emptySubtitle = 'Start the conversation — your message will appear here.',
  className,
}: ChatPanelProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [pickerForId, setPickerForId] = React.useState<string | null>(null);

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
                  {(m.reactions && m.reactions.length > 0) || onToggleReaction ? (
                    <div className={s.reactions}>
                      {m.reactions?.map((r) => (
                        <button
                          key={r.emoji}
                          type="button"
                          className={cx(s.reaction, r.reactedByMe && s.reactionMine)}
                          onClick={() => onToggleReaction?.(m.id, r.emoji)}
                          aria-pressed={r.reactedByMe}
                          aria-label={`${r.emoji} (${r.count})`}
                          disabled={!onToggleReaction}
                        >
                          <span className={s.reactionEmoji}>{r.emoji}</span>
                          <span className={s.reactionCount}>{r.count}</span>
                        </button>
                      ))}
                      {onToggleReaction && (
                        <div className={s.pickerWrap}>
                          <button
                            type="button"
                            className={s.addReaction}
                            onClick={() =>
                              setPickerForId((cur) => (cur === m.id ? null : m.id))
                            }
                            aria-label="Add reaction"
                            aria-expanded={pickerForId === m.id}
                          >
                            <Icon name="plus" size={11} />
                          </button>
                          {pickerForId === m.id && (
                            <div className={s.picker} role="menu">
                              {quickEmojis.map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  className={s.pickerEmoji}
                                  onClick={() => {
                                    void onToggleReaction(m.id, e);
                                    setPickerForId(null);
                                  }}
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
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
