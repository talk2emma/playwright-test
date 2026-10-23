# EventHub UI Automation Framework (Playwright + TypeScript)

[![UI Smoke Tests](https://github.com/talk2emma/playwright-test/actions/workflows/ui-smoke.yml/badge.svg)](https://github.com/talk2emma/playwright-test/actions/workflows/ui-smoke.yml)
[![UI Regression Tests](https://github.com/talk2emma/playwright-test/actions/workflows/ui-regression.yml/badge.svg)](https://github.com/talk2emma/playwright-test/actions/workflows/ui-regression.yml)
[![UI E2E Tests](https://github.com/talk2emma/playwright-test/actions/workflows/ui-e2e.yml/badge.svg)](https://github.com/talk2emma/playwright-test/actions/workflows/ui-e2e.yml)

A UI test automation framework for the **Registration** and **Login** features of
[EventHub](https://eventhub.rahulshettyacademy.com/login), built with
[Playwright Test](https://playwright.dev) and TypeScript.

It has three test suites — **Smoke**, **Regression** and **End-to-End** — and each one
runs automatically once a day on GitHub Actions.

> **New to the framework?** Read this README to get running, then read
> [docs/FRAMEWORK-GUIDE.md](docs/FRAMEWORK-GUIDE.md) for a step-by-step explanation of
> how every file and function works.

---

## Table of contents

1. [What's inside](#1-whats-inside)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Running tests](#5-running-tests)
6. [Test suites explained](#6-test-suites-explained)
7. [Viewing reports and debugging failures](#7-viewing-reports-and-debugging-failures)
8. [Project structure](#8-project-structure)
9. [Writing a new test](#9-writing-a-new-test)
10. [Continuous integration (GitHub Actions)](#10-continuous-integration-github-actions)
11. [Code quality](#11-code-quality)
12. [Best practices this framework follows](#12-best-practices-this-framework-follows)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. What's inside

| Area           | Choice                                                                |
| -------------- | --------------------------------------------------------------------- |
| Test runner    | `@playwright/test` (latest)                                           |
| Language       | TypeScript (strict mode)                                              |
| Design pattern | Page Object Model + custom Playwright **fixtures**                    |
| Test data      | Random unique email per test, fixed password `#Test1234`              |
| Test setup     | Existing users are created through the **API** (fast and reliable)    |
| Browsers       | Chromium, Firefox, WebKit (Safari engine)                             |
| Suites         | `@smoke`, `@regression`, `@e2e` — selected with tags                  |
| Reports        | HTML (with traces, screenshots, videos) + JUnit XML                   |
| CI             | GitHub Actions — one daily scheduled workflow per suite               |
| Code quality   | ESLint (incl. `eslint-plugin-playwright`), Prettier, `tsc` type-check |

**Current coverage: 36 tests per browser** (4 smoke, 30 regression-only, 2 E2E).

---

## 2. Prerequisites

| Tool    | Version | Check with      |
| ------- | ------- | --------------- |
| Node.js | 20+     | `node -v`       |
| npm     | 10+     | `npm -v`        |
| Git     | any     | `git --version` |

Recommended editor: **VS Code** with the extensions suggested in
`../.vscode/extensions.json` (repo root) (Playwright Test, ESLint, Prettier). VS Code will prompt you to
install them when you open the folder.

---

## 3. Installation

```bash
# 1. Clone the repository
git clone https://github.com/talk2emma/playwright-test.git
cd playwright-test/ui-framework

# 2. Install the exact dependency versions from package-lock.json
npm ci

# 3. Download the browsers Playwright drives
npx playwright install
#    (on Linux, add system libraries too:  npx playwright install --with-deps)

# 4. (Optional) create your local config file
cp .env.example .env
```

Check everything works:

```bash
npm run test:smoke
```

You should see `4 passed` for each browser.

---

## 4. Configuration

All settings live in **`src/config/env.ts`**. Each one can be overridden with an
environment variable or a `.env` file:

| Variable        | Default                                           | Purpose                                |
| --------------- | ------------------------------------------------- | -------------------------------------- |
| `BASE_URL`      | `https://eventhub.rahulshettyacademy.com`         | Website under test                     |
| `API_URL`       | `https://api.eventhub.rahulshettyacademy.com/api` | API used to create test users quickly  |
| `TEST_PASSWORD` | `#Test1234`                                       | Password given to every generated user |
| `CI`            | _(set automatically by GitHub Actions)_           | Turns on retries, blob reporter, etc.  |

**Test email:** every test gets a **new random email**, e.g.
`qa.user.1729670000000.a1b2c3d4@test.com`, so tests never clash with each other or with
earlier runs. See `src/data/userFactory.ts`.

To point the tests at another environment (e.g. staging), either edit `.env` or run:

```bash
BASE_URL=https://staging.example.com npm test
```

---

## 5. Running tests

All commands run from the `ui-framework/` folder.

| Command                   | What it does                                                  |
| ------------------------- | ------------------------------------------------------------- |
| `npm test`                | Run **every** test on **all** browsers                        |
| `npm run test:smoke`      | Run only `@smoke` tests                                       |
| `npm run test:regression` | Run the full `@regression` suite (includes smoke)             |
| `npm run test:e2e`        | Run only `@e2e` user-journey tests                            |
| `npm run test:chromium`   | Run everything on Chromium only (fastest for local work)      |
| `npm run test:headed`     | Run on Chromium with a **visible** browser window             |
| `npm run test:ui`         | Open Playwright **UI Mode** — watch, re-run and time-travel   |
| `npm run test:debug`      | Run with the **Playwright Inspector** to step through actions |
| `npm run report`          | Open the last HTML report                                     |
| `npm run codegen`         | Record clicks in a browser and generate locator code          |

### Combining options

Any extra Playwright CLI flags can be passed after `--`:

```bash
# Smoke tests on Firefox only
npm run test:smoke -- --project=firefox

# A single spec file
npx playwright test tests/regression/login.spec.ts

# Tests whose title contains "wrong password"
npx playwright test -g "wrong password"

# Run each test 5 times to hunt for flakiness
npx playwright test --project=chromium --repeat-each=5

# Override workers (parallel processes)
npx playwright test --workers=1
```

---

## 6. Test suites explained

Tests are grouped by **tag**. A tag is attached to a `test.describe` block and every test
inside inherits it.

| Suite          | Tag           | Folder                      | Purpose                                                                                  | When it runs                       |
| -------------- | ------------- | --------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------- |
| **Smoke**      | `@smoke`      | `tests/smoke/`              | "Is it alive?" — pages load, a user can register, a user can log in. Fast; run first.    | Daily 05:00 UTC, Chromium          |
| **Regression** | `@regression` | `tests/regression/` + smoke | Deep coverage: validation, error messages, duplicate email, session, logout, navigation. | Daily 05:30 UTC, all 3 browsers    |
| **End-to-End** | `@e2e`        | `tests/e2e/`                | Complete real-user journeys through the UI only, no API shortcuts.                       | Daily 06:00 UTC, Chromium + WebKit |

Smoke tests carry **both** `@smoke` and `@regression`, because the smoke checks are a
subset of the full regression suite.

### What is covered

**Registration** (`tests/regression/register.spec.ts`)

- Empty form → email and password errors
- 5 invalid email formats (data-driven)
- 4 weak passwords — too short / no uppercase / no number / no special character
- Password and confirmation don't match
- The four password rules are displayed
- An already-registered email is rejected ("Email already registered")
- Password fields are masked
- The "Sign in" link goes to the login page

**Login** (`tests/regression/login.spec.ts`)

- Empty form → email and password errors
- 5 invalid email formats (data-driven)
- Password shorter than 6 characters
- Wrong password → "Invalid email or password"
- Unregistered email → "Invalid email or password"
- Email is case-insensitive
- Session survives a page reload
- Logout ends the session
- Protected page (`/bookings`) redirects an anonymous user to login
- Password field is masked
- The "Register" link goes to the registration page

**E2E** (`tests/e2e/auth.e2e.spec.ts`)

- Login page → Register → logged in → Logout → Login again → Logout
- Register in one browser session, then log in from a completely fresh session

---

## 7. Viewing reports and debugging failures

### HTML report

After any local run:

```bash
npm run report
```

The report shows every test, its steps, timing and errors. Failed tests include:

| Artifact       | When captured       | Use it to…                                                                   |
| -------------- | ------------------- | ---------------------------------------------------------------------------- |
| **Screenshot** | on failure          | See the page at the moment it failed                                         |
| **Video**      | kept on failure     | Watch the whole test                                                         |
| **Trace**      | on first retry (CI) | Time-travel through every action, DOM snapshot, network call and console log |

To always record a trace locally: `npx playwright test --trace on`.
To open a trace file: `npx playwright show-trace path/to/trace.zip`.

### Debugging a failing test

1. **UI Mode** — `npm run test:ui`. Pick the test, watch it run, click any step to see the DOM.
2. **Inspector** — `npm run test:debug -- -g "test name"`. Pauses before each action.
3. **Headed** — `npm run test:headed` to watch the browser.
4. Add `await page.pause()` inside a test to stop at that line (remove it before committing).

---

## 8. Project structure

This framework lives in the `ui-framework/` folder of the repository. Its CI workflows sit
at the **repository root** in `.github/workflows/` (GitHub only reads workflows from there):
`ui-playwright-reusable.yml`, `ui-smoke.yml`, `ui-regression.yml`, `ui-e2e.yml`.

```
ui-framework/
├── docs/
│   └── FRAMEWORK-GUIDE.md       # Deep-dive: how every part works
├── src/
│   ├── api/
│   │   └── AuthApi.ts           # REST client: create users quickly for test setup
│   ├── config/
│   │   └── env.ts               # Environment settings (URLs, password)
│   ├── data/
│   │   ├── messages.ts          # Expected UI messages (single source of truth)
│   │   ├── testData.ts          # Data-driven inputs (invalid emails, weak passwords)
│   │   └── userFactory.ts       # Random unique user generator
│   ├── fixtures/
│   │   └── test.ts              # Custom `test` with page objects + users injected
│   └── pages/
│       ├── BasePage.ts          # Shared page behaviour (goto, URL + message checks)
│       ├── LoginPage.ts         # /login locators and actions
│       ├── RegisterPage.ts      # /register locators and actions
│       └── HomePage.ts          # Signed-in landing page (user email, logout)
├── tests/
│   ├── smoke/auth.smoke.spec.ts
│   ├── regression/login.spec.ts
│   ├── regression/register.spec.ts
│   └── e2e/auth.e2e.spec.ts
├── .env.example                 # Template for local overrides
├── eslint.config.mjs            # Lint rules (incl. Playwright best-practice rules)
├── playwright.config.ts         # Runner config: browsers, retries, reporters, timeouts
├── tsconfig.json                # TypeScript settings + import aliases (@pages/*, ...)
└── package.json                 # Dependencies and npm scripts
```

### The layers

```
  tests/*.spec.ts          ← WHAT to test   (readable scenarios, assertions)
        │ uses
  src/fixtures/test.ts     ← WIRING         (creates page objects, users, API client)
        │ provides
  src/pages/*.ts           ← HOW to interact (locators + actions per page)
  src/api/*.ts             ← FAST SETUP     (create data without the UI)
  src/data/*.ts            ← DATA           (users, messages, input sets)
  src/config/env.ts        ← SETTINGS       (URLs, password)
```

A test never contains a raw selector, and a page object never contains test logic.
When the UI changes, you update **one** page object; the tests stay the same.

---

## 9. Writing a new test

### Step 1 — pick the suite and file

- New validation or edge case → `tests/regression/<feature>.spec.ts`, tag `@regression`
- Critical "must always work" check → `tests/smoke/`, tags `@smoke` + `@regression`
- New multi-page user journey → `tests/e2e/`, tag `@e2e`

### Step 2 — import from the fixtures file, not from `@playwright/test`

```ts
import { test, expect } from '@fixtures/test';
```

### Step 3 — ask for what you need by name

```ts
test.describe('Login', { tag: '@regression' }, () => {
  test('shows an error for a wrong password', async ({ loginPage, registeredUser }) => {
    // Arrange — `registeredUser` already exists (created via the API by the fixture)
    await loginPage.goto();

    // Act
    await loginPage.login({ ...registeredUser, password: '#Wrong999' });

    // Assert
    await loginPage.expectToastMessage(Messages.login.invalidCredentials);
  });
});
```

Available fixtures:

| Fixture                                 | What you get                                                      |
| --------------------------------------- | ----------------------------------------------------------------- |
| `loginPage`                             | `LoginPage` object for the current browser tab                    |
| `registerPage`                          | `RegisterPage` object                                             |
| `homePage`                              | `HomePage` object (signed-in state, logout)                       |
| `newUser`                               | Random credentials that are **not** registered yet                |
| `registeredUser`                        | Credentials for an account that **already exists** (made via API) |
| `authApi`                               | API client for any extra data setup                               |
| `page`, `browser`, `context`, `request` | Playwright's built-in fixtures                                    |

### Step 4 — need a new element or action? Add it to the page object

```ts
// src/pages/LoginPage.ts
readonly forgotPasswordLink = this.page.getByRole('link', { name: 'Forgot password?' });

async goToForgotPassword(): Promise<void> {
  await this.forgotPasswordLink.click();
}
```

Locator priority: `getByRole` → `getByLabel` → `getByPlaceholder` / `getByText` →
`getByTestId` → CSS (last resort). Run `npm run codegen` to have Playwright suggest one.

### Step 5 — new expected message or data set? Add it to `src/data/`

Put messages in `messages.ts` and input lists in `testData.ts`. To add a new
invalid-email case, just add a string to the `invalidEmails` array; a test is generated
for it automatically.

### Step 6 — verify

```bash
npx playwright test -g "your test title" --project=chromium
npm run lint && npm run typecheck
```

---

## 10. Continuous integration (GitHub Actions)

### Schedule

| Workflow                | File                | Schedule (UTC) | Default browsers          |
| ----------------------- | ------------------- | -------------- | ------------------------- |
| **UI Smoke Tests**      | `ui-smoke.yml`      | daily 05:00    | chromium                  |
| **UI Regression Tests** | `ui-regression.yml` | daily 05:30    | chromium, firefox, webkit |
| **UI E2E Tests**        | `ui-e2e.yml`        | daily 06:00    | chromium, webkit          |

To change the time, edit the `cron` line (e.g. `'0 13 * * *'` = 13:00 UTC). Use
[crontab.guru](https://crontab.guru) to build expressions.

> GitHub runs scheduled workflows from the **default branch** only, and pauses schedules
> on repositories with no activity for 60 days.

### Running a suite on demand

GitHub → **Actions** → choose the workflow → **Run workflow**. You can override the browser
list, e.g. `["firefox"]`.

### How a CI run works

```
ui-smoke.yml / ui-regression.yml / ui-e2e.yml   (trigger: cron or button)
        │  calls with suite + browsers
        ▼
ui-playwright-reusable.yml
  ├── test job  (matrix: one parallel job per browser)
  │     checkout → setup Node (npm cache) → npm ci
  │     → install browser → playwright test --grep <suite> --project=<browser>
  │     → upload blob report (+ screenshots/videos/traces on failure)
  └── report job (after all browsers finish)
        download blobs → merge into ONE HTML + JUnit report
        → upload "ui-playwright-report" artifact → write pass/fail table to run Summary
```

### Reading CI results

1. Open the workflow run. The **Summary** tab shows a Total / Passed / Failed table.
2. Failures also appear as **annotations** on the run, pointing at the failing line.
3. Download the **ui-playwright-report** artifact, unzip it, and run
   `npx playwright show-report <unzipped-folder>` to browse it with traces.

### Optional CI settings

Under **Settings → Secrets and variables → Actions** you can set:

- Variables: `BASE_URL`, `API_URL`
- Secret: `TEST_PASSWORD`

If they're not set, the defaults from `src/config/env.ts` are used.

---

## 11. Code quality

| Command                | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `npm run lint`         | ESLint, including Playwright-specific rules |
| `npm run lint:fix`     | Auto-fix lint issues                        |
| `npm run typecheck`    | TypeScript compile check (no output files)  |
| `npm run format`       | Format all files with Prettier              |
| `npm run format:check` | Verify formatting without changing files    |

Notable lint rules (`eslint.config.mjs`) that prevent flaky tests:

- `playwright/no-wait-for-timeout` — no fixed sleeps; use auto-waiting assertions
- `playwright/missing-playwright-await` — catches a forgotten `await`
- `playwright/no-focused-test` — blocks a committed `test.only`
- `playwright/expect-expect` — every test must assert something

---

## 12. Best practices this framework follows

1. **User-facing locators** (`getByRole`, `getByLabel`) first — resilient to styling changes.
2. **Web-first assertions** (`await expect(locator).toBeVisible()`) that retry
   automatically; **no** `waitForTimeout` sleeps.
3. **Test isolation** — every test gets a fresh browser context and its own random user,
   so tests can run in parallel and in any order.
4. **API for setup, UI for the thing under test** — login tests create their user via the
   API; only the registration tests use the registration UI.
5. **Fixtures instead of `beforeEach` boilerplate** — dependencies are injected by name and
   created only when needed.
6. **Page Object Model** — selectors live in one place.
7. **Centralised config, data and messages** — nothing hard-coded in specs.
8. **Tags** for suite selection instead of separate configs.
9. **Retries only on CI**, and retried passes are reported as _flaky_ so they're not hidden.
10. **Traces/screenshots/videos only when useful**, to keep runs fast.
11. **`forbidOnly` on CI**, strict TypeScript, lint and formatting.
12. **Reusable CI workflow**, browser matrix, merged reports, least-privilege token,
    concurrency cancelling.

---

## 13. Troubleshooting

| Symptom                                                               | Fix                                                                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `browserType.launch: Executable doesn't exist`                        | Run `npx playwright install`                                                                                                                     |
| Tests time out on the first action                                    | Check the site is reachable: open `BASE_URL` in a browser                                                                                        |
| `Register API failed: ...` in a test                                  | The API is down or `API_URL` is wrong; the message shows the server's response                                                                   |
| Firefox fails to launch on macOS with "Could not find profile folder" | Local Firefox/macOS issue — run `npx playwright install --force firefox`, or use `--project=chromium`/`webkit` locally; CI (Linux) is unaffected |
| A test passes locally but is flaky on CI                              | Download the CI report, open the **trace** for the failed attempt                                                                                |
| A UI text changed                                                     | Update it once in `src/data/messages.ts`                                                                                                         |
| A selector broke                                                      | Update it once in the matching file in `src/pages/`                                                                                              |
