import React from 'react';
import { cx } from '../../../utils/cx';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import { Icon } from '../../atoms/Icon/Icon';
import { TextArea } from '../../forms/TextArea/TextArea';
import { EmptyState } from '../../surfaces/EmptyState/EmptyState';
import s from './CopilotChat.module.css';

export interface CopilotCitation {
  kind: string;
  id: string;
  label: string;
}

export interface CopilotMessage {
  id: string;
  /** 'user' | 'assistant' | 'tool' — drives bubble + alignment + style. */
  role: 'user' | 'assistant' | 'tool';
  body: string;
  /** Tool name (when role='tool'). */
  toolName?: string;
  /** Citations for assistant turns — rendered as a footnote list. */
  citations?: CopilotCitation[];
  /** Optional model + token count for the assistant footer. */
  modelLabel?: string;
  createdAt: number;
}

export interface CopilotChatProps {
  messages: CopilotMessage[];
  loading?: boolean;
  draft: string;
  onDraftChange: (next: string) => void;
  onSend: () => void | Promise<void>;
  /** Optional citation click handler — host can deep-link. */
  onCitationClick?: (citation: CopilotCitation) => void;
  /** Show tool turns (debug / advanced). Defaults to false. */
  showToolTurns?: boolean;
  onToggleToolTurns?: (next: boolean) => void;
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

/**
 * Multi-turn copilot chat surface (M24, Phase 17e). Renders user /
 * assistant / tool turns with citations + an optional tool-trace
 * toggle for debugging. Pure presentation — host wires the action
 * round-trip via the convex-react hooks.
 */
export function CopilotChat({
  messages,
  loading,
  draft,
  onDraftChange,
  onSend,
  onCitationClick,
  showToolTurns = false,
  onToggleToolTurns,
  sending,
  disabled,
  placeholder = 'Ask anything about a creator, event, or pick…',
  emptyTitle = 'How can I help?',
  emptySubtitle = "Try \"Who's the best NFL creator this month?\" or \"Show my last 5 graded picks.\"",
  className,
}: CopilotChatProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const visible = showToolTurns
    ? messages
    : messages.filter((m) => m.role !== 'tool');

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
      {onToggleToolTurns && (
        <div className={s.toolbar}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleToolTurns(!showToolTurns)}
          >
            <Icon name="audit" size={13} />
            {showToolTurns ? 'Hide tool trace' : 'Show tool trace'}
          </Button>
        </div>
      )}

      <div className={s.scroll} ref={scrollRef}>
        {loading ? (
          <EmptyState icon="sparkles" title="Loading…" />
        ) : visible.length === 0 ? (
          <EmptyState icon="sparkles" title={emptyTitle} subtitle={emptySubtitle} />
        ) : (
          <div className={s.list}>
            {visible.map((m) => (
              <div
                key={m.id}
                className={cx(
                  s.row,
                  m.role === 'user' ? s.user : m.role === 'tool' ? s.tool : s.assistant,
                )}
              >
                {m.role === 'assistant' && (
                  <Avatar mono="AI" color="var(--primary)" size={28} />
                )}
                <div className={s.bubbleWrap}>
                  <div className={s.meta}>
                    <span className={s.who}>
                      {m.role === 'user'
                        ? 'You'
                        : m.role === 'tool'
                          ? `tool · ${m.toolName ?? '?'}`
                          : 'Copilot'}
                    </span>
                    <span className={s.time}>{formatTime(m.createdAt)}</span>
                  </div>
                  <div
                    className={cx(
                      s.bubble,
                      m.role === 'user' && s.bubbleUser,
                      m.role === 'tool' && s.bubbleTool,
                    )}
                  >
                    {m.role === 'tool' ? (
                      <pre className={s.toolBody}>{m.body}</pre>
                    ) : (
                      m.body
                    )}
                  </div>
                  {m.citations && m.citations.length > 0 && (
                    <div className={s.citations}>
                      <span className={s.citationsLabel}>Sources:</span>
                      {m.citations.map((c, i) => (
                        <button
                          key={`${c.kind}-${c.id}-${i}`}
                          type="button"
                          className={s.citation}
                          onClick={() => onCitationClick?.(c)}
                          disabled={!onCitationClick}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.modelLabel && (
                    <div className={s.model}>{m.modelLabel}</div>
                  )}
                </div>
                {m.role === 'user' && (
                  <Avatar mono="U" color="var(--t-3)" size={28} />
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
          <Icon name="sparkles" size={13} />
          {sending ? 'Thinking…' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
