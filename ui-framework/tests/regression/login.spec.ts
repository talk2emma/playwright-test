import { test, expect } from '@fixtures/test';
import { Messages } from '@data/messages';
import { invalidEmails } from '@data/testData';
import { createUser } from '@data/userFactory';

/**
 * REGRESSION SUITE — Login
 *
 * Covers positive and negative sign-in scenarios, client-side validation,
 * session behaviour (logout, reload, protected routes) and navigation.
 */
test.describe('Login', { tag: '@regression' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test.describe('form validation', () => {
    test('submitting an empty form shows email and password errors', async ({ loginPage }) => {
      await loginPage.submitEmptyForm();

      await loginPage.expectFieldError(Messages.login.invalidEmail);
      await loginPage.expectFieldError(Messages.login.passwordTooShort);
      await loginPage.expectToBeOnPage();
    });

    for (const email of invalidEmails) {
      test(`rejects invalid email format: "${email}"`, async ({ loginPage }) => {
        await loginPage.login(createUser({ email }));

        await loginPage.expectFieldError(Messages.login.invalidEmail);
        await loginPage.expectToBeOnPage();
      });
    }

    test('rejects a password shorter than 6 characters', async ({ loginPage }) => {
      await loginPage.login(createUser({ password: '12345' }));

      await loginPage.expectFieldError(Messages.login.passwordTooShort);
      await loginPage.expectToBeOnPage();
    });
  });

  test.describe('authentication', () => {
    test('rejects a wrong password for an existing account', async ({
      loginPage,
      registeredUser,
    }) => {
      await loginPage.login({ ...registeredUser, password: '#WrongPass99' });

      await loginPage.expectToastMessage(Messages.login.invalidCredentials);
      await loginPage.expectToBeOnPage();
    });

    test('rejects an email that is not registered', async ({ loginPage, newUser }) => {
      // `newUser` has never been registered, so the server must reject it.
      await loginPage.login(newUser);

      await loginPage.expectToastMessage(Messages.login.invalidCredentials);
      await loginPage.expectToBeOnPage();
    });

    test('email is not case-sensitive', async ({ loginPage, homePage, registeredUser }) => {
      await loginPage.login({ ...registeredUser, email: registeredUser.email.toUpperCase() });

      await homePage.expectLoggedInAs(registeredUser.email);
    });
  });

  test.describe('session', () => {
    test('session persists after a page reload', async ({
      page,
      loginPage,
      homePage,
      registeredUser,
    }) => {
      await loginPage.login(registeredUser);
      await homePage.expectLoggedInAs(registeredUser.email);

      await page.reload();

      await homePage.expectLoggedInAs(registeredUser.email);
    });

    test('logout ends the session and returns to the login page', async ({
      loginPage,
      homePage,
      registeredUser,
    }) => {
      await loginPage.login(registeredUser);
      await homePage.expectLoggedInAs(registeredUser.email);

      await homePage.logout();

      await loginPage.expectToBeOnPage();
      await expect(homePage.userEmailDisplay).toBeHidden();
    });

    test('protected page redirects an anonymous user to login', async ({ page, loginPage }) => {
      await page.goto('/bookings');

      await loginPage.expectToBeOnPage();
    });
  });

  test.describe('security & UX', () => {
    test('password field masks its input', async ({ loginPage }) => {
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('"Register" link navigates to the registration page', async ({
      loginPage,
      registerPage,
    }) => {
      await loginPage.goToRegister();

      await registerPage.expectToBeOnPage();
      await registerPage.expectFormVisible();
    });
  });
});
