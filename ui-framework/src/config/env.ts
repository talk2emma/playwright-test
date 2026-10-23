import dotenv from 'dotenv';
import path from 'node:path';

/**
 * Central place for every environment-specific value.
 *
 * How it works:
 * 1. `dotenv.config()` reads a local `.env` file (if one exists) and copies its
 *    key/value pairs into `process.env`. In CI there is no `.env`; values come
 *    from GitHub Actions secrets/variables instead.
 * 2. Each setting falls back to a sensible default, so the framework works
 *    out of the box with zero configuration. We use `||` (not `??`) so an
 *    empty value — which GitHub Actions passes for an unset variable — also
 *    falls back to the default.
 * 3. Everything is exported as one read-only `env` object, so no other file
 *    ever touches `process.env` directly. This keeps configuration in one place.
 */
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

export const env = {
  /** Front-end URL. Used as Playwright's `baseURL`, so tests can call `page.goto('/login')`. */
  baseUrl: process.env.BASE_URL || 'https://eventhub.rahulshettyacademy.com',

  /** Back-end REST API URL. Used to create users fast for tests that need an existing account. */
  apiUrl: process.env.API_URL || 'https://api.eventhub.rahulshettyacademy.com/api',

  /** Password used for every generated test user. Emails are random; the password is fixed. */
  testPassword: process.env.TEST_PASSWORD || '#Test1234',

  /** `true` when running on a CI server (GitHub Actions sets `CI=true` automatically). */
  isCI: !!process.env.CI,
} as const;
