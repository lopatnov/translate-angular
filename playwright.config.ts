import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './e2e',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env['CI'],
	/* Retry on CI only */
	retries: process.env['CI'] ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env['CI'] ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env['CI'] ? 'github' : 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL for page.goto('/') calls */
		baseURL: 'http://localhost:4200',
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
	],

	/* Start the Angular dev server before running tests */
	webServer: {
		command: 'npm run start',
		url: 'http://localhost:4200',
		reuseExistingServer: !process.env['CI'],
		/* Allow up to 2 minutes for `ng serve` to complete its first build */
		timeout: 120_000,
	},
});
