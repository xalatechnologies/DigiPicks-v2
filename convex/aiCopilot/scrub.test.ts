/// <reference types="vite/client" />
import { describe, expect, test } from 'vitest';
import { scrub } from './scrub';

describe('aiCopilot/scrub', () => {
  test('redacts email addresses and emits a piiHash', async () => {
    // Note: the \S+ regex is greedy past the TLD, so a trailing period
    // attached to the email is consumed too. Real prompts almost always
    // have whitespace after the address, so this tradeoff is acceptable.
    const { body, piiHash } = await scrub('Hi, contact me at user@example.com today');
    expect(body).toBe('Hi, contact me at [redacted-email] today');
    expect(piiHash).toBeTypeOf('string');
    expect(piiHash).toHaveLength(16);
  });

  test('redacts PAN-shaped digit runs and emits a piiHash', async () => {
    const { body, piiHash } = await scrub('My card 4111111111111111 expired.');
    expect(body).toBe('My card [redacted-pan] expired.');
    expect(piiHash).toBeTypeOf('string');
    expect(piiHash).toHaveLength(16);
  });

  test('redacts both patterns under a single piiHash', async () => {
    const original = 'Email me at u@x.io now about card 4111111111111111 please.';
    const { body, piiHash } = await scrub(original);
    expect(body).toBe('Email me at [redacted-email] now about card [redacted-pan] please.');
    expect(piiHash).toBeTypeOf('string');
    expect(piiHash).toHaveLength(16);
  });

  test('clean body returns unchanged with no piiHash', async () => {
    const { body, piiHash } = await scrub(
      'Just a normal sports question — who do you like in the NBA tonight?',
    );
    expect(body).toBe('Just a normal sports question — who do you like in the NBA tonight?');
    expect(piiHash).toBeUndefined();
  });

  test('does not flag short numeric strings as PAN', async () => {
    const { body, piiHash } = await scrub('I went 12-3 last week with +5.5u.');
    expect(body).toBe('I went 12-3 last week with +5.5u.');
    expect(piiHash).toBeUndefined();
  });
});
