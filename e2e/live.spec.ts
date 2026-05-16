import { expect, test } from '@playwright/test';

test.describe('Live translation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/live');
  });

  test('has page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Live translation' }),
    ).toBeVisible();
  });

  test('source language input is present', async ({ page }) => {
    await expect(page.locator('#live-src')).toBeVisible();
  });

  test('target language input is present', async ({ page }) => {
    await expect(page.locator('#live-tgt')).toBeVisible();
  });

  test('model select is present', async ({ page }) => {
    await expect(page.locator('#live-model')).toBeVisible();
  });

  test('sensitivity select is present', async ({ page }) => {
    await expect(page.locator('#live-sens')).toBeVisible();
  });

  test('Start button is present when idle', async ({ page }) => {
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('intro hint text is shown when idle', async ({ page }) => {
    await expect(page.getByText(/Press.*Start.*to begin/)).toBeVisible();
  });
});
