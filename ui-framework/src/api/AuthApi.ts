import { expect, type APIRequestContext } from '@playwright/test';
import type { UserCredentials } from '@data/userFactory';

/** Response body returned by the EventHub `/auth/register` and `/auth/login` endpoints. */
export interface AuthResponse {
  success: boolean;
  token: string;
  user: { id: number; email: string };
}

/**
 * Thin wrapper around the EventHub authentication REST API.
 *
 * Why use the API in a UI framework?
 * Industry best practice is to test each feature through the UI **once**, and
 * to create every other precondition through the API. For example, a login
 * test needs an existing account, but it does not need to click through the
 * registration form to get one. Calling the API takes ~200 ms instead of
 * several seconds and removes a source of flakiness.
 */
export class AuthApi {
  /**
   * @param request - Playwright's HTTP client, already pointed at the API base URL
   *                  (see the `authApi` fixture in src/fixtures/test.ts).
   */
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Creates a new account directly through the API.
   *
   * @param user - Email and password for the new account.
   * @returns The parsed API response (token and user id).
   * @throws Fails the test immediately if the API does not return HTTP 201,
   *         so a broken precondition is reported clearly instead of causing a
   *         confusing UI failure later.
   */
  async register(user: UserCredentials): Promise<AuthResponse> {
    const response = await this.request.post('auth/register', { data: user });
    expect(response.status(), `Register API failed: ${await response.text()}`).toBe(201);
    return (await response.json()) as AuthResponse;
  }
}
