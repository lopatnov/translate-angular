import { expect, test } from '@playwright/test';

test.describe('Language detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/detect');
  });

  test('has page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Language detection' }),
    ).toBeVisible();
  });

  test('language format select is present', async ({ page }) => {
    await expect(page.locator('#fmt-detect')).toBeVisible();
  });

  test('text input area is present', async ({ page }) => {
    await expect(page.locator('#detect-text')).toBeVisible();
  });

  test('Detect language button is disabled when text is empty', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: 'Detect language' }),
    ).toBeDisabled();
  });

  test('Detect language button enables after typing', async ({ page }) => {
    await page.locator('#detect-text').fill('Bonjour le monde');
    await expect(
      page.getByRole('button', { name: 'Detect language' }),
    ).toBeEnabled();
  });

  test('Clear button resets the text input', async ({ page }) => {
    await page.locator('#detect-text').fill('Test');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.locator('#detect-text')).toHaveValue('');
  });

  test('Clear button re-disables the Detect button', async ({ page }) => {
    await page.locator('#detect-text').fill('Test');
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(
      page.getByRole('button', { name: 'Detect language' }),
    ).toBeDisabled();
  });
});
