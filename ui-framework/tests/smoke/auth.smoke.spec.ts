import { test } from '@fixtures/test';

/**
 * SMOKE SUITE
 *
 * Purpose: a small, fast set of checks that answer one question —
 * "Is the core of Registration and Login working at all?"
 * Run it first (e.g. right after a deployment); if it fails, there is no
 * point running the slower suites.
 *
 * Tags: every test here is tagged `@smoke` AND `@regression`, because the
 * smoke checks are also part of the full regression suite.
 *   npm run test:smoke       → runs only @smoke
 *   npm run test:regression  → runs @regression (which includes these)
 */
test.describe('Authentication smoke', { tag: ['@smoke', '@regression'] }, () => {
  test('login page loads with all form fields', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.expectFormVisible();
  });

  test('register page loads with all form fields', async ({ registerPage }) => {
    await registerPage.goto();
    await registerPage.expectFormVisible();
  });

  test('new user can register with valid details', async ({ registerPage, homePage, newUser }) => {
    await registerPage.goto();
    await registerPage.register(newUser);

    // A successful registration logs the user in and lands on the home page.
    await homePage.expectLoggedInAs(newUser.email);
  });

  test('registered user can log in with valid credentials', async ({
    loginPage,
    homePage,
    registeredUser,
  }) => {
    // `registeredUser` was already created through the API by the fixture.
    await loginPage.goto();
    await loginPage.login(registeredUser);

    await homePage.expectLoggedInAs(registeredUser.email);
  });
});
