import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Parent class for every Page Object.
 *
 * The Page Object Model (POM) gives each screen of the app its own class that
 * holds that screen's locators and the actions a user can take on it. Tests
 * then read like plain English (`loginPage.login(user)`), and when the UI
 * changes, you fix one page class instead of every test.
 *
 * `BasePage` holds the behaviour that every page shares, so child classes
 * don't repeat it.
 */
export abstract class BasePage {
  /**
   * The relative URL of the page, e.g. `/login`. Each child class sets its own.
   * Combined with `baseURL` from playwright.config.ts to build the full address.
   */
  protected abstract readonly path: string;

  /**
   * @param page - The Playwright `Page` (browser tab) this object controls.
   *               Injected by the fixtures in src/fixtures/test.ts.
   */
  constructor(protected readonly page: Page) {}

  /**
   * Opens this page in the browser.
   * Playwright automatically waits for the page's `load` event before returning.
   */
  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /**
   * Asserts the browser is currently on this page.
   * A relative path is resolved against `baseURL`, so `/login` must match the
   * full URL exactly. `toHaveURL` retries until the URL matches or the timeout
   * expires, so it works even if a redirect is still in progress.
   */
  async expectToBeOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(this.path);
  }

  /**
   * Asserts a toast/notification with the given text is visible.
   * EventHub shows server errors (e.g. "Invalid email or password") as short
   * toasts. `toBeVisible` retries, so we catch the toast as soon as it appears.
   *
   * @param message - The exact text expected in the toast.
   */
  async expectToastMessage(message: string): Promise<void> {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible();
  }

  /**
   * Asserts an inline validation message (shown under a form field) is visible.
   *
   * @param message - The exact validation text, e.g. "Enter a valid email".
   */
  async expectFieldError(message: string): Promise<void> {
    await expect(this.fieldError(message)).toBeVisible();
  }

  /**
   * Returns a locator for an inline validation message.
   * Exposed so tests can assert the message is *not* shown when appropriate.
   *
   * @param message - The exact validation text.
   */
  fieldError(message: string): Locator {
    return this.page.getByText(message, { exact: true });
  }
}
