/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';
import type { Id } from './_generated/dataModel';

const modules = import.meta.glob('./**/*.ts');

async function setup(t: ReturnType<typeof convexTest>) {
  const creatorId = await t.mutation(internal.creators.create, {
    handle: '@chatcreator',
    name: 'Chat Creator',
    avatarColor: '#1c9cf0',
    avatarMono: 'CC',
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

describe('channels', () => {
  test('create + list + getBySlug round trip', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, ownerUserId } = await setup(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await asOwner.mutation(api.channels.create, {
      creatorId,
      slug: 'nfl-room',
      name: 'NFL Room',
      description: 'Live NFL chat',
      type: 'public',
    });

    const listed = await t.query(api.channels.list, {});
    expect(listed.length).toBe(1);
    expect(listed[0].channel.slug).toBe('nfl-room');
    expect(listed[0].creator?.handle).toBe('@chatcreator');

    const bySlug = await t.query(api.channels.getBySlug, { slug: 'nfl-room' });
    expect(bySlug?.channel.name).toBe('NFL Room');
  });

  test('duplicate slug is rejected', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, ownerUserId } = await setup(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await asOwner.mutation(api.channels.create, {
      creatorId,
      slug: 'general',
      name: 'General',
      type: 'public',
    });

    await expect(
      asOwner.mutation(api.channels.create, {
        creatorId,
        slug: 'general',
        name: 'Duplicate',
        type: 'public',
      }),
    ).rejects.toThrow('slug already exists');
  });

  test('list filters out subscriber-only channels (Phase 4 visibility)', async () => {
    const t = convexTest(schema, modules);
    const { creatorId, ownerUserId } = await setup(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await asOwner.mutation(api.channels.create, {
      creatorId,
      slug: 'public-room',
      name: 'Public',
      type: 'public',
    });
    await asOwner.mutation(api.channels.create, {
      creatorId,
      slug: 'vip-room',
      name: 'VIP',
      type: 'subscriber',
    });

    const listed = await t.query(api.channels.list, {});
    expect(listed.map((l) => l.channel.slug)).toEqual(['public-room']);
  });

  test('non-owner creator cannot create a channel under another creator', async () => {
    const t = convexTest(schema, modules);
    const { creatorId } = await setup(t);

    const otherUserId = await t.run(async (ctx) =>
      ctx.db.insert('users', { role: 'user', isActive: true }),
    );

    await expect(
      t.withIdentity({ subject: otherUserId }).mutation(api.channels.create, {
        creatorId,
        slug: 'sneaky',
        name: 'Sneaky',
        type: 'public',
      }),
    ).rejects.toThrow();
  });
});

describe('channel messages', () => {
  async function setupChannel(t: ReturnType<typeof convexTest>) {
    const { creatorId, ownerUserId } = await setup(t);
    const channelId: Id<'channels'> = await t
      .withIdentity({ subject: ownerUserId })
      .mutation(api.channels.create, {
        creatorId,
        slug: 'room',
        name: 'Room',
        type: 'public',
      });
    return { creatorId, ownerUserId, channelId };
  }

  test('postToChannel + listByChannel round trip in chronological order', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId, channelId } = await setupChannel(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await asOwner.mutation(api.messages.postToChannel, {
      channelId,
      body: 'first',
    });
    await asOwner.mutation(api.messages.postToChannel, {
      channelId,
      body: 'second',
    });

    const messages = await t.query(api.messages.listByChannel, { channelId });
    expect(messages.map((m) => m.body)).toEqual(['first', 'second']);
    expect(messages[0].senderHandle).toBe('@chatcreator');
  });

  test('postToChannel rejects empty bodies', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId, channelId } = await setupChannel(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await expect(
      asOwner.mutation(api.messages.postToChannel, {
        channelId,
        body: '   ',
      }),
    ).rejects.toThrow('body required');
  });

  test('postToChannel rejects oversize bodies', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId, channelId } = await setupChannel(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });
    const huge = 'x'.repeat(2001);

    await expect(
      asOwner.mutation(api.messages.postToChannel, {
        channelId,
        body: huge,
      }),
    ).rejects.toThrow('under 2000');
  });

  test('postToChannel updates channel.lastMessageAt', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId, channelId } = await setupChannel(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await asOwner.mutation(api.messages.postToChannel, {
      channelId,
      body: 'hello',
    });

    const channel = await t.run(async (ctx) => ctx.db.get(channelId));
    expect(channel?.lastMessageAt).toBeDefined();
    expect(channel!.lastMessageAt).toBeGreaterThan(0);
  });

  test('listByChannel returns empty for archived channel', async () => {
    const t = convexTest(schema, modules);
    const { ownerUserId, channelId } = await setupChannel(t);
    const asOwner = t.withIdentity({ subject: ownerUserId });

    await asOwner.mutation(api.messages.postToChannel, {
      channelId,
      body: 'hi',
    });
    await asOwner.mutation(api.channels.update, {
      channelId,
      isActive: false,
    });

    const messages = await t.query(api.messages.listByChannel, { channelId });
    expect(messages).toEqual([]);
  });
});
