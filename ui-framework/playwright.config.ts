import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

/**
 * Playwright configuration — controls HOW tests run.
 * Full reference: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Folder Playwright scans for `*.spec.ts` files.
  testDir: './tests',

  // Run tests inside each file in parallel too, not only files in parallel.
  // Safe because every test creates its own random user and its own browser context.
  fullyParallel: true,

  // Fail the CI build if someone accidentally commits `test.only`.
  forbidOnly: env.isCI,

  // Retry failed tests on CI only. A test that passes on retry is marked
  // "flaky" in the report so it can be investigated, rather than hidden.
  retries: env.isCI ? 2 : 0,

  // Parallel worker processes. Kept modest on CI because the target is a shared
  // public practice site; locally Playwright picks a value from CPU cores.
  workers: env.isCI ? 2 : undefined,

  // Maximum time one test may run (including fixtures/hooks).
  timeout: 60_000,

  // Maximum time each `expect(...)` assertion keeps retrying before failing.
  expect: { timeout: 10_000 },

  // Reporters: what output is produced.
  // Locally:
  //  - list   → live progress in the terminal
  //  - html   → interactive report (open with `npm run report`)
  //  - junit  → XML for test-management tools
  // On CI each browser runs in its own parallel job, so each job writes a
  // "blob" (raw results). A final CI job merges all blobs into ONE html +
  // junit report. `github` adds failure annotations to the Actions run.
  reporter: env.isCI
    ? [['list'], ['github'], ['blob']]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ],

  // Shared settings for every test.
  use: {
    // Lets tests use relative paths: page.goto('/login').
    baseURL: env.baseUrl,

    // Debugging artifacts — captured only when useful to keep runs fast:
    trace: 'on-first-retry', // full time-travel trace (DOM, network, console)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Per-action and navigation timeouts.
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    // Matches the `data-testid` attribute used by the EventHub developers.
    testIdAttribute: 'data-testid',
  },

  // Browsers to run against. Pick one with `--project=chromium`.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Where screenshots, videos and traces are written.
  outputDir: 'test-results',
});
