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

  test('language input includes Auto-detect datalist option', async ({ page }) => {
    // Language select renders as <input type="search"> + <datalist id="stt-lang-list">.
    await expect(page.locator('#stt-lang')).toBeVisible();
    await expect(
      page.locator('#stt-lang-list option', { hasText: 'Auto-detect' }),
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
