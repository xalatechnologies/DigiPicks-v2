import React from 'react';
import {
  Topbar,
  Container,
  Stack,
  Row,
  Col,
  Card,
  CardHead,
  Button,
  Icon,
  PageHead,
  Breadcrumb,
  Avatar,
  Badge,
  Muted,
  Search,
  EmptyState,
} from '@digipicks/ds';
import { CONVERSATIONS } from '../data/mock';

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
      <Topbar
        title="Messages"
        crumb={<Breadcrumb items={[{ label: 'Audience' }, { label: 'Messages' }]} />}
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
                    <Card
                      key={c.id}
                      hover
                      pad="sm"
                      onClick={() => setActiveId(c.id)}
                    >
                      <Row gap={3} between>
                        <Row gap={3}>
                          <Avatar mono={c.mono} color={c.color} size={32} />
                          <Stack gap={0}>
                            <span>{c.name}</span>
                            <Muted>{c.preview}</Muted>
                          </Stack>
                        </Row>
                        <Stack gap={1}>
                          <Muted>{c.time}</Muted>
                          {c.unread && (
                            <Badge tone="green" dot>
                              new
                            </Badge>
                          )}
                        </Stack>
                      </Row>
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
                      <Row gap={2}>
                        <Button variant="ghost" size="sm" iconOnly aria-label="More">
                          <Icon name="more" size={14} />
                        </Button>
                      </Row>
                    }
                  />
                  <Stack gap={3}>
                    <Card pad="sm">
                      <Stack gap={1}>
                        <Muted>Yesterday · 6:42 PM</Muted>
                        <span>Quick q on the Lakers H1 line — what's your read on Denver's pace tonight?</span>
                      </Stack>
                    </Card>
                    <Card pad="sm">
                      <Stack gap={1}>
                        <Muted>Yesterday · 6:51 PM</Muted>
                        <span>Pace tier suggests over still has value at -110 — Murray's minutes are the swing factor.</span>
                      </Stack>
                    </Card>
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
