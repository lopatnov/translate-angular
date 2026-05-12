import { expect, test } from '@playwright/test';

test.describe('Dashboard', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('has page heading', async ({ page }) => {
		await expect(
			page.getByRole('heading', { name: 'Dashboard' }),
		).toBeVisible();
	});

	test('shows loading, capabilities, or error — never blank', async ({
		page,
	}) => {
		// The page always shows one of: spinner (loading), capabilities grid, or error alert.
		const spinner = page.locator('.spinner-border');
		const errorAlert = page.locator('[role="alert"].alert-danger');
		const capsGrid = page.locator('.row.g-4');

		await expect(spinner.or(errorAlert).or(capsGrid)).toBeVisible({
			timeout: 15_000,
		});
	});

	test('resolves out of the loading state', async ({ page }) => {
		// Wait up to 15s for the spinner to disappear (gRPC call completes or times out).
		const spinner = page.locator('.spinner-border');
		await spinner.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {
			// Timeout is acceptable; the assertions below will verify the final state.
		});

		// After loading, either capabilities or an error must be shown.
		const errorAlert = page.locator('[role="alert"].alert-danger');
		const capsGrid = page.locator('.row.g-4');
		const hasError = await errorAlert.isVisible();
		const hasCaps = await capsGrid.isVisible();

		expect(
			hasError || hasCaps,
			'Expected either a capabilities grid or an error alert after loading',
		).toBe(true);
	});

	test('gRPC URL hint shown in sidebar', async ({ page }) => {
		// Footer always shows the configured gRPC target.
		await expect(page.getByText(/localhost:5100/)).toBeVisible();
	});
});
