import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the landing page a user sees after signing in or registering: `/`.
 *
 * For the Registration & Login scope we only need the parts of the top
 * navigation bar that prove *who* is logged in and let them log out.
 */
export class HomePage extends BasePage {
  protected readonly path = '/';

  /** Main hero heading "Discover & Book Amazing Events". */
  readonly heading: Locator;
  /** Email of the signed-in user, shown in the navigation bar. */
  readonly userEmailDisplay: Locator;
  /** "Logout" button in the navigation bar. */
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Discover & Book Amazing Events' });
    this.userEmailDisplay = page.getByTestId('user-email-display');
    this.logoutButton = page.getByTestId('logout-btn');
  }

  /** Clicks "Logout". The app then clears the session and redirects to `/login`. */
  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  /**
   * Asserts the user is signed in: home page URL, hero heading, the user's own
   * email in the navbar, and a Logout button. Checking the email (not just
   * "some" user) proves the *right* account is logged in.
   *
   * @param email - The email address expected in the navigation bar.
   */
  async expectLoggedInAs(email: string): Promise<void> {
    await this.expectToBeOnPage();
    await expect(this.heading).toBeVisible();
    await expect(this.userEmailDisplay).toHaveText(email);
    await expect(this.logoutButton).toBeVisible();
  }
}
