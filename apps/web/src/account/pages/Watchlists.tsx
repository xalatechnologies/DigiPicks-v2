import React, { useMemo, useState } from 'react';
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
  EmptyState,
  Mono,
  Muted,
  Field,
  Input,
  Select,
  Badge,
  Switch,
  TitleSub,
  StudioPageHeader,
  AccountRefineCard,
  StudioFilterPills,
  StudioDashLayout,
  StudioDashCol,
  AccountSidebarPanel,
  QuickActionGrid,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import { accountCrossLinks } from '../../lib/accountCrossLinks';
import type { Id } from '../../../../../convex/_generated/dataModel';

type ConfidenceLevel = 'Low' | 'Medium' | 'High';
type StatusFilter = 'all' | 'active' | 'paused';

const SPORTS = ['', 'Soccer', 'Cricket', 'Tennis', 'Basketball', 'Football', 'Baseball'];
const CONFIDENCE: Array<'' | ConfidenceLevel> = ['', 'Low', 'Medium', 'High'];
const ACCESS = ['', 'free', 'premium', 'vip'];

const STATUS_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
] as const;

interface DraftFilter {
  sport: string;
  league: string;
  market: string;
  minConfidence: '' | ConfidenceLevel;
  access: string;
  bodyContains: string;
  lineMoveAbovePercent: string;
}

const EMPTY_DRAFT: DraftFilter = {
  sport: '',
  league: '',
  market: '',
  minConfidence: '',
  access: '',
  bodyContains: '',
  lineMoveAbovePercent: '',
};

function toFilter(d: DraftFilter) {
  return {
    sport: d.sport || undefined,
    league: d.league || undefined,
    market: d.market || undefined,
    minConfidence: d.minConfidence || undefined,
    access: d.access || undefined,
    bodyContains: d.bodyContains || undefined,
    lineMoveAbovePercent:
      d.lineMoveAbovePercent && Number.isFinite(Number(d.lineMoveAbovePercent))
        ? Number(d.lineMoveAbovePercent)
        : undefined,
  };
}

export function Watchlists() {
  const navigate = useNavigate();
  const watchlists = useQuery(api.watchlists.listMine);
  const create = useMutation(api.watchlists.create);
  const update = useMutation(api.watchlists.update);
  const remove = useMutation(api.watchlists.remove);

  const [name, setName] = useState('');
  const [draft, setDraft] = useState<DraftFilter>(EMPTY_DRAFT);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!watchlists) return undefined;
    if (statusFilter === 'active') return watchlists.filter((w) => w.isActive);
    if (statusFilter === 'paused') return watchlists.filter((w) => !w.isActive);
    return watchlists;
  }, [watchlists, statusFilter]);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await create({ name: name.trim(), filter: toFilter(draft) });
      setName('');
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create watchlist.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(id: Id<'watchlists'>, next: boolean) {
    try {
      await update({ watchlistId: id, isActive: next });
    } catch (err) {
      console.warn('toggle watchlist:', err);
    }
  }

  async function handleRemove(id: Id<'watchlists'>) {
    if (!window.confirm('Remove this watchlist?')) return;
    try {
      await remove({ watchlistId: id });
    } catch (err) {
      console.warn('remove watchlist:', err);
    }
  }

  const listPane = (
    <Card>
      <CardHead title="Your watchlists" sub={`${filtered?.length ?? 0} shown`} />
      {watchlists === undefined ? (
        <EmptyState icon="bell" title="Loading…" />
      ) : filtered!.length === 0 ? (
        <EmptyState
          icon="bell"
          title={watchlists.length === 0 ? 'No watchlists yet' : 'No watchlists in this view'}
          subtitle="Create one below — matching picks trigger alerts across every channel you have enabled."
        />
      ) : (
        <Stack gap={2}>
          {filtered!.map((w) => (
            <Card key={w._id} pad="sm">
              <Row gap={3} between>
                <Stack gap={1}>
                  <Row gap={2}>
                    <TitleSub title={w.name} sub={summarizeFilter(w.filter)} />
                    {!w.isActive ? <Badge tone="mute">Paused</Badge> : null}
                  </Row>
                </Stack>
                <Row gap={2}>
                  <Switch checked={w.isActive} onChange={(next) => handleToggle(w._id, next)} />
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(w._id)}>
                    <Icon name="trash" size={13} />
                  </Button>
                </Row>
              </Row>
            </Card>
          ))}
        </Stack>
      )}
    </Card>
  );

  const tipsSidebar = (
    <AccountSidebarPanel title="How alerts work">
      <Stack gap={3}>
        <Muted>Empty fields are wildcards — all set criteria must match.</Muted>
        <Muted>Pause a watchlist anytime without deleting its rules.</Muted>
        <Muted>Matches fire push, Telegram, and in-app notifications.</Muted>
      </Stack>
    </AccountSidebarPanel>
  );

  return (
    <Container size="2xl">
      <Stack gap={6}>
        <StudioPageHeader
          eyebrow="Account · Alerts"
          title="Watchlists"
          sub="Custom alert rules that fire push, Telegram, and in-app notifications when a matching pick is published or a line moves."
        />

        <AccountRefineCard
          title="New watchlist"
          sub="Empty fields act as wildcards. Combine criteria — alerts fire when ALL set fields match."
          summary={
            watchlists === undefined
              ? 'Loading…'
              : `${watchlists.length} saved · ${watchlists.filter((w) => w.isActive).length} active`
          }
          onReset={
            name || Object.values(draft).some(Boolean)
              ? () => {
                  setName('');
                  setDraft(EMPTY_DRAFT);
                  setError(null);
                }
              : undefined
          }
        >
          <Stack gap={3}>
            <Field label="Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. EPL goalscorer props"
                maxLength={80}
              />
            </Field>

            <Row gap={3} wrap>
              <Field label="Sport">
                <Select
                  value={draft.sport}
                  onChange={(e) => setDraft({ ...draft, sport: e.target.value })}
                >
                  {SPORTS.map((s) => (
                    <option key={s || 'any'} value={s}>
                      {s || 'Any'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="League">
                <Input
                  value={draft.league}
                  onChange={(e) => setDraft({ ...draft, league: e.target.value })}
                  placeholder="e.g. EPL"
                />
              </Field>
              <Field label="Market">
                <Input
                  value={draft.market}
                  onChange={(e) => setDraft({ ...draft, market: e.target.value })}
                  placeholder="e.g. Spread"
                />
              </Field>
            </Row>

            <Row gap={3} wrap>
              <Field label="Min confidence">
                <Select
                  value={draft.minConfidence}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      minConfidence: e.target.value as '' | ConfidenceLevel,
                    })
                  }
                >
                  {CONFIDENCE.map((c) => (
                    <option key={c || 'any'} value={c}>
                      {c || 'Any'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Access tier">
                <Select
                  value={draft.access}
                  onChange={(e) => setDraft({ ...draft, access: e.target.value })}
                >
                  {ACCESS.map((a) => (
                    <option key={a || 'any'} value={a}>
                      {a || 'Any'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Body contains" help="Case-insensitive substring.">
                <Input
                  value={draft.bodyContains}
                  onChange={(e) => setDraft({ ...draft, bodyContains: e.target.value })}
                  placeholder="e.g. CLV"
                />
              </Field>
            </Row>

            <Field
              label="Line move ≥ (%)"
              help="Triggers when implied-probability shifts by at least this much."
            >
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={draft.lineMoveAbovePercent}
                onChange={(e) => setDraft({ ...draft, lineMoveAbovePercent: e.target.value })}
                placeholder="e.g. 5"
              />
            </Field>

            {error ? <Muted>{error}</Muted> : null}

            <Row gap={2}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreate}
                disabled={busy || !name.trim()}
              >
                <Icon name="plus" size={13} />
                Create watchlist
              </Button>
            </Row>
          </Stack>
        </AccountRefineCard>

        <AccountRefineCard
          title="Refine list"
          sub="Show active, paused, or all saved watchlists."
          summary={`${filtered?.length ?? 0} watchlist${(filtered?.length ?? 0) === 1 ? '' : 's'}`}
          onReset={statusFilter !== 'all' ? () => setStatusFilter('all') : undefined}
        >
          <StudioFilterPills
            options={STATUS_PILLS.map((p) => ({ value: p.id, label: p.label }))}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
          />
        </AccountRefineCard>

        <StudioDashLayout>
          <StudioDashCol span={8}>{listPane}</StudioDashCol>
          <StudioDashCol span={4}>{tipsSidebar}</StudioDashCol>
        </StudioDashLayout>

        <QuickActionGrid title="Related" items={accountCrossLinks('watchlists', navigate)} />
      </Stack>
    </Container>
  );
}

function summarizeFilter(f: {
  sport?: string;
  league?: string;
  market?: string;
  minConfidence?: string;
  access?: string;
  bodyContains?: string;
  lineMoveAbovePercent?: number;
}): React.ReactNode {
  const parts: React.ReactNode[] = [];
  if (f.sport) parts.push(`sport=${f.sport}`);
  if (f.league) parts.push(`league=${f.league}`);
  if (f.market) parts.push(`market=${f.market}`);
  if (f.minConfidence) parts.push(`≥${f.minConfidence}`);
  if (f.access) parts.push(`access=${f.access}`);
  if (f.bodyContains) parts.push(`text~"${f.bodyContains}"`);
  if (typeof f.lineMoveAbovePercent === 'number') {
    parts.push(`line≥${f.lineMoveAbovePercent}%`);
  }
  if (parts.length === 0) return <Muted>No filters — matches every pick.</Muted>;
  return (
    <Mono>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 ? ' · ' : ''}
          {p}
        </span>
      ))}
    </Mono>
  );
}
