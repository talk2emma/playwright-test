import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { UserCredentials } from '@data/userFactory';

/**
 * Page Object for the "Create your account" screen: `/register`.
 *
 * The registration inputs have no linked <label>, but the developers added
 * `data-testid` attributes, so we use `getByTestId` — the next most stable
 * option after roles/labels. The confirm-password field has neither, so we
 * fall back to its placeholder text.
 */
export class RegisterPage extends BasePage {
  protected readonly path = '/register';

  /** Page heading "Create your account". */
  readonly heading: Locator;
  /** Email input (`data-testid="register-email"`). */
  readonly emailInput: Locator;
  /** Password input (`data-testid="register-password"`). */
  readonly passwordInput: Locator;
  /** Confirm-password input, located by its placeholder. */
  readonly confirmPasswordInput: Locator;
  /** "Create Account" submit button (`data-testid="register-btn"`). */
  readonly createAccountButton: Locator;
  /** The list of password rules shown under the password field. */
  readonly passwordGuidelines: Locator;
  /** "Sign in" link that leads back to the login page. */
  readonly signInLink: Locator;

  /** Defines every locator once (see LoginPage for why locators are lazy). */
  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Create your account' });
    this.emailInput = page.getByTestId('register-email');
    this.passwordInput = page.getByTestId('register-password');
    this.confirmPasswordInput = page.getByPlaceholder('Repeat your password');
    this.createAccountButton = page.getByTestId('register-btn');
    this.passwordGuidelines = page.locator('#password-guidelines').getByRole('listitem');
    this.signInLink = page.getByRole('link', { name: 'Sign in' });
  }

  /**
   * Completes the whole form and submits it.
   *
   * @param user - Email and password for the new account.
   * @param confirmPassword - Value for the "Confirm Password" field. Defaults to
   *                          `user.password`; pass something different to test
   *                          the "Passwords do not match" validation.
   */
  async register(user: UserCredentials, confirmPassword = user.password): Promise<void> {
    await this.fillForm(user, confirmPassword);
    await this.createAccountButton.click();
  }

  /**
   * Fills the three fields without submitting.
   * Split from `register()` so a test can inspect the form before submitting.
   */
  async fillForm(user: UserCredentials, confirmPassword = user.password): Promise<void> {
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /** Clicks "Create Account" with an empty form to trigger client-side validation. */
  async submitEmptyForm(): Promise<void> {
    await this.createAccountButton.click();
  }

  /** Clicks the "Sign in" link to move back to the login page. */
  async goToLogin(): Promise<void> {
    await this.signInLink.click();
  }

  /** Asserts all key elements of the registration form are rendered (used by smoke tests). */
  async expectFormVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.createAccountButton).toBeEnabled();
  }
}
