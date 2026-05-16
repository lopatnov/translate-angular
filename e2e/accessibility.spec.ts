import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { join } from 'node:path';

/**
 * Path to the axe-core browser bundle.
 * Resolved relative to the project root (Playwright's cwd when running tests).
 */
const axeScript = join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');

/**
 * Inject axe-core and run it against the current page.
 * Returns only violations with impact "serious" or "critical" (WCAG AA fails).
 */
async function runAxe(page: Page) {
  await page.addScriptTag({ path: axeScript });
  return page.evaluate(async () => {
    type AxeViolation = { impact: string; id: string; description: string; nodes: unknown[] };
    const { violations } = await (window as Window & { axe: { run: () => Promise<{ violations: AxeViolation[] }> } }).axe.run();
    return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  });
}

function axeAssert(violations: { impact: string; id: string; description: string; nodes: unknown[] }[], route: string) {
  expect(
    violations,
    `Critical/serious axe violations on ${route}:\n${JSON.stringify(violations, null, 2)}`,
  ).toHaveLength(0);
}

test.describe('Accessibility (axe-core WCAG AA)', () => {
  test('Dashboard — no critical/serious violations', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('.spinner-border, [role="alert"], .row.g-4')
      .waitFor({ timeout: 15_000 })
      .catch(() => {/* loading timeout OK — axe still runs on current state */});
    axeAssert(await runAxe(page), '/');
  });

  test('Text translation — no critical/serious violations', async ({ page }) => {
    await page.goto('/translate');
    axeAssert(await runAxe(page), '/translate');
  });

  test('Language detection — no critical/serious violations', async ({ page }) => {
    await page.goto('/detect');
    axeAssert(await runAxe(page), '/detect');
  });

  test('Localization files — no critical/serious violations', async ({ page }) => {
    await page.goto('/localize');
    axeAssert(await runAxe(page), '/localize');
  });

  test('Speech to text — no critical/serious violations', async ({ page }) => {
    await page.goto('/transcribe');
    axeAssert(await runAxe(page), '/transcribe');
  });

  test('Text to speech — no critical/serious violations', async ({ page }) => {
    await page.goto('/synthesize');
    axeAssert(await runAxe(page), '/synthesize');
  });

  test('Speech to speech — no critical/serious violations', async ({ page }) => {
    await page.goto('/translate-audio');
    axeAssert(await runAxe(page), '/translate-audio');
  });
});
