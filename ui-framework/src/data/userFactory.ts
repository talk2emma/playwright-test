import { randomUUID } from 'node:crypto';
import { env } from '@config/env';

/** The shape of a user account used throughout the tests. */
export interface UserCredentials {
  email: string;
  password: string;
}

/**
 * Generates a random email address that is guaranteed to be unique.
 *
 * Why random? The app rejects an email that is already registered. If every
 * test used a hard-coded email, the second run would fail. Combining a
 * timestamp with a short random UUID means parallel workers, retries and
 * repeated CI runs never collide.
 *
 * @param prefix - Optional label to make the email easy to spot in logs (e.g. "e2e").
 * @returns An email such as `qa.e2e.1729670000000.a1b2c3d4@test.com`.
 */
export function generateUniqueEmail(prefix = 'user'): string {
  const timestamp = Date.now();
  const shortId = randomUUID().slice(0, 8);
  return `qa.${prefix}.${timestamp}.${shortId}@test.com`;
}

/**
 * Builds a complete set of credentials for a brand-new (not yet registered) user.
 *
 * @param overrides - Replace any field, e.g. `createUser({ password: 'weak' })`
 *                    when a test needs a specific value.
 * @returns A `UserCredentials` object with a random email and the configured password.
 */
export function createUser(overrides: Partial<UserCredentials> = {}): UserCredentials {
  return {
    email: generateUniqueEmail(),
    password: env.testPassword,
    ...overrides,
  };
}
