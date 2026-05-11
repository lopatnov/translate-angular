import { expect, test } from '@playwright/test';

test.describe('Text translation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/translate');
	});

	test('has page heading', async ({ page }) => {
		await expect(
			page.getByRole('heading', { name: 'Text translation' }),
		).toBeVisible();
	});

	test('source language select includes Auto-detect', async ({ page }) => {
		const select = page.locator('#src-lang');
		await expect(select).toBeVisible();
		await expect(select.locator('option', { hasText: 'Auto-detect' })).toBeAttached();
	});

	test('target language select is present', async ({ page }) => {
		await expect(page.locator('#tgt-lang')).toBeVisible();
	});

	test('text input area is present', async ({ page }) => {
		await expect(page.locator('#text-input')).toBeVisible();
	});

	test('model input is present', async ({ page }) => {
		await expect(page.locator('#model-input')).toBeVisible();
	});

	test('language format select is present', async ({ page }) => {
		await expect(page.locator('#lang-fmt')).toBeVisible();
	});

	test('Translate button is disabled when text is empty', async ({ page }) => {
		await expect(
			page.getByRole('button', { name: 'Translate' }),
		).toBeDisabled();
	});

	test('Translate button enables after typing text', async ({ page }) => {
		await page.locator('#text-input').fill('Hello world');
		await expect(
			page.getByRole('button', { name: 'Translate' }),
		).toBeEnabled();
	});

	test('Clear button resets the text input', async ({ page }) => {
		await page.locator('#text-input').fill('Hello world');
		await page.getByRole('button', { name: 'Clear' }).click();
		await expect(page.locator('#text-input')).toHaveValue('');
	});

	test('Clear button re-disables the Translate button', async ({ page }) => {
		await page.locator('#text-input').fill('Hello world');
		await page.getByRole('button', { name: 'Clear' }).click();
		await expect(
			page.getByRole('button', { name: 'Translate' }),
		).toBeDisabled();
	});
});
