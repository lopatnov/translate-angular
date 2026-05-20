import { expect, test } from '@playwright/test';

/**
 * Navigation smoke tests — verifies sidebar links and routing for all 5 pages.
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page title is set', async ({ page }) => {
    await expect(page).toHaveTitle(/Translate Studio/);
  });

  test('sidebar brand is visible', async ({ page }) => {
    await expect(page.getByText('Translate Studio')).toBeVisible();
  });

  test('sidebar has Dashboard link', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('sidebar has Text translation link', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'Text translation' }),
    ).toBeVisible();
  });

  test('sidebar has Language detection link', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'Language detection' }),
    ).toBeVisible();
  });

  test('sidebar has Localization files link', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'Localization files' }),
    ).toBeVisible();
  });

  test('sidebar has Speech to text link', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'Speech to text' }),
    ).toBeVisible();
  });

  test('navigates to /translate', async ({ page }) => {
    await page.getByRole('link', { name: 'Text translation' }).click();
    await expect(page).toHaveURL(/\/translate/);
    await expect(
      page.getByRole('heading', { name: 'Text translation' }),
    ).toBeVisible();
  });

  test('navigates to /detect', async ({ page }) => {
    await page.getByRole('link', { name: 'Language detection' }).click();
    await expect(page).toHaveURL(/\/detect/);
    await expect(
      page.getByRole('heading', { name: 'Language detection' }),
    ).toBeVisible();
  });

  test('navigates to /localize', async ({ page }) => {
    await page.getByRole('link', { name: 'Localization files' }).click();
    await expect(page).toHaveURL(/\/localize/);
    await expect(
      page.getByRole('heading', { name: 'Localization files' }),
    ).toBeVisible();
  });

  test('navigates to /transcribe', async ({ page }) => {
    await page.getByRole('link', { name: 'Speech to text' }).click();
    await expect(page).toHaveURL(/\/transcribe/);
    await expect(
      page.getByRole('heading', { name: 'Speech to text' }),
    ).toBeVisible();
  });
});
