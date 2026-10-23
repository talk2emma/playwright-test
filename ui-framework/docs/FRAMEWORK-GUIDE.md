# Framework Guide — How Everything Works

This guide explains the framework step by step: what happens when you run a test, and what
every file and function does. Read the [README](../README.md) first for installation and
commands.

Every source file also has comments explaining each function, so you can read the code
and this guide side by side.

---

## Contents

1. [The big picture](#1-the-big-picture)
2. [Life of a test — step by step](#2-life-of-a-test--step-by-step)
3. [File-by-file reference](#3-file-by-file-reference)
   - [playwright.config.ts](#31-playwrightconfigts)
   - [src/config/env.ts](#32-srcconfigenvts)
   - [src/data/userFactory.ts](#33-srcdatauserfactoryts)
   - [src/data/messages.ts](#34-srcdatamessagests)
   - [src/data/testData.ts](#35-srcdatatestdatats)
   - [src/api/AuthApi.ts](#36-srcapiauthapits)
   - [src/pages/BasePage.ts](#37-srcpagesbasepagets)
   - [src/pages/LoginPage.ts](#38-srcpagesloginpagets)
   - [src/pages/RegisterPage.ts](#39-srcpagesregisterpagets)
   - [src/pages/HomePage.ts](#310-srcpageshomepagets)
   - [src/fixtures/test.ts](#311-srcfixturestestts)
   - [The spec files](#312-the-spec-files)
   - [GitHub Actions workflows](#313-github-actions-workflows)
   - [Tooling files](#314-tooling-files)
4. [Key Playwright concepts used](#4-key-playwright-concepts-used)
5. [Extending the framework](#5-extending-the-framework)

---

## 1. The big picture

The framework is built in layers. Each layer has one job and only talks to the layer
below it.

```
┌──────────────────────────────────────────────────────────────────────┐
│  TESTS  (tests/**/*.spec.ts)                                         │
│  Describe WHAT should happen, in plain language.                     │
│  e.g. "registered user can log in" → login → expect logged in        │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ asks for fixtures by name
┌──────────────────────────────▼───────────────────────────────────────┐
│  FIXTURES  (src/fixtures/test.ts)                                    │
│  Builds everything a test needs and hands it over:                   │
│  page objects, a new random user, a pre-registered user, API client  │
└───────────┬──────────────────────────────┬───────────────────────────┘
            │ creates                      │ creates
┌───────────▼──────────────┐   ┌───────────▼──────────────┐
│  PAGE OBJECTS            │   │  API CLIENT              │
│  (src/pages/*.ts)        │   │  (src/api/AuthApi.ts)    │
│  HOW to use each page:   │   │  Fast setup: create a    │
│  locators + actions +    │   │  user via HTTP in ~200ms │
│  reusable assertions     │   │  instead of the UI       │
└───────────┬──────────────┘   └───────────┬──────────────┘
            │ use                          │ use
┌───────────▼──────────────────────────────▼───────────────────────────┐
│  DATA & CONFIG  (src/data/*.ts, src/config/env.ts)                   │
│  Random users, expected messages, input lists, URLs, password        │
└──────────────────────────────────────────────────────────────────────┘
```

**Why layers?** If the "Sign In" button is renamed, only `LoginPage.ts` changes. If an
error message is reworded, only `messages.ts` changes. The tests themselves stay the same.

---

## 2. Life of a test — step by step

Let's follow this smoke test from start to finish:

```ts
// tests/smoke/auth.smoke.spec.ts
test('registered user can log in with valid credentials', async ({
  loginPage,
  homePage,
  registeredUser,
}) => {
  await loginPage.goto();
  await loginPage.login(registeredUser);
  await homePage.expectLoggedInAs(registeredUser.email);
});
```

### Step 1 — You run a command

```bash
npm run test:smoke
```

`package.json` maps this to `playwright test --grep @smoke`.

### Step 2 — Playwright loads the configuration

Playwright reads `playwright.config.ts`, which:

1. Imports `src/config/env.ts`, which loads `.env` (if there is one) and works out
   `baseUrl`, `apiUrl` and `testPassword`.
2. Sets `testDir: './tests'`, `baseURL`, timeouts, retries, reporters and the three
   browser **projects**.

### Step 3 — Playwright finds and filters tests

It scans `tests/` for `*.spec.ts` files and keeps only tests whose title or tags match
`@smoke`. The smoke `describe` block has `{ tag: ['@smoke', '@regression'] }`, so its
4 tests are selected — once for each of the 3 browser projects, giving 12 test runs.

### Step 4 — Workers start

Because `fullyParallel: true`, the runs are spread across several **worker** processes.
Each worker launches its browser once and reuses it across tests.

### Step 5 — Fixtures are set up (this is where the magic is)

The test's parameter list is `{ loginPage, homePage, registeredUser }`. Playwright reads
those names and builds each fixture from `src/fixtures/test.ts`, resolving dependencies
automatically:

```
registeredUser  needs → authApi  needs → playwright (built-in)
loginPage       needs → page     needs → context → browser (built-in)
homePage        needs → page     (same page — fixtures are shared within one test)
```

In order:

1. **`page`** (built-in) — a fresh, isolated browser context (like a new incognito
   window) with one tab. No cookies or storage from other tests.
2. **`loginPage`** — `new LoginPage(page)`. The constructor defines locators, but nothing
   touches the browser yet.
3. **`homePage`** — `new HomePage(page)`, using the same tab.
4. **`authApi`** — creates an HTTP client with base URL `…/api/` and wraps it in `AuthApi`.
5. **`registeredUser`** —
   - calls `createUser()` → `{ email: 'qa.user.1729…@test.com', password: '#Test1234' }`
   - calls `authApi.register(user)` → `POST …/api/auth/register` → expects HTTP **201**
   - hands the credentials to the test.

### Step 6 — The test body runs

| Line                               | What happens inside                                                                                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loginPage.goto()`                 | `BasePage.goto()` → `page.goto('/login')`. Playwright adds `baseURL` and waits for the page `load` event.                                                                                |
| `loginPage.login(registeredUser)`  | `emailInput.fill(email)` → Playwright finds the input labelled "Email", waits until it is visible and editable, clears it and types. The same for password, then `signInButton.click()`. |
| `homePage.expectLoggedInAs(email)` | Retries each check until it passes or 10 s pass: URL is `/`, hero heading visible, navbar shows **this** email, Logout button visible.                                                   |

### Step 7 — Teardown

After the test (pass or fail), Playwright runs each fixture's code after `await use(...)`
in reverse order: `authApi` disposes its HTTP client, and the browser context is closed.

### Step 8 — Artifacts and reporting

- If the test failed: a screenshot and video are saved to `test-results/`.
- If it failed on CI and was retried: a **trace** is recorded on the retry.
- Reporters write the terminal output, `playwright-report/index.html` and
  `test-results/junit.xml` (or a blob on CI — see §3.13).

---

## 3. File-by-file reference

### 3.1 `playwright.config.ts`

The runner configuration. `defineConfig()` is a typed helper that gives you
auto-complete for every option.

| Setting                        | Value                                                  | Why                                                                        |
| ------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `testDir`                      | `./tests`                                              | Where specs live                                                           |
| `fullyParallel`                | `true`                                                 | Tests in the same file also run in parallel (safe: every test is isolated) |
| `forbidOnly`                   | `true` on CI                                           | A forgotten `test.only` fails the build                                    |
| `retries`                      | 2 on CI, 0 locally                                     | Absorbs network blips on CI; flaky tests are flagged, not hidden           |
| `workers`                      | 2 on CI, auto locally                                  | Polite to the shared public site                                           |
| `timeout`                      | 60 s                                                   | Max time for one test                                                      |
| `expect.timeout`               | 10 s                                                   | How long assertions keep retrying                                          |
| `reporter`                     | list + html + junit (local); list + github + blob (CI) | See §3.13 for how CI merges blobs                                          |
| `use.baseURL`                  | `env.baseUrl`                                          | Enables `page.goto('/login')`                                              |
| `use.trace`                    | `on-first-retry`                                       | Full trace only when a test is retried                                     |
| `use.screenshot` / `use.video` | only on failure                                        | Debug evidence without slowing passing tests                               |
| `use.actionTimeout`            | 15 s                                                   | Max time for one click/fill                                                |
| `use.testIdAttribute`          | `data-testid`                                          | What `getByTestId()` looks for                                             |
| `projects`                     | chromium, firefox, webkit                              | One "project" per browser; pick with `--project`                           |

---

### 3.2 `src/config/env.ts`

**Purpose:** the single source of environment settings.

| Line / function                  | How it works                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dotenv.config({ path, quiet })` | Reads `.env` in the project root (if it exists) and copies its values into `process.env`. `quiet` suppresses dotenv's log line.                     |
| `env.baseUrl`                    | `process.env.BASE_URL \|\| default`. `\|\|` (not `??`) so an **empty** string — what GitHub Actions passes for an unset variable — also falls back. |
| `env.apiUrl`                     | Same pattern for the API URL.                                                                                                                       |
| `env.testPassword`               | Same pattern; default `#Test1234`.                                                                                                                  |
| `env.isCI`                       | `!!process.env.CI` → `true` on GitHub Actions, which sets `CI=true`.                                                                                |
| `as const`                       | Makes the object read-only, so nothing can change config at runtime.                                                                                |

---

### 3.3 `src/data/userFactory.ts`

**Purpose:** create test users that never collide.

| Function                       | How it works                                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interface UserCredentials`    | The `{ email, password }` type used everywhere.                                                                                                                                                                      |
| `generateUniqueEmail(prefix?)` | Builds `qa.<prefix>.<Date.now()>.<8 random hex chars>@test.com`. `Date.now()` is the millisecond timestamp; `randomUUID().slice(0, 8)` adds randomness so two workers starting in the same millisecond still differ. |
| `createUser(overrides?)`       | Returns `{ email: generateUniqueEmail(), password: env.testPassword }`, then spreads `overrides` on top. `createUser({ password: 'weak' })` keeps the random email but swaps the password.                           |

---

### 3.4 `src/data/messages.ts`

**Purpose:** every message the tests check, in one object (`Messages.login.*`,
`Messages.register.*`). Tests write `Messages.login.invalidCredentials` instead of
copying the string. `as const` makes the values literal and read-only.

---

### 3.5 `src/data/testData.ts`

**Purpose:** input lists for **data-driven tests**.

| Export               | Used by                                            | How                                                                    |
| -------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `invalidEmails`      | login + register specs                             | `for (const email of invalidEmails) test(...)` → one test per email    |
| `weakPasswords`      | register spec                                      | Each item has `password` and `reason`; `reason` goes in the test title |
| `passwordGuidelines` | register spec ("displays all four password rules") | Compared to the list items with `toHaveText([...])`                    |

Add an item → a new test appears. No test code changes needed.

---

### 3.6 `src/api/AuthApi.ts`

**Purpose:** create accounts through the REST API for **test setup**.

| Member                   | How it works                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `interface AuthResponse` | Types the JSON the API returns: `{ success, token, user: { id, email } }`.                                                                                                                                                           |
| `constructor(request)`   | Stores a Playwright `APIRequestContext` (an HTTP client). `private readonly` creates and assigns the field in one step.                                                                                                              |
| `register(user)`         | `request.post('auth/register', { data: user })` sends JSON `{ email, password }`. `expect(response.status(), message).toBe(201)` fails the test right away with the server's response if setup didn't work. Returns the parsed JSON. |

**Why not register through the UI every time?** Only the registration tests need the
registration UI. For a login test, the account is just a precondition, and the API
creates it about 10× faster with fewer moving parts.

---

### 3.7 `src/pages/BasePage.ts`

**Purpose:** behaviour shared by all page objects. It is `abstract`, so you never create
a `BasePage` directly — only its children.

| Member                        | How it works                                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `protected abstract path`     | Every child must declare its URL path (`'/login'`, `'/register'`, `'/'`).                                                                                   |
| `constructor(page)`           | Stores the Playwright `Page` (browser tab) as `this.page`.                                                                                                  |
| `goto()`                      | `page.goto(this.path)` — the relative path is resolved against `baseURL`. Waits for the `load` event.                                                       |
| `expectToBeOnPage()`          | `expect(page).toHaveURL(this.path)` — the relative path is resolved against `baseURL` and must match the **whole** URL. Retries, so it waits for redirects. |
| `expectToastMessage(message)` | `expect(page.getByText(message, { exact: true })).toBeVisible()` — catches the short-lived server-error toast as soon as it appears.                        |
| `expectFieldError(message)`   | Same check for inline validation text under a field.                                                                                                        |
| `fieldError(message)`         | Returns the locator itself, so a test can also assert `.toBeHidden()`.                                                                                      |

---

### 3.8 `src/pages/LoginPage.ts`

**Purpose:** everything about `/login`.

| Locator         | Strategy                                                | Why this one                               |
| --------------- | ------------------------------------------------------- | ------------------------------------------ |
| `heading`       | `getByRole('heading', { name: 'Sign in to EventHub' })` | How a screen reader identifies it          |
| `emailInput`    | `getByLabel('Email')`                                   | The input has a real `<label for="email">` |
| `passwordInput` | `getByLabel('Password')`                                | Same                                       |
| `signInButton`  | `getByRole('button', { name: 'Sign In' })`              | Visible button text                        |
| `registerLink`  | `getByRole('link', { name: 'Register' })`               | Visible link text                          |

| Method                | How it works                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `login(user)`         | `fill` email → `fill` password → `click` Sign In. `fill` waits for the field to be editable and clears it first. |
| `submitEmptyForm()`   | Clicks Sign In with empty fields to trigger client-side validation.                                              |
| `goToRegister()`      | Clicks the Register link.                                                                                        |
| `expectFormVisible()` | Asserts heading, both inputs visible and button enabled — used by smoke tests to prove the page rendered.        |

---

### 3.9 `src/pages/RegisterPage.ts`

**Purpose:** everything about `/register`.

The registration inputs have no linked `<label>`, so `getByLabel` can't find them. The
developers added `data-testid` attributes, so we use `getByTestId` (the next most stable
choice). The confirm-password field has neither, so it falls back to
`getByPlaceholder('Repeat your password')`.

| Method                             | How it works                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `register(user, confirmPassword?)` | Calls `fillForm`, then clicks Create Account. `confirmPassword` defaults to `user.password`; pass something else to test the mismatch error. |
| `fillForm(user, confirmPassword?)` | Fills the three fields without submitting.                                                                                                   |
| `submitEmptyForm()`                | Clicks Create Account with empty fields.                                                                                                     |
| `goToLogin()`                      | Clicks the "Sign in" link.                                                                                                                   |
| `expectFormVisible()`              | Asserts heading, three inputs and enabled button.                                                                                            |
| `passwordGuidelines` (locator)     | `locator('#password-guidelines').getByRole('listitem')` — the four rule `<li>`s, scoped to their list.                                       |

---

### 3.10 `src/pages/HomePage.ts`

**Purpose:** the landing page after sign-in, used to **prove who is logged in**.

| Member                    | How it works                                                                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `userEmailDisplay`        | `getByTestId('user-email-display')` — the navbar shows the signed-in email.                                                                                                                   |
| `logoutButton`            | `getByTestId('logout-btn')`.                                                                                                                                                                  |
| `logout()`                | Clicks Logout; the app clears its token and redirects to `/login`.                                                                                                                            |
| `expectLoggedInAs(email)` | Four retrying assertions: URL is `/`, hero heading visible, navbar text **equals** `email`, Logout visible. Checking the exact email proves the _right_ user is logged in, not just _a_ user. |

---

### 3.11 `src/fixtures/test.ts`

**Purpose:** extend Playwright's `test` with our own fixtures. **Every spec imports `test`
and `expect` from here.**

```ts
export const test = base.extend<Fixtures>({ ... });
```

`base.extend` returns a new `test` function that knows all of Playwright's built-in
fixtures plus ours. `<Fixtures>` is a TypeScript type, so `async ({ loginPage })` is fully
typed with auto-complete.

Every fixture has the same shape:

```ts
fixtureName: async ({ dependencies }, use) => {
  const value = /* setup */;
  await use(value);   // ← the test runs here
  /* teardown — always runs, even if the test failed */
},
```

| Fixture          | Depends on   | Setup                                                                          | Teardown                    |
| ---------------- | ------------ | ------------------------------------------------------------------------------ | --------------------------- |
| `loginPage`      | `page`       | `new LoginPage(page)`                                                          | —                           |
| `registerPage`   | `page`       | `new RegisterPage(page)`                                                       | —                           |
| `homePage`       | `page`       | `new HomePage(page)`                                                           | —                           |
| `authApi`        | `playwright` | `playwright.request.newContext({ baseURL: '<apiUrl>/' })` wrapped in `AuthApi` | `dispose()` the HTTP client |
| `newUser`        | —            | `createUser()` (nothing sent to the server)                                    | —                           |
| `registeredUser` | `authApi`    | `createUser()` → `authApi.register(user)`                                      | —                           |

**Fixtures are lazy.** A test that only asks for `loginPage` never creates an API client
or registers a user.

**Why the trailing slash on `baseURL`?** URL resolution: `new URL('auth/register',
'https://x/api/')` → `https://x/api/auth/register`, but with `'https://x/api'` (no slash)
it becomes `https://x/auth/register`.

---

### 3.12 The spec files

All specs follow **Arrange → Act → Assert** and use only page-object methods, never raw
selectors.

#### `tests/smoke/auth.smoke.spec.ts` — tags `@smoke @regression`

| Test                                     | Proves                                             |
| ---------------------------------------- | -------------------------------------------------- |
| login page loads with all form fields    | `/login` renders                                   |
| register page loads with all form fields | `/register` renders                                |
| new user can register with valid details | Registration works end to end and logs the user in |
| registered user can log in               | Login works for an existing account                |

#### `tests/regression/register.spec.ts` — tag `@regression`

- `test.beforeEach` opens `/register` before every test.
- Nested `test.describe` blocks (`form validation`, `business rules`, `security & UX`)
  group tests in the report.
- The `for … of` loops generate one test per entry in `invalidEmails` / `weakPasswords`.
- "already registered" uses `registeredUser` (made via API), then tries to register the
  same email through the UI and expects the "Email already registered" toast.

#### `tests/regression/login.spec.ts` — tag `@regression`

- Negative tests use `{ ...registeredUser, password: '#WrongPass99' }` — object spread
  copies the user and overrides only the password.
- "session persists after a page reload" calls `page.reload()` and re-asserts the user is
  logged in (the token is stored in `localStorage`).
- "protected page redirects" opens `/bookings` without logging in and expects `/login`.

#### `tests/e2e/auth.e2e.spec.ts` — tag `@e2e`

- Uses **only the UI** — no API shortcuts — because E2E tests must prove the real journey.
- `test.step('…', async () => { … })` names each stage. Steps show up in the HTML report
  and trace viewer, so a failure says _"failed in step: Log back in with the same
  credentials"_.
- The second test uses the built-in `browser` fixture to open a **second, independent
  context** (`browser.newContext()`), proving the account exists on the server and isn't
  just remembered by the first browser session. The context is closed at the end.

---

### 3.13 GitHub Actions workflows

#### Caller workflows: `ui-smoke.yml`, `ui-regression.yml`, `ui-e2e.yml`

Each is small and declares only **when** and **what**:

| Key                           | Meaning                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `on.schedule.cron`            | Daily trigger (UTC). Format: `minute hour day-of-month month day-of-week`.                                                     |
| `on.workflow_dispatch`        | Adds a **Run workflow** button, with an optional `browsers` input.                                                             |
| `concurrency`                 | If a new run starts on the same branch, the older one is cancelled.                                                            |
| `permissions: contents: read` | The `GITHUB_TOKEN` can only read the repo (least privilege).                                                                   |
| `jobs.*.uses`                 | Calls the reusable workflow.                                                                                                   |
| `with.suite`                  | The tag to run (`@smoke`, …).                                                                                                  |
| `with.browsers`               | `${{ inputs.browsers \|\| '[...]' }}` — the manual input if given; scheduled runs have no inputs, so the default list is used. |
| `secrets: inherit`            | Passes repo secrets (e.g. `TEST_PASSWORD`) to the reusable workflow.                                                           |

#### Reusable workflow: `ui-playwright-reusable.yml`

**Job `test`** — `strategy.matrix.project: ${{ fromJSON(inputs.browsers) }}` turns
`["chromium","firefox","webkit"]` into three parallel jobs. `fail-fast: false` keeps the
others running if one fails.

| Step                       | What it does                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Check out repository       | `actions/checkout` clones the code.                                                                                         |
| Set up Node.js             | `actions/setup-node` installs the current LTS and caches `~/.npm` keyed on `package-lock.json`.                             |
| Install dependencies       | `npm ci` — clean install of the exact locked versions.                                                                      |
| Install Playwright browser | `npx playwright install --with-deps <browser>` — only the browser this job needs, plus Linux system libraries.              |
| Run tests                  | `npx playwright test --grep "<suite>" --project=<browser>`. With `CI=true`, the config switches to retries + blob reporter. |
| Upload blob report         | `if: !cancelled()` — uploads even when tests fail. `PLAYWRIGHT_BLOB_OUTPUT_NAME` gives each browser a unique file name.     |
| Upload failure artifacts   | `if: failure()` — screenshots, videos and traces from `test-results/`.                                                      |

**Job `report`** — `needs: test` waits for every browser; `if: !cancelled()` runs even if
tests failed.

| Step               | What it does                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Download all blobs | `pattern: blob-*` + `merge-multiple: true` puts all `report-<browser>.zip` files in one folder.                 |
| Merge              | `npx playwright merge-reports --reporter html,junit ./all-blob-reports` → one combined HTML report + JUnit XML. |
| Upload HTML report | Artifact `playwright-report`, kept 14 days.                                                                     |
| Write job summary  | A small Node script reads totals from `junit.xml` and appends a Markdown table to `$GITHUB_STEP_SUMMARY`.       |

**Environment in CI:** `BASE_URL`, `API_URL` (repository _variables_) and `TEST_PASSWORD`
(a _secret_) are passed as env vars. If they're unset, GitHub passes an empty string and
`env.ts` falls back to the defaults.

---

### 3.14 Tooling files

| File                         | Purpose                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json`               | Dependencies (all dev-only) and npm scripts. `engines.node` documents the minimum Node version.                                                                                                                                      |
| `tsconfig.json`              | Strict type-checking. `paths` defines import aliases (`@pages/*` → `src/pages/*`); Playwright honours them at runtime. `module: preserve` + `moduleResolution: bundler` is the modern setting for tool-compiled code.                |
| `eslint.config.mjs`          | Flat config: JS + TypeScript + Playwright recommended rules, plus stricter anti-flakiness rules. `assertFunctionPatterns: ['^expect[A-Z]']` tells the linter that page-object methods like `expectLoggedInAs()` count as assertions. |
| `.prettierrc.json`           | Formatting style (single quotes, 100-column lines, trailing commas).                                                                                                                                                                 |
| `.env.example`               | Template for local overrides; copy to `.env` (which is git-ignored).                                                                                                                                                                 |
| `.gitignore`                 | Keeps `node_modules`, reports, results and `.env` out of Git.                                                                                                                                                                        |
| `../.vscode/extensions.json` | (Repo root.) Suggests the Playwright, ESLint and Prettier VS Code extensions.                                                                                                                                                        |

> **Why TypeScript 6.0 and not 7?** `typescript-eslint` does not yet support TypeScript 7.
> `package.json` pins `typescript@~6.0` so lint and type-check use the same compiler.
> Raise it once `typescript-eslint` adds TS 7 support.

---

## 4. Key Playwright concepts used

| Concept                 | Where                              | One-line explanation                                                                                               |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Locator**             | page objects                       | A _recipe_ for finding an element; resolved fresh on every use, so it never goes stale.                            |
| **Auto-waiting**        | every `click` / `fill`             | Before acting, Playwright waits until the element is attached, visible, stable, enabled and (for `fill`) editable. |
| **Web-first assertion** | every `await expect(...)`          | Retries until true or `expect.timeout` (10 s) — no manual waits.                                                   |
| **Browser context**     | `page` fixture, E2E second session | An isolated, incognito-like profile. Each test gets its own, so cookies and storage never leak between tests.      |
| **Fixture**             | `src/fixtures/test.ts`             | Dependency injection for tests, with setup and teardown.                                                           |
| **Project**             | `playwright.config.ts`             | A named configuration (here, one per browser).                                                                     |
| **Tag**                 | `{ tag: '@smoke' }`                | A label used to select tests with `--grep`.                                                                        |
| **`test.step`**         | E2E spec                           | A named section shown in reports and traces.                                                                       |
| **Trace**               | on first retry                     | A recording of the test (DOM snapshots, network, console) you can step through.                                    |
| **Blob report**         | CI                                 | Raw results from one job, merged later into a single report.                                                       |

---

## 5. Extending the framework

### Adding a new page (e.g. Events)

1. Create `src/pages/EventsPage.ts`:

   ```ts
   import { expect, type Locator, type Page } from '@playwright/test';
   import { BasePage } from './BasePage';

   export class EventsPage extends BasePage {
     protected readonly path = '/events';
     readonly heading: Locator;

     constructor(page: Page) {
       super(page);
       this.heading = page.getByRole('heading', { level: 1 });
     }

     async expectLoaded(): Promise<void> {
       await expect(this.heading).toBeVisible();
     }
   }
   ```

2. Register a fixture in `src/fixtures/test.ts`:

   ```ts
   type Fixtures = { /* … */ eventsPage: EventsPage };
   // inside base.extend({ … })
   eventsPage: async ({ page }, use) => { await use(new EventsPage(page)); },
   ```

3. Use it in a spec: `async ({ eventsPage }) => { … }`.

### Skipping the login UI for tests of other features

When you add features beyond auth, tests for those features shouldn't log in through the
UI each time. A common next step is an `authenticatedPage` fixture that registers a user
through the API, puts the returned `token` into `localStorage` (the app reads
`eventhub_token`), and hands over a page that is already signed in. Keep UI login
coverage in the login specs only.

### Adding a new environment

Create a `.env.staging` file and load it with
`dotenv.config({ path: '.env.staging' })`, or set variables in the CI job. No code
changes are needed elsewhere because everything reads from `env`.
