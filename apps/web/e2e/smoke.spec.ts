import { test, expect } from '@playwright/test';

test.describe('public smoke', () => {
  test('home loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /DigiPicks home/i })).toBeVisible();
  });

  test('legal terms loads', async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible();
  });

  test('trust verification loads', async ({ page }) => {
    await page.goto('/trust/verification');
    await expect(page.getByRole('heading', { name: /creator verification/i })).toBeVisible();
  });
});
