import { test as base, expect } from '@playwright/test';
import { env } from '@config/env';
import { AuthApi } from '@api/AuthApi';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { createUser, type UserCredentials } from '@data/userFactory';

/**
 * Custom fixtures — the heart of the framework.
 *
 * WHAT IS A FIXTURE?
 * A fixture is something a test needs (a page object, a test user, an API
 * client). Instead of every test building these itself in `beforeEach`, a
 * test just *asks* for them by name:
 *
 *     test('...', async ({ loginPage, registeredUser }) => { ... });
 *
 * Playwright then:
 *   1. Creates only the fixtures that test asked for (lazy — nothing wasted).
 *   2. Runs the code before `await use(value)` as setup.
 *   3. Hands `value` to the test.
 *   4. Runs any code after `await use(...)` as teardown, even if the test failed.
 *
 * Every spec file imports `test` and `expect` from THIS file instead of from
 * '@playwright/test', so they all get these fixtures automatically.
 */
type Fixtures = {
  /** Page object for /login, bound to the current test's browser page. */
  loginPage: LoginPage;
  /** Page object for /register. */
  registerPage: RegisterPage;
  /** Page object for the signed-in home page. */
  homePage: HomePage;
  /** API client for creating test data quickly. */
  authApi: AuthApi;
  /** Fresh, random credentials that are NOT registered yet (for registration tests). */
  newUser: UserCredentials;
  /** Credentials for an account that ALREADY exists (created via API before the test). */
  registeredUser: UserCredentials;
};

export const test = base.extend<Fixtures>({
  // Each page-object fixture receives Playwright's built-in `page` fixture
  // (a fresh, isolated browser tab per test) and wraps it in a page object.
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  // `playwright.request.newContext` creates an HTTP client that is separate
  // from the browser. The trailing slash on baseURL matters: it makes relative
  // paths like 'auth/register' resolve to `<apiUrl>/auth/register`.
  // After the test finishes, `dispose()` closes the client to free resources.
  authApi: async ({ playwright }, use) => {
    const requestContext = await playwright.request.newContext({
      baseURL: `${env.apiUrl.replace(/\/$/, '')}/`,
    });
    await use(new AuthApi(requestContext));
    await requestContext.dispose();
  },

  // Generates a unique email + the configured password. Nothing is sent to
  // the server — the test itself will register this user through the UI.
  // (Playwright requires the first argument to be destructured, even when empty.)
  newUser: async ({}, use) => {
    await use(createUser());
  },

  // Creates the account through the API first, so login tests start from a
  // known, existing user without spending time on the registration UI.
  registeredUser: async ({ authApi }, use) => {
    const user = createUser();
    await authApi.register(user);
    await use(user);
  },
});

export { expect };
