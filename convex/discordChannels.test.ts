/// <reference types="vite/client" />
import { convexTest } from './__tests__/setup.test';
import { describe, expect, test } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

async function setupCreator(t: ReturnType<typeof convexTest>) {
  const creatorId = await t.mutation(internal.creators.create, {
    handle: '@discordtest',
    name: 'Discord Test',
    avatarColor: '#5865F2',
    avatarMono: 'DT',
    niche: 'NFL',
    sports: ['NFL'],
    bio: 'fixture',
    startingPrice: 19,
    tags: ['NFL'],
  });
  const ownerUserId = await t.run(async (ctx) =>
    ctx.db.insert('users', { role: 'user', isActive: true, creatorId }),
  );
  return { creatorId, ownerUserId };
}

describe('discord channel sync', () => {
  test('configure inbound sync and list for creator', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, ownerUserId } = await setupCreator(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    const integrationId = await t.run(async (ctx) =>
      ctx.db.insert('discordIntegrations', {
        creatorId,
        guildId: 'guild-fixture-1',
        guildName: 'Test Guild',
        status: 'connected',
        botInstalled: true,
        connectedByUserId: ownerUserId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );

    await asOwner.mutation(api.discord.channels.configureChannelSync, {
      integrationId,
      channelId: 'chan-inbound-1',
      channelName: 'picks-chat',
      syncDirection: 'inbound',
      isEnabled: true,
    });

    const listed = await asOwner.query(api.discord.channels.listChannelSyncs, {
      creatorId,
      syncDirection: 'inbound',
    });
    expect(listed).toHaveLength(1);
    expect(listed[0]!.channelName).toBe('picks-chat');
  });
});
