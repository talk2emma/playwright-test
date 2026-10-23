/**
 * Static data sets for data-driven (parameterised) tests.
 *
 * A spec loops over one of these arrays and creates one test per entry, so
 * adding a new case is a one-line change here — no new test code needed.
 */

/** Strings that must be rejected by the email field's format validation. */
export const invalidEmails: readonly string[] = [
  'plainaddress',
  'missing-at-sign.com',
  '@missing-local-part.com',
  'missing-domain@',
  'spaces in@email.com',
];

/**
 * Passwords that break at least one registration rule.
 * `reason` is used in the test title so the report says *why* each one is weak.
 */
export const weakPasswords: readonly { password: string; reason: string }[] = [
  { password: 'Ab1#', reason: 'shorter than 8 characters' },
  { password: 'test1234#', reason: 'no uppercase letter' },
  { password: 'Testtest#', reason: 'no number' },
  { password: 'Test12345', reason: 'no special character' },
];

/** The four password rules displayed under the password field on the Register page. */
export const passwordGuidelines: readonly string[] = [
  'At least 8 characters',
  'One uppercase letter (A–Z)',
  'One number (0–9)',
  'One special character (!@#$%^&*…)',
];
