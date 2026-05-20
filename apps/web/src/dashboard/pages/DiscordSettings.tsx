import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useMutation, usePaginatedQuery, useQuery } from 'convex/react';
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
  Heading,
  Muted,
  EmptyState,
  Grid,
  DiscordIntegrationCard,
  DiscordConnectButton,
  DiscordChannelMapper,
  DiscordAlertRuleEditor,
  DiscordDeliveryLogTable,
  type DiscordChannelMapping,
  type DiscordChannelType,
  type DiscordSyncDirection,
  type DiscordAlertRules,
  type DiscordAlertConfidence,
  type DiscordIntegrationStatus,
  type DiscordDeliveryRow,
  type DiscordDeliveryStatus,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { studioCrossLinks } from '../../lib/studioCrossLinks';
import type { Id } from '../../../../../convex/_generated/dataModel';

// =============================================================================
// M20 Discord settings — connected guilds, channel mapping, alert rules,
// and a paginated delivery log. Pure composition of DS components.
// =============================================================================

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;

/**
 * Convex deployments expose actions/queries on the `.convex.cloud` host but
 * the OAuth HTTP routes live on the `.convex.site` sibling. Derive the site
 * URL from VITE_CONVEX_URL so we don't need a second env var.
 */
function deriveOAuthStartUrl(creatorId: Id<'creators'>): string {
  if (!CONVEX_URL) return '#';
  const siteUrl = CONVEX_URL.replace('.convex.cloud', '.convex.site');
  return `${siteUrl}/discord/oauth/start?creatorId=${encodeURIComponent(creatorId)}`;
}

// Map Discord-API channel type codes to the DS-friendly enum the mapper uses.
function channelTypeFromCode(code: number | undefined): DiscordChannelType | undefined {
  switch (code) {
    case 0:
      return 'text';
    case 5:
      return 'announcement';
    case 15:
      return 'forum';
    case 2:
      return 'voice';
    case 13:
      return 'stage';
    default:
      return undefined;
  }
}

// Map backend delivery status → DS table status.
function deliveryStatusFor(
  status: 'pending' | 'sent' | 'failed' | 'retrying',
): DiscordDeliveryStatus {
  switch (status) {
    case 'sent':
      return 'sent';
    case 'failed':
      return 'failed';
    case 'pending':
      return 'queued';
    case 'retrying':
      return 'rate_limited';
    default:
      return 'queued';
  }
}

function confidenceFromBackend(raw: string | undefined): DiscordAlertConfidence | undefined {
  switch (raw) {
    case 'Low':
    case 'low':
      return 'low';
    case 'Medium':
    case 'medium':
      return 'medium';
    case 'High':
    case 'high':
      return 'high';
    default:
      return undefined;
  }
}

function confidenceToBackend(c: DiscordAlertConfidence | undefined): string | undefined {
  if (!c) return undefined;
  if (c === 'low') return 'Low';
  if (c === 'medium') return 'Medium';
  if (c === 'high') return 'High';
  return undefined;
}

export function DiscordSettings() {
  const navigate = useNavigate();
  const me = useQuery(api.users.me);
  const creatorId = me?.creatorId ?? null;

  const integrations = useQuery(
    api.discord.integrationsDb.getCreatorIntegrations,
    creatorId ? { creatorId } : 'skip',
  );
  const channelSyncs = useQuery(
    api.discord.channels.listChannelSyncs,
    creatorId ? { creatorId } : 'skip',
  );

  const pauseIntegration = useMutation(api.discord.integrationsDb.pauseIntegration);
  const revokeIntegration = useMutation(api.discord.integrationsDb.revokeIntegration);
  const refreshChannels = useAction(api.discord.integrations.refreshGuildChannels);
  const configureChannelSync = useMutation(api.discord.channels.configureChannelSync);
  const disableChannelSync = useMutation(api.discord.channels.disableChannelSync);

  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshingId, setRefreshingId] = React.useState<string | null>(null);

  const {
    results: deliveryRows,
    status: deliveryStatus,
    loadMore,
  } = usePaginatedQuery(api.discord.delivery.getDeliveryLogs, creatorId ? { creatorId } : 'skip', {
    initialNumItems: 25,
  });

  async function handlePause(integrationId: Id<'discordIntegrations'>) {
    setError(null);
    setBusyId(integrationId);
    try {
      await pauseIntegration({ integrationId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not pause integration.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(integrationId: Id<'discordIntegrations'>) {
    if (
      !window.confirm(
        'Disconnect this guild? Outbound deliveries stop immediately and stored OAuth tokens are wiped. You can reconnect later.',
      )
    ) {
      return;
    }
    setError(null);
    setBusyId(integrationId);
    try {
      await revokeIntegration({ integrationId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke integration.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRefresh(integrationId: Id<'discordIntegrations'>) {
    setError(null);
    setRefreshingId(integrationId);
    try {
      await refreshChannels({ integrationId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh channels.');
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleChannelPatch(
    integrationId: Id<'discordIntegrations'>,
    sync: NonNullable<typeof channelSyncs>[number],
    patch: { syncDirection?: DiscordSyncDirection; enabled?: boolean },
  ) {
    setError(null);
    try {
      // The mapper emits `syncDirection: null` to mean "off" — treat that as
      // a disable on the backend (preserves the row's stored direction).
      if (patch.syncDirection === null) {
        if (sync.isEnabled) {
          await disableChannelSync({ channelSyncId: sync._id });
        }
        return;
      }
      await configureChannelSync({
        integrationId,
        channelId: sync.channelId,
        channelName: sync.channelName,
        channelType: sync.channelType,
        syncDirection: patch.syncDirection ?? sync.syncDirection,
        linkedEntityType: sync.linkedEntityType,
        linkedEntityId: sync.linkedEntityId,
        alertRules: sync.alertRules,
        isEnabled: patch.enabled ?? sync.isEnabled,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update channel.');
    }
  }

  async function handleAlertRulesChange(
    integrationId: Id<'discordIntegrations'>,
    sync: NonNullable<typeof channelSyncs>[number],
    next: DiscordAlertRules,
  ) {
    setError(null);
    try {
      await configureChannelSync({
        integrationId,
        channelId: sync.channelId,
        channelName: sync.channelName,
        channelType: sync.channelType,
        syncDirection: sync.syncDirection,
        linkedEntityType: sync.linkedEntityType,
        linkedEntityId: sync.linkedEntityId,
        alertRules: {
          newPick: next.newPick,
          pickGraded: next.pickGraded,
          oddsMovement: next.oddsMovement,
          creatorLive: next.creatorLive,
          aiInsight: next.aiInsight,
          announcement: next.announcement,
          minConfidence: confidenceToBackend(next.minConfidence),
        },
        isEnabled: sync.isEnabled,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update alert rules.');
    }
  }

  // ─── Derive view-model rows ────────────────────────────────────────────────

  const integrationList = integrations ?? [];
  const syncList = channelSyncs ?? [];

  const channelsByIntegration = new Map<string, NonNullable<typeof channelSyncs>>();
  for (const sync of syncList) {
    const arr = channelsByIntegration.get(sync.integrationId) ?? [];
    arr.push(sync);
    channelsByIntegration.set(sync.integrationId, arr);
  }

  const deliveryTableRows: DiscordDeliveryRow[] = (deliveryRows ?? []).map((row) => ({
    id: row._id,
    eventType: row.eventType,
    status: deliveryStatusFor(row.status),
    channelName: row.channelId ? row.channelId : row.webhookUrlMasked,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    deliveredAt: row.deliveredAt,
  }));

  const oauthHref = creatorId ? deriveOAuthStartUrl(creatorId) : '#';

  const inboundChannels = React.useMemo(() => {
    if (!channelSyncs) return [];
    return channelSyncs.filter(
      (s) => s.isEnabled && (s.syncDirection === 'inbound' || s.syncDirection === 'two_way'),
    );
  }, [channelSyncs]);

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Studio · Integrations"
          title="Discord"
          sub="Bridge your DigiPicks studio to your Discord community — connect a guild, map channels, and tune alert rules."
        />

        {error && <Muted>{error}</Muted>}

        <Card pad="md">
          <CardHead
            title="Inbound sync"
            sub="Channels DigiPicks reads every ~5 minutes. Summaries use hashed authors — no raw Discord content is stored."
          />
          {channelSyncs === undefined ? (
            <Muted>Loading channel configuration…</Muted>
          ) : inboundChannels.length === 0 ? (
            <Muted>
              Enable Inbound or Two-way on a mapped channel below to import community discussion.
            </Muted>
          ) : (
            <Stack gap={2}>
              {inboundChannels.map((ch) => (
                <Row key={ch._id} gap={3} between>
                  <Stack gap={0}>
                    <Muted>{ch.channelName}</Muted>
                    <Muted>
                      {ch.syncDirection === 'two_way' ? 'Two-way' : 'Inbound'}
                      {ch.lastImportedAt
                        ? ` · Last import ${new Date(ch.lastImportedAt).toLocaleString()}`
                        : ' · Awaiting first import'}
                    </Muted>
                  </Stack>
                </Row>
              ))}
            </Stack>
          )}
        </Card>

        {/* ── Section 1: Connected guilds ─────────────────────────────── */}
        <Card>
          <CardHead
            title="Connected guilds"
            sub="Each connection grants the DigiPicks bot access to one Discord server."
            action={
              <DiscordConnectButton
                size="sm"
                onClick={() => {
                  if (!creatorId) return;
                  window.location.href = oauthHref;
                }}
                disabled={!creatorId}
              />
            }
          />
          {integrations === undefined ? (
            <EmptyState icon="discord" title="Loading integrations…" />
          ) : integrationList.length === 0 ? (
            <EmptyState
              icon="discord"
              title="No Discord guilds connected yet"
              subtitle="Click Connect Discord above to install the DigiPicks bot in one of your servers."
            />
          ) : (
            <Grid cols={2} gap={4} stagger={false}>
              {integrationList.map((integ) => {
                const channelCount = (channelsByIntegration.get(integ._id) ?? []).filter(
                  (s) => s.isEnabled,
                ).length;
                const status = integ.status as DiscordIntegrationStatus;
                return (
                  <DiscordIntegrationCard
                    key={integ._id}
                    guildName={integ.guildName}
                    status={status}
                    botInstalled={integ.botInstalled}
                    channelsConfigured={channelCount}
                    lastDeliveryAt={integ.updatedAt}
                    action={
                      <Row gap={2}>
                        {status === 'connected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === integ._id}
                            onClick={() => handlePause(integ._id)}
                          >
                            <Icon name="x" size={13} />
                            Pause
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={busyId === integ._id}
                          onClick={() => handleRevoke(integ._id)}
                        >
                          <Icon name="trash" size={13} />
                          Disconnect
                        </Button>
                      </Row>
                    }
                  />
                );
              })}
            </Grid>
          )}
        </Card>

        {/* ── Section 2: Channel mapping (per integration) ────────────── */}
        {integrationList.map((integ) => {
          const channels = channelsByIntegration.get(integ._id) ?? [];
          const mappings: DiscordChannelMapping[] = channels.map((ch) => ({
            id: ch.channelId,
            name: ch.channelName,
            type: channelTypeFromCode(ch.channelType),
            syncDirection: ch.isEnabled ? ch.syncDirection : null,
            enabled: ch.isEnabled,
          }));
          return (
            <Card key={`mapping-${integ._id}`}>
              <CardHead
                title={`Channel mapping · ${integ.guildName}`}
                sub="Choose which channels DigiPicks reads from or writes to."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={refreshingId === integ._id}
                    onClick={() => handleRefresh(integ._id)}
                  >
                    <Icon name="sort" size={13} />
                    {refreshingId === integ._id ? 'Refreshing…' : 'Refresh channels'}
                  </Button>
                }
              />
              <DiscordChannelMapper
                channels={mappings}
                onChange={(channelId, patch) => {
                  const sync = channels.find((c) => c.channelId === channelId);
                  if (!sync) return;
                  void handleChannelPatch(integ._id, sync, patch);
                }}
              />
            </Card>
          );
        })}

        {/* ── Section 3: Alert rules (per enabled channel sync) ───────── */}
        {integrationList.map((integ) => {
          const channels = (channelsByIntegration.get(integ._id) ?? []).filter((c) => c.isEnabled);
          if (channels.length === 0) return null;
          return (
            <Card key={`rules-${integ._id}`}>
              <CardHead
                title={`Alert rules · ${integ.guildName}`}
                sub="Per-channel toggles for outbound deliveries."
              />
              <Stack gap={4}>
                {channels.map((ch) => {
                  const value: DiscordAlertRules = {
                    newPick: ch.alertRules?.newPick,
                    pickGraded: ch.alertRules?.pickGraded,
                    oddsMovement: ch.alertRules?.oddsMovement,
                    creatorLive: ch.alertRules?.creatorLive,
                    aiInsight: ch.alertRules?.aiInsight,
                    announcement: ch.alertRules?.announcement,
                    minConfidence: confidenceFromBackend(ch.alertRules?.minConfidence),
                  };
                  return (
                    <Stack key={ch._id} gap={2}>
                      <Heading level={4} size="md">
                        #{ch.channelName}
                      </Heading>
                      <DiscordAlertRuleEditor
                        value={value}
                        onChange={(next) => handleAlertRulesChange(integ._id, ch, next)}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            </Card>
          );
        })}

        {/* ── Section 4: Delivery log ─────────────────────────────────── */}
        <Card>
          <CardHead
            title="Delivery log"
            sub="Every Discord post DigiPicks attempted to send on your behalf."
            action={
              deliveryStatus === 'CanLoadMore' ? (
                <Button variant="secondary" size="sm" onClick={() => loadMore(25)}>
                  Load more
                </Button>
              ) : null
            }
          />
          <DiscordDeliveryLogTable
            rows={deliveryTableRows}
            loading={deliveryStatus === 'LoadingFirstPage'}
          />
        </Card>

        <QuickActionGrid title="Related" items={studioCrossLinks('discordSettings', navigate)} />
      </Stack>
    </Container>
  );
}
