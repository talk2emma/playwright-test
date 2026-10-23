# EventHub Test Automation

Automated tests for [EventHub](https://eventhub.rahulshettyacademy.com), organised as two
independent frameworks in one repository.

| Folder                               | What it tests                          | Status                    | Docs                                                  |
| ------------------------------------ | -------------------------------------- | ------------------------- | ----------------------------------------------------- |
| [`ui-framework/`](ui-framework/)     | The web UI in real browsers (Playwright) | ✅ Registration & Login  | [README](ui-framework/README.md) · [Guide](ui-framework/docs/FRAMEWORK-GUIDE.md) |
| [`api-framework/`](api-framework/)   | The REST API directly over HTTP          | 🚧 Not built yet          | [README](api-framework/README.md)                     |

[![UI Smoke Tests](https://github.com/talk2emma/playwright-test/actions/workflows/ui-smoke.yml/badge.svg)](https://github.com/talk2emma/playwright-test/actions/workflows/ui-smoke.yml)
[![UI Regression Tests](https://github.com/talk2emma/playwright-test/actions/workflows/ui-regression.yml/badge.svg)](https://github.com/talk2emma/playwright-test/actions/workflows/ui-regression.yml)
[![UI E2E Tests](https://github.com/talk2emma/playwright-test/actions/workflows/ui-e2e.yml/badge.svg)](https://github.com/talk2emma/playwright-test/actions/workflows/ui-e2e.yml)

---

## Repository structure

```
playwright-test/
├── .github/
│   └── workflows/                     # ALL CI workflows (GitHub only reads them from here)
│       ├── ui-playwright-reusable.yml #   shared UI CI logic: install → run → merge report
│       ├── ui-smoke.yml               #   daily 05:00 UTC — UI @smoke
│       ├── ui-regression.yml          #   daily 05:30 UTC — UI @regression
│       └── ui-e2e.yml                 #   daily 06:00 UTC — UI @e2e
│                                      #   (api-*.yml workflows will be added here)
│
├── ui-framework/                      # UI automation framework (self-contained)
│   ├── docs/FRAMEWORK-GUIDE.md        #   how every file and function works
│   ├── src/
│   │   ├── api/                       #   API helper used only to SET UP UI tests
│   │   ├── config/                    #   environment settings
│   │   ├── data/                      #   users, messages, data-driven inputs
│   │   ├── fixtures/                  #   custom Playwright fixtures
│   │   └── pages/                     #   page objects
│   ├── tests/
│   │   ├── smoke/
│   │   ├── regression/
│   │   └── e2e/
│   ├── playwright.config.ts
│   ├── package.json                   #   its own dependencies and npm scripts
│   └── README.md                      #   how to install, run and extend it
│
├── api-framework/                     # API automation framework (to be built)
│   └── README.md
│
├── .vscode/extensions.json            # recommended VS Code extensions
├── .gitignore                         # shared ignore rules for both frameworks
└── README.md                          # this file
```

### Why two separate frameworks?

- **Independent:** each has its own `package.json`, config and dependencies, so changing
  one can never break the other.
- **Different jobs:** UI tests check what a user sees in a browser. API tests check
  endpoints, status codes and data contracts. API tests are faster and need no browser.
- **Separate CI:** each framework has its own workflows (`ui-*` and, later, `api-*`), so
  you can see at a glance which layer failed.

> `ui-framework/src/api/` is **not** the API framework. It is a small helper the UI tests
> use to create users quickly before a UI test runs. The API framework will have its own
> full test suites.

---

## Quick start

Each framework is used from inside its own folder.

```bash
git clone https://github.com/talk2emma/playwright-test.git
cd playwright-test

# UI framework
cd ui-framework
npm ci
npx playwright install
npm run test:smoke
```

See [ui-framework/README.md](ui-framework/README.md) for every command, how to write tests,
and how CI works.
