import { expect, test } from '@playwright/test';
import '@accesslint/playwright';

/**
 * AccessLint WCAG checks — 93 rules via @accesslint/core.
 *
 * Snapshot mode: known violations are stored in accessibility-snapshots/ and
 * committed to version control. Only NEW violations cause the test to fail,
 * so the suite stays green while regressions are caught immediately.
 *
 * To update snapshots after intentional markup changes:
 *   npx playwright test e2e/accesslint.spec.ts -u
 */
test.describe('AccessLint WCAG (snapshot baseline)', () => {
  test('Dashboard', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('.spinner-border, [role="alert"], .row.g-4')
      .waitFor({ timeout: 15_000 })
      .catch(() => {
        /* loading timeout OK — audit still runs on current state */
      });
    await expect(page).toBeAccessible({ snapshot: 'dashboard' });
  });

  test('Text translation', async ({ page }) => {
    await page.goto('/translate');
    await expect(page).toBeAccessible({ snapshot: 'text-translation' });
  });

  test('Language detection', async ({ page }) => {
    await page.goto('/detect');
    await expect(page).toBeAccessible({ snapshot: 'language-detection' });
  });

  test('Localization files', async ({ page }) => {
    await page.goto('/localize');
    await expect(page).toBeAccessible({ snapshot: 'localization-files' });
  });

  test('Speech to text', async ({ page }) => {
    await page.goto('/transcribe');
    await expect(page).toBeAccessible({ snapshot: 'speech-to-text' });
  });

  test('Text to speech', async ({ page }) => {
    await page.goto('/synthesize');
    await expect(page).toBeAccessible({ snapshot: 'text-to-speech' });
  });

  test('Speech to speech', async ({ page }) => {
    await page.goto('/translate-audio');
    await expect(page).toBeAccessible({ snapshot: 'speech-to-speech' });
  });
});
