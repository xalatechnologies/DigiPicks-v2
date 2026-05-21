import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  Container,
  Stack,
  Button,
  StudioPageHeader,
  AdminMetricStrip,
  AdminSettingsPanel,
  AdminSettingsEditDrawer,
} from '@digipicks/ds';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

const ENV_ROWS = [
  { key: 'Stripe', value: 'Configured via Convex env (STRIPE_SECRET_KEY)' },
  { key: 'Web base URL', value: 'WEB_BASE_URL' },
  { key: 'Grace period', value: 'GRACE_PERIOD_DAYS (default 3)' },
];

function useSettingsParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('id') as Id<'platformSettings'> | 'new' | null;
  const compose = searchParams.get('compose') === '1';

  const setEditId = (id: Id<'platformSettings'> | 'new' | null) => {
    const params = new URLSearchParams(searchParams);
    params.delete('compose');
    if (id === 'new') {
      params.set('compose', '1');
      params.delete('id');
    } else if (id) {
      params.set('id', id);
    } else {
      params.delete('id');
    }
    setSearchParams(params, { replace: true });
  };

  return { editId, compose, setEditId };
}

export function SettingsAdmin() {
  const { editId, compose, setEditId } = useSettingsParams();
  const settings = useQuery(api.admin.platformSettingsList, {});
  const upsert = useMutation(api.admin.platformSettingsUpsert);

  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(() => settings?.find((s) => s._id === editId) ?? null, [settings, editId]);

  React.useEffect(() => {
    if (compose) {
      setKey('');
      setValue('');
    } else if (active) {
      setKey(active.key);
      setValue(active.value);
    }
  }, [compose, active?._id]);

  const settingRows = useMemo(() => {
    if (!settings) return [];
    return settings.map((row) => ({
      id: row._id,
      key: row.key,
      value: row.value,
      updatedLabel: new Date(row.updatedAt).toLocaleDateString(),
    }));
  }, [settings]);

  const kpiItems = useMemo(
    () => [
      { label: 'Env keys', value: String(ENV_ROWS.length) },
      { label: 'Custom settings', value: settings ? String(settings.length) : '—' },
      { label: 'Editable', value: 'Yes' },
      { label: 'Audit trail', value: 'On' },
      { label: 'Stripe', value: 'Live' },
    ],
    [settings],
  );

  async function handleSave() {
    setError(null);
    setBusy(true);
    try {
      await upsert({ key, value });
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save setting.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container size="2xl">
      <Stack gap={10}>
        <StudioPageHeader
          eyebrow="Operational hub"
          title="System settings"
          sub="Platform configuration — env-backed values read-only; custom keys editable below."
          actions={
            <Button variant="primary" iconLeft="plus" onClick={() => setEditId('new')}>
              New setting
            </Button>
          }
        />

        <AdminMetricStrip columns={5} items={kpiItems} />

        <AdminSettingsPanel
          envRows={ENV_ROWS}
          settings={settingRows}
          onEditSetting={(id) => setEditId(id as Id<'platformSettings'>)}
        />
      </Stack>

      <AdminSettingsEditDrawer
        open={compose || Boolean(editId)}
        onClose={() => setEditId(null)}
        settingKey={key}
        value={value}
        onKeyChange={setKey}
        onValueChange={setValue}
        onSave={handleSave}
        busy={busy}
        error={error}
        isNew={compose}
      />
    </Container>
  );
}
