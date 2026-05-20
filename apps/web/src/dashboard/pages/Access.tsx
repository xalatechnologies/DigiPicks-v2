import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  Card,
  CardHead,
  Button,
  Icon,
  StudioPageHeader,
  QuickActionGrid,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
  AccessBadge,
  SwitchRow,
  Muted,
  Segmented,
  EmptyState,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import { useStudioContext } from '../useStudioContext';
type PickAccess = 'free' | 'premium' | 'vip';
type IntegrationAccess = 'public' | 'subscriber' | 'vip';

const DEFAULT_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

const INTEGRATION_ACCESS = [
  { value: 'public', label: 'Everyone (Free)' },
  { value: 'subscriber', label: 'Subscribers (Premium)' },
  { value: 'vip', label: 'VIP only' },
];

export function Access() {
  const navigate = useNavigate();
  const ctx = useStudioContext();
  const data = useQuery(
    api.access.getByCreator,
    ctx.creatorId ? { creatorId: ctx.creatorId } : 'skip',
  );
  const save = useMutation(api.access.update);

  const [defaultAccess, setDefaultAccess] = React.useState<PickAccess>('premium');
  const [telegramOn, setTelegramOn] = React.useState(false);
  const [discordOn, setDiscordOn] = React.useState(false);
  const [telegramMin, setTelegramMin] = React.useState<IntegrationAccess>('subscriber');
  const [discordMin, setDiscordMin] = React.useState<IntegrationAccess>('vip');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!data) return;
    setDefaultAccess(data.defaultPickAccess as PickAccess);
    setTelegramOn(data.integrations.telegram.enabled);
    setDiscordOn(data.integrations.discord.enabled);
    setTelegramMin(data.integrations.telegram.minAccess as IntegrationAccess);
    setDiscordMin(data.integrations.discord.minAccess as IntegrationAccess);
  }, [data]);

  async function handleSave() {
    if (!ctx.creatorId) return;
    setBusy(true);
    setMsg(null);
    try {
      await save({
        creatorId: ctx.creatorId,
        defaultPickAccess: defaultAccess,
        integrationsTelegramEnabled: telegramOn,
        integrationsDiscordEnabled: discordOn,
        integrationsTelegramMinAccess: telegramMin,
        integrationsDiscordMinAccess: discordMin,
      });
      setMsg('Saved.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!ctx.creatorId) {
    return (
      <Container size="2xl">
        <EmptyState icon="lock" title="Creator account required" />
      </Container>
    );
  }

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Access"
          title="Access & permissions"
          sub="Configure default post access and integration tier gates."
          actions={
            <Button variant="primary" size="sm" disabled={busy} onClick={handleSave}>
              <Icon name="check" size={13} />
              Save changes
            </Button>
          }
        />
        {msg ? <Muted>{msg}</Muted> : null}

        <Card pad="lg">
          <CardHead title="Default post access" sub="Applied when publishing new picks." />
          <Segmented
            options={DEFAULT_OPTIONS}
            value={defaultAccess}
            onChange={(v) => setDefaultAccess(v as PickAccess)}
            ariaLabel="Default access"
          />
        </Card>

        <Card pad="lg">
          <CardHead title="Platform integrations" />
          <Stack gap={4}>
            <SwitchRow
              label="Telegram channel"
              sub="Auto-sync picks to your channel"
              checked={telegramOn}
              onChange={setTelegramOn}
            />
            <Segmented
              options={INTEGRATION_ACCESS}
              value={telegramMin}
              onChange={(v) => setTelegramMin(v as IntegrationAccess)}
              ariaLabel="Telegram minimum access"
            />
            <SwitchRow
              label="Discord server"
              sub="Role-based access management"
              checked={discordOn}
              onChange={setDiscordOn}
            />
            <Segmented
              options={INTEGRATION_ACCESS}
              value={discordMin}
              onChange={(v) => setDiscordMin(v as IntegrationAccess)}
              ariaLabel="Discord minimum access"
            />
          </Stack>
        </Card>

        <Card pad="sm">
          <CardHead title="Access matrix" sub="Per-tier perks from your pricing products." />
          {data === undefined ? (
            <EmptyState icon="tag" title="Loading tiers…" />
          ) : !data || data.tiers.length === 0 ? (
            <Muted>Define products under Products / Pricing first.</Muted>
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Tier</Th>
                  <Th>Perks</Th>
                </Tr>
              </THead>
              <TBody>
                {(data?.tiers ?? []).map((t) => (
                  <Tr key={t.id}>
                    <Td>
                      {t.legacyPlan === 'free' ||
                      t.legacyPlan === 'premium' ||
                      t.legacyPlan === 'vip' ? (
                        <AccessBadge access={t.legacyPlan} />
                      ) : null}
                      {t.name}
                    </Td>
                    <Td>{t.perks.join(' · ') || '—'}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Row gap={3} wrap>
          <AccessBadge access="free" />
          <Muted>Public funnel content</Muted>
        </Row>

        <QuickActionGrid title="Related" items={studioCrossLinks('access', navigate)} />
      </Stack>
    </Container>
  );
}
