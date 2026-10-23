/**
 * Every user-facing message the tests assert on, kept in one place.
 *
 * If the product team changes a message, you update it here once instead
 * of hunting through every spec file.
 */
export const Messages = {
  login: {
    invalidEmail: 'Enter a valid email',
    passwordTooShort: 'Password must be at least 6 characters',
    invalidCredentials: 'Invalid email or password',
  },
  register: {
    invalidEmail: 'Enter a valid email',
    passwordRequirementsNotMet: 'Password does not meet the requirements below',
    passwordsDoNotMatch: 'Passwords do not match',
    emailAlreadyRegistered: 'Email already registered',
  },
} as const;
