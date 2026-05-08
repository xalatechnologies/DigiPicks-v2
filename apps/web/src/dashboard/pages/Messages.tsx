import React from 'react';
import {
  PageHeader,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  PageHead,
  Badge,
  Muted,
  Search,
  EmptyState,
  PersonRow,
} from '@digipicks/ds';
import { CONVERSATIONS } from '../data/studio';

interface MessageEntry {
  id: string;
  time: string;
  body: string;
}

const ACTIVE_THREAD: MessageEntry[] = [
  {
    id: 'm1',
    time: 'Yesterday · 6:42 PM',
    body: "Quick q on the Lakers H1 line — what's your read on Denver's pace tonight?",
  },
  {
    id: 'm2',
    time: 'Yesterday · 6:51 PM',
    body: "Pace tier suggests over still has value at -110 — Murray's minutes are the swing factor.",
  },
];

export function Messages() {
  const [query, setQuery] = React.useState('');
  const [activeId, setActiveId] = React.useState<string | null>(CONVERSATIONS[0]?.id ?? null);

  const filtered = CONVERSATIONS.filter((c) => {
    if (!query) return true;
    return c.name.toLowerCase().includes(query.toLowerCase());
  });

  const active = CONVERSATIONS.find((c) => c.id === activeId);

  return (
    <>
      <PageHeader
        title="Messages"
        crumbs={[{ label: 'Audience' }, { label: 'Messages' }]}
        actions={
          <Button variant="primary" size="sm">
            <Icon name="plus" size={13} />
            New broadcast
          </Button>
        }
      />

      <Container size="2xl">
        <Stack gap={5}>
          <PageHead
            eyebrow="Audience"
            title="Member conversations"
            sub="DMs from active subscribers — VIP gets priority response by default."
          />

          <Row gap={4} wrap>
            <Col gap={3}>
              <Search
                placeholder="Search conversations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Card pad="sm">
                <Stack gap={1}>
                  {filtered.map((c) => (
                    <Card key={c.id} hover pad="sm" onClick={() => setActiveId(c.id)}>
                      <PersonRow
                        name={c.name}
                        sub={c.preview}
                        mono={c.mono}
                        color={c.color}
                        trailing={
                          <Stack gap={1}>
                            <Muted>{c.time}</Muted>
                            {c.unread && (
                              <Badge tone="green" dot>
                                new
                              </Badge>
                            )}
                          </Stack>
                        }
                      />
                    </Card>
                  ))}
                </Stack>
              </Card>
            </Col>

            <Col gap={3}>
              {active ? (
                <Card>
                  <CardHead
                    title={active.name}
                    sub="VIP subscriber · joined 94d ago"
                    action={
                      <Button variant="ghost" size="sm" iconOnly aria-label="More">
                        <Icon name="more" size={14} />
                      </Button>
                    }
                  />
                  <Stack gap={3}>
                    {ACTIVE_THREAD.map((m) => (
                      <Card key={m.id} pad="sm">
                        <Stack gap={1}>
                          <Muted>{m.time}</Muted>
                          <span>{m.body}</span>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Card>
              ) : (
                <Card>
                  <EmptyState
                    icon="message"
                    title="Pick a conversation"
                    subtitle="Select a thread on the left to view the full message history."
                  />
                </Card>
              )}
            </Col>
          </Row>
        </Stack>
      </Container>
    </>
  );
}
