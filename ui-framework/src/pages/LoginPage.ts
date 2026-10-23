import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { UserCredentials } from '@data/userFactory';

/**
 * Page Object for the Sign-in screen: `/login`.
 *
 * Locator strategy (Playwright's recommended priority order):
 *   1. `getByRole` / `getByLabel` — what a real user or screen reader "sees".
 *   2. `getByTestId` — stable attributes added for testing.
 *   3. CSS/XPath — last resort only; they break when styling changes.
 */
export class LoginPage extends BasePage {
  protected readonly path = '/login';

  /** Page heading "Sign in to EventHub". */
  readonly heading: Locator;
  /** Email input. Found through its <label>, exactly as a user would identify it. */
  readonly emailInput: Locator;
  /** Password input. */
  readonly passwordInput: Locator;
  /** "Sign In" submit button. */
  readonly signInButton: Locator;
  /** "Register" link that leads to the registration page. */
  readonly registerLink: Locator;

  /**
   * Defines every locator once. Locators are *lazy*: creating one does not
   * touch the browser — Playwright only searches for the element when an
   * action (click, fill) or assertion runs, and it re-searches every time,
   * so locators never go "stale".
   */
  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Sign in to EventHub' });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.registerLink = page.getByRole('link', { name: 'Register' });
  }

  /**
   * Fills the form and clicks "Sign In". This is the main action of the page.
   * `fill()` clears the field first and auto-waits for it to be editable.
   *
   * @param user - Email and password to sign in with.
   */
  async login(user: UserCredentials): Promise<void> {
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.signInButton.click();
  }

  /** Clicks "Sign In" without filling anything — used to trigger client-side validation. */
  async submitEmptyForm(): Promise<void> {
    await this.signInButton.click();
  }

  /** Clicks the "Register" link to move to the registration page. */
  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Asserts all key elements of the login form are rendered.
   * Used by smoke tests to prove the page loaded correctly.
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeEnabled();
  }
}
