import { expect, test } from '@playwright/test';

test.describe('Localization files', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/localize');
	});

	test('has page heading', async ({ page }) => {
		await expect(
			page.getByRole('heading', { name: 'Localization files' }),
		).toBeVisible();
	});

	test('source language select is present', async ({ page }) => {
		await expect(page.locator('#loc-src')).toBeVisible();
	});

	test('target language select is present', async ({ page }) => {
		await expect(page.locator('#loc-tgt')).toBeVisible();
	});

	test('model select is present', async ({ page }) => {
		await expect(page.locator('#loc-model')).toBeVisible();
	});

	test('language format select is present', async ({ page }) => {
		await expect(page.locator('#loc-fmt')).toBeVisible();
	});

	test('JSON source textarea is present', async ({ page }) => {
		await expect(page.locator('#json-src')).toBeVisible();
	});

	test('Upload JSON button is present', async ({ page }) => {
		await expect(page.getByText('Upload JSON')).toBeVisible();
	});

	test('Translate JSON button is disabled when textarea is empty', async ({
		page,
	}) => {
		await expect(
			page.getByRole('button', { name: 'Translate JSON' }),
		).toBeDisabled();
	});

	test('Translate JSON button enables after entering valid JSON', async ({
		page,
	}) => {
		await page.locator('#json-src').fill('{"greeting": "Hello"}');
		await expect(
			page.getByRole('button', { name: 'Translate JSON' }),
		).toBeEnabled();
	});

	test('Clear button resets the JSON textarea', async ({ page }) => {
		await page.locator('#json-src').fill('{"greeting": "Hello"}');
		await page.getByRole('button', { name: 'Clear' }).click();
		await expect(page.locator('#json-src')).toHaveValue('');
	});

	test('existing translation section is collapsible', async ({ page }) => {
		// The optional "Existing translation" panel is rendered as a <details> element.
		const details = page.locator('details');
		await expect(details).toBeAttached();
	});
});
