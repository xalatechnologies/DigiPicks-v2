import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Row,
  StudioPageHeader,
  AdminMetricStrip,
  AdminCampaignsFilterBar,
  AdminCampaignsTable,
  AdminCampaignDetailDrawer,
  AdminCampaignComposerDrawer,
  AdminCampaignTemplateGrid,
  Button,
  type AdminCampaignChannel,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ADMIN } from '../lib/adminRoutes';
import {
  CAMPAIGN_CHANNEL_FILTERS,
  CAMPAIGN_STATUS_FILTERS,
  CAMPAIGN_TEMPLATES,
  channelIcon,
  channelLabel,
  matchesCampaignFilters,
  parseCampaignChannel,
  parseCampaignStatus,
  statusLabel,
  statusTone,
  type CampaignChannelFilter,
  type CampaignRow,
  type CampaignStatusFilter,
} from '../lib/campaignAdmin';

const TEMPLATE_PRESETS: Record<
  string,
  { title: string; body: string; channel: AdminCampaignChannel }
> = {
  billing: {
    title: 'Billing issue',
    body: 'We could not process your latest subscription payment. Update your billing method to restore access.',
    channel: 'email',
  },
  approved: {
    title: 'Creator approved',
    body: 'Your creator application was approved. Complete studio onboarding to publish picks.',
    channel: 'in_app',
  },
  rejected: {
    title: 'Application update',
    body: 'Your creator application needs more detail before we can approve it. Review the notes in your inbox.',
    channel: 'email',
  },
  maintenance: {
    title: 'Scheduled maintenance',
    body: 'DigiPicks will undergo brief maintenance tonight. Live events and checkout may be unavailable.',
    channel: 'push',
  },
};

function useCampaignParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = parseCampaignStatus(searchParams.get('status'));
  const channel = parseCampaignChannel(searchParams.get('channel'));
  const activeId = searchParams.get('id') as Id<'campaigns'> | null;
  const compose = searchParams.get('compose') === '1';

  const setStatus = (next: CampaignStatusFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('status');
    else params.set('status', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setChannel = (next: CampaignChannelFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('channel');
    else params.set('channel', next);
    params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setActiveId = (id: Id<'campaigns'> | null) => {
    const params = new URLSearchParams(searchParams);
    params.delete('compose');
    if (id) params.set('id', id);
    else params.delete('id');
    setSearchParams(params, { replace: true });
  };

  const setCompose = (open: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (open) {
      params.set('compose', '1');
      params.delete('id');
    } else {
      params.delete('compose');
    }
    setSearchParams(params, { replace: true });
  };

  return { status, channel, activeId, compose, setStatus, setChannel, setActiveId, setCompose };
}

export function Campaigns() {
  const navigate = useNavigate();
  const { status, channel, activeId, compose, setStatus, setChannel, setActiveId, setCompose } =
    useCampaignParams();
  const [search, setSearch] = useState('');

  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftChannel, setDraftChannel] = useState<AdminCampaignChannel>('email');
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeBusy, setComposeBusy] = useState(false);

  const summary = useQuery(api.admin.campaignsSummary, {});
  const campaigns = useQuery(api.admin.campaignsList, { limit: 100 });
  const active = useQuery(api.admin.campaignGet, activeId ? { campaignId: activeId } : 'skip');
  const createDraft = useMutation(api.admin.campaignCreateDraft);

  const filtered = useMemo(() => {
    if (!campaigns) return undefined;
    return campaigns.filter((row) =>
      matchesCampaignFilters(row as CampaignRow, search, status, channel),
    );
  }, [campaigns, search, status, channel]);

  const tableRows = useMemo(() => {
    if (!filtered) return [];
    return filtered.map((row) => ({
      id: row._id,
      title: row.title,
      subtitle: `By ${row.createdByLabel}`,
      channelIcon: channelIcon(row.channel),
      channelLabel: channelLabel(row.channel),
      statusLabel: statusLabel(row.status),
      statusTone: statusTone(row.status),
      dateLabel:
        row.status === 'sent'
          ? row.sentLabel
          : row.status === 'scheduled'
            ? row.scheduledLabel
            : row.createdLabel,
    }));
  }, [filtered]);

  const kpiItems = useMemo(() => {
    if (!summary) {
      return [
        { label: 'Draft', value: '—' },
        { label: 'Scheduled', value: '—' },
        { label: 'Sent', value: '—' },
        { label: 'In-app (month)', value: '—' },
      ];
    }
    return [
      {
        label: 'Draft',
        value: String(summary.draftCount),
        onClick: () => setStatus('draft'),
      },
      {
        label: 'Scheduled',
        value: String(summary.scheduledCount),
        delta: { text: 'Pending queue', dir: 'flat' as const },
        onClick: () => setStatus('scheduled'),
      },
      {
        label: 'Sent',
        value: String(summary.sentCount),
        onClick: () => setStatus('sent'),
      },
      {
        label: 'In-app (month)',
        value: String(summary.inAppThisMonth),
        delta: { text: `${summary.totalCount} campaigns`, dir: 'flat' as const },
      },
    ];
  }, [summary, setStatus]);

  const footerLabel =
    filtered === undefined
      ? undefined
      : `Showing ${filtered.length} campaign${filtered.length === 1 ? '' : 's'}`;

  function openComposerWithTemplate(templateId: string) {
    const preset = TEMPLATE_PRESETS[templateId];
    if (preset) {
      setDraftTitle(preset.title);
      setDraftBody(preset.body);
      setDraftChannel(preset.channel);
    }
    setComposeError(null);
    setCompose(true);
  }

  function resetComposer() {
    setDraftTitle('');
    setDraftBody('');
    setDraftChannel('email');
    setComposeError(null);
  }

  async function handleSaveDraft() {
    setComposeError(null);
    setComposeBusy(true);
    try {
      const id = await createDraft({
        title: draftTitle,
        body: draftBody,
        channel: draftChannel,
      });
      resetComposer();
      setCompose(false);
      setActiveId(id);
    } catch (err) {
      setComposeError(err instanceof Error ? err.message : 'Could not save draft.');
    } finally {
      setComposeBusy(false);
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="Notifications & campaigns"
          actions={
            <Row gap={2} wrap>
              <Button variant="primary" iconLeft="plus" onClick={() => setCompose(true)}>
                New campaign
              </Button>
              <Button variant="outline" onClick={() => navigate(ADMIN.support)}>
                Support inbox
              </Button>
            </Row>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <Stack gap={6}>
          <AdminCampaignsFilterBar
            statusOptions={CAMPAIGN_STATUS_FILTERS}
            status={status}
            onStatusChange={(v) => setStatus(v as CampaignStatusFilter)}
            channelOptions={CAMPAIGN_CHANNEL_FILTERS}
            channel={channel}
            onChannelChange={(v) => setChannel(v as CampaignChannelFilter)}
            search={search}
            onSearchChange={setSearch}
          />

          <AdminCampaignsTable
            rows={tableRows}
            selectedId={activeId}
            loading={campaigns === undefined}
            footerLabel={footerLabel}
            emptyTitle="No campaigns yet"
            emptySubtitle="Create a draft or pick a template below to get started."
            onSelect={(id) => setActiveId(id as Id<'campaigns'>)}
          />

          <AdminCampaignTemplateGrid
            templates={[...CAMPAIGN_TEMPLATES]}
            onSelect={openComposerWithTemplate}
          />
        </Stack>
      </Stack>

      <AdminCampaignDetailDrawer
        open={Boolean(activeId)}
        onClose={() => setActiveId(null)}
        loading={Boolean(activeId) && active === undefined}
        title={active?.title}
        body={active?.body}
        channelLabel={active ? channelLabel(active.channel) : undefined}
        statusLabel={active ? statusLabel(active.status) : undefined}
        statusTone={active ? statusTone(active.status) : undefined}
        createdByLabel={active?.createdByLabel}
        scheduledLabel={active?.scheduledLabel}
        sentLabel={active?.sentLabel}
        createdLabel={active?.createdLabel}
        onCompose={() => {
          setActiveId(null);
          setCompose(true);
        }}
      />

      <AdminCampaignComposerDrawer
        open={compose}
        onClose={() => {
          setCompose(false);
          resetComposer();
        }}
        title={draftTitle}
        body={draftBody}
        channel={draftChannel}
        onTitleChange={setDraftTitle}
        onBodyChange={setDraftBody}
        onChannelChange={setDraftChannel}
        onSave={handleSaveDraft}
        busy={composeBusy}
        error={composeError}
      />
    </Container>
  );
}
