import { expect, test } from '@playwright/test';

test.describe('Text to speech', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/synthesize');
  });

  test('has page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Text to speech' }),
    ).toBeVisible();
  });

  test('text textarea is present', async ({ page }) => {
    await expect(page.locator('#tts-text')).toBeVisible();
  });

  test('voice/language select is present', async ({ page }) => {
    await expect(page.locator('#tts-lang')).toBeVisible();
  });

  test('speaker input is present', async ({ page }) => {
    await expect(page.locator('#tts-voice')).toBeVisible();
  });

  test('speed range is present with default value 1', async ({ page }) => {
    const range = page.locator('#tts-speed');
    await expect(range).toBeVisible();
    await expect(range).toHaveValue('1');
  });

  test('Synthesize button is disabled without text', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Synthesize' }),
    ).toBeDisabled();
  });

  test('Synthesize button is enabled when text is entered', async ({ page }) => {
    await page.locator('#tts-text').fill('Hello world');
    await expect(
      page.getByRole('button', { name: 'Synthesize' }),
    ).toBeEnabled();
  });

  test('Clear button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  });
});
