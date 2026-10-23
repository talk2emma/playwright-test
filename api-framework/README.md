# EventHub API Automation Framework

> **Status: not built yet.** This folder is reserved for the API test framework.
> It will be built once the API endpoints and scenarios to cover are defined.

## Purpose

Tests the EventHub REST API directly over HTTP (no browser), e.g.
`https://api.eventhub.rahulshettyacademy.com/api`. API tests are much faster than UI tests
and check the business rules, status codes and response contracts that the UI relies on.

## Planned approach

It will follow the same conventions as [`../ui-framework`](../ui-framework/README.md), so
anyone who knows one framework can work in the other:

- **Playwright Test** (`request` fixture) with **TypeScript** — no browser needed
- Its own `package.json`, `playwright.config.ts`, `tsconfig.json` and lint/format setup
- **Service objects** (one class per API resource) — the API equivalent of page objects
- Custom **fixtures** for authenticated clients and test data
- Smoke / regression suites selected by **tags**
- A daily **GitHub Actions** workflow in the repository root `.github/workflows/`, prefixed
  `api-`
- A README and a step-by-step guide explaining how every part works
