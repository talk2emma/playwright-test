import { test, expect } from '@fixtures/test';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';

/**
 * END-TO-END SUITE
 *
 * Purpose: walk through a complete user journey exactly as a real person
 * would, entirely through the UI, from start to finish. No API shortcuts are
 * used here — that is the point of an E2E test.
 *
 * `test.step()` groups actions into named steps. Each step appears as a
 * collapsible section in the HTML report and trace viewer, so when the
 * journey fails you can see immediately which stage broke.
 */
test.describe('Authentication user journey', { tag: '@e2e' }, () => {
  test('new user registers, logs out, and logs back in', async ({
    loginPage,
    registerPage,
    homePage,
    newUser,
  }) => {
    await test.step('Start on the login page and navigate to registration', async () => {
      await loginPage.goto();
      await loginPage.goToRegister();
      await registerPage.expectToBeOnPage();
    });

    await test.step('Register a brand-new account', async () => {
      await registerPage.register(newUser);
      await homePage.expectLoggedInAs(newUser.email);
    });

    await test.step('Log out', async () => {
      await homePage.logout();
      await loginPage.expectToBeOnPage();
    });

    await test.step('Log back in with the same credentials', async () => {
      await loginPage.login(newUser);
      await homePage.expectLoggedInAs(newUser.email);
    });

    await test.step('Log out again and confirm protected pages are blocked', async () => {
      await homePage.logout();
      await loginPage.expectToBeOnPage();
      await expect(homePage.userEmailDisplay).toBeHidden();
    });
  });

  test('account registered in one browser session can log in from a new session', async ({
    browser,
    registerPage,
    homePage,
    newUser,
  }) => {
    await test.step('Register in the first session', async () => {
      await registerPage.goto();
      await registerPage.register(newUser);
      await homePage.expectLoggedInAs(newUser.email);
    });

    await test.step('Log in from a completely separate session (no shared cookies/storage)', async () => {
      // `browser.newContext()` is like opening a new incognito window: nothing
      // from the first session carries over, proving the account really exists
      // on the server and is not just remembered by the browser.
      const secondContext = await browser.newContext();
      const secondPage = await secondContext.newPage();
      const secondLoginPage = new LoginPage(secondPage);
      const secondHomePage = new HomePage(secondPage);

      await secondLoginPage.goto();
      await secondLoginPage.login(newUser);
      await secondHomePage.expectLoggedInAs(newUser.email);

      await secondContext.close();
    });
  });
});
