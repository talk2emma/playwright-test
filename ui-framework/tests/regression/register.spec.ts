import { test, expect } from '@fixtures/test';
import { Messages } from '@data/messages';
import { invalidEmails, passwordGuidelines, weakPasswords } from '@data/testData';
import { createUser } from '@data/userFactory';

/**
 * REGRESSION SUITE — Registration
 *
 * Purpose: deep coverage of the registration form — validation rules,
 * error handling and navigation — so a change anywhere in the feature is
 * caught before release. Slower than smoke; runs daily and before releases.
 */
test.describe('Registration', { tag: '@regression' }, () => {
  // `beforeEach` runs before every test in this block: every test starts on /register.
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test.describe('form validation', () => {
    test('submitting an empty form shows email and password errors', async ({ registerPage }) => {
      await registerPage.submitEmptyForm();

      await registerPage.expectFieldError(Messages.register.invalidEmail);
      await registerPage.expectFieldError(Messages.register.passwordRequirementsNotMet);
      await registerPage.expectToBeOnPage();
    });

    // DATA-DRIVEN TEST: one test is generated per entry in `invalidEmails`.
    // Each gets its own name in the report, so you see exactly which input failed.
    for (const email of invalidEmails) {
      test(`rejects invalid email format: "${email}"`, async ({ registerPage }) => {
        await registerPage.register(createUser({ email }));

        await registerPage.expectFieldError(Messages.register.invalidEmail);
        await registerPage.expectToBeOnPage();
      });
    }

    for (const { password, reason } of weakPasswords) {
      test(`rejects weak password (${reason})`, async ({ registerPage }) => {
        await registerPage.register(createUser({ password }));

        await registerPage.expectFieldError(Messages.register.passwordRequirementsNotMet);
        await registerPage.expectToBeOnPage();
      });
    }

    test('rejects mismatched password confirmation', async ({ registerPage, newUser }) => {
      await registerPage.register(newUser, `${newUser.password}x`);

      await registerPage.expectFieldError(Messages.register.passwordsDoNotMatch);
      await registerPage.expectToBeOnPage();
    });

    test('displays all four password rules', async ({ registerPage }) => {
      await expect(registerPage.passwordGuidelines).toHaveText([...passwordGuidelines]);
    });
  });

  test.describe('business rules', () => {
    test('rejects an email that is already registered', async ({
      registerPage,
      registeredUser,
    }) => {
      await registerPage.register(registeredUser);

      await registerPage.expectToastMessage(Messages.register.emailAlreadyRegistered);
      await registerPage.expectToBeOnPage();
    });
  });

  test.describe('security & UX', () => {
    test('password fields mask their input', async ({ registerPage }) => {
      await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');
      await expect(registerPage.confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('"Sign in" link navigates to the login page', async ({ registerPage, loginPage }) => {
      await registerPage.goToLogin();

      await loginPage.expectToBeOnPage();
      await loginPage.expectFormVisible();
    });
  });
});
