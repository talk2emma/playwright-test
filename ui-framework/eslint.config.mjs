// ESLint "flat config" (the modern ESLint format).
// - @eslint/js            → core JavaScript best-practice rules
// - typescript-eslint     → TypeScript-aware rules
// - eslint-plugin-playwright → Playwright rules, e.g. "no waitForTimeout",
//   "no focused tests (test.only)", "always await expect"
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  // Never lint generated output.
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Apply the Playwright rule set only to test and framework source files.
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts', 'src/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Hard waits make tests slow and flaky — rely on auto-waiting instead.
      'playwright/no-wait-for-timeout': 'error',
      // Forgetting `await` on a Playwright call is the #1 cause of flaky tests.
      'playwright/missing-playwright-await': 'error',
      // test.only must never be committed (also enforced by forbidOnly in CI).
      'playwright/no-focused-test': 'error',
      // Assertions live inside page-object helpers named `expectSomething()`
      // (e.g. loginPage.expectFormVisible()), so tell the linter those count.
      'playwright/expect-expect': ['error', { assertFunctionPatterns: ['^expect[A-Z]'] }],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
);
