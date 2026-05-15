import { expect, test } from '@playwright/test';

test.describe('Speech to speech', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/translate-audio');
  });

  test('has page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Speech to speech' }),
    ).toBeVisible();
  });

  test('audio file input accepts only .wav files', async ({ page }) => {
    const input = page.locator('#sts-file');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('accept', '.wav');
  });

  test('source language select is present', async ({ page }) => {
    await expect(page.locator('#sts-src')).toBeVisible();
  });

  test('target language select is present', async ({ page }) => {
    await expect(page.locator('#sts-tgt')).toBeVisible();
  });

  test('speaker input is present', async ({ page }) => {
    await expect(page.locator('#sts-voice')).toBeVisible();
  });

  test('Translate button is disabled without a file selected', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: 'Translate' }),
    ).toBeDisabled();
  });

  test('Clear button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  test('WAV format hint is shown', async ({ page }) => {
    await expect(page.getByText('Only WAV format is supported.')).toBeVisible();
  });
});
