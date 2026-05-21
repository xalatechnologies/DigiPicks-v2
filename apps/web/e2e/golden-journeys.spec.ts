import { test, expect } from '@playwright/test';

/**
 * Golden journeys from docs/functionality-index.md.
 * Public / marketing routes run without Convex auth.
 * Auth-heavy flows are scaffolded with test.skip until CI has Convex + test users.
 */

test.describe('J1 — visitor registration (public entry)', () => {
  test('auth page loads', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible();
  });
});

test.describe('J2 — creator apply (public)', () => {
  test('apply page prompts for subscriber account when signed out', async ({ page }) => {
    await page.goto('/apply');
    await expect(page.getByRole('heading', { name: /apply|creator/i })).toBeVisible();
    await expect(page.getByText(/subscriber account required/i)).toBeVisible();
  });
});

test.describe('J3 — subscribe flow (requires Convex)', () => {
  test.skip('customer subscribes and unlocks premium', async () => {
    // Wire with Stripe test mode + seeded creator when E2E env is available.
  });
});

test.describe('J4 — live feed (requires auth)', () => {
  test.skip('published pick appears in subscriber feed', async () => {});
});

test.describe('J5 — grading (requires auth)', () => {
  test.skip('graded pick updates analytics', async () => {});
});

test.describe('J6 — custom event (requires creator + admin)', () => {
  test.skip('creator event → admin approve → attach pick', async () => {});
});

test.describe('J7 — saved picks (requires auth)', () => {
  test.skip('save pick updates results dashboard', async () => {});
});

test.describe('J8 — livestream (requires creator)', () => {
  test.skip('go-live notifies subscribers', async () => {});
});

test.describe('J9 — admin suspend (requires admin)', () => {
  test.skip('suspended content removes access + audit', async () => {});
});

test.describe('J10 — odds update (requires Convex cron)', () => {
  test('odds intel page loads', async ({ page }) => {
    await page.goto('/odds');
    await expect(page.getByRole('heading', { name: /compare the books/i })).toBeVisible();
  });
});

test.describe('trust & legal surfaces (Phase B)', () => {
  const routes: { path: string; heading: RegExp }[] = [
    { path: '/pricing', heading: /^pricing$/i },
    { path: '/trust/verification', heading: /creator verification/i },
    { path: '/trust/results-methodology', heading: /results methodology/i },
    { path: '/trust/disputes', heading: /^disputes$/i },
    { path: '/responsible-betting', heading: /responsible betting/i },
    { path: '/legal/terms', heading: /terms of service/i },
    { path: '/legal/privacy', heading: /^privacy$/i },
    { path: '/legal/age', heading: /age restriction/i },
  ];

  for (const { path, heading } of routes) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    });
  }
});
