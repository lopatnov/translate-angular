import { expect, test } from '@playwright/test';

test.describe('Speech to text', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transcribe');
  });

  test('has page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Speech to text' }),
    ).toBeVisible();
  });

  test('audio file input accepts only .wav files', async ({ page }) => {
    const input = page.locator('#audio-file');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('accept', '.wav');
  });

  test('language select includes Auto-detect option', async ({ page }) => {
    const select = page.locator('#stt-lang');
    await expect(select).toBeVisible();
    await expect(
      select.locator('option', { hasText: 'Auto-detect' }),
    ).toBeAttached();
  });

  test('language format select is present', async ({ page }) => {
    await expect(page.locator('#stt-fmt')).toBeVisible();
  });

  test('Transcribe button is disabled without a file selected', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: 'Transcribe' }),
    ).toBeDisabled();
  });

  test('Clear button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  test('audio format hint is shown', async ({ page }) => {
    await expect(page.getByText('Only WAV format is supported.')).toBeVisible();
  });
});
