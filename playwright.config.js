import { defineConfig } from "@playwright/test";

// See https://playwright.dev/docs/test-configuration
//
// This suite loads the built extension from `.output/chrome-mv3/` into a
// persistent Chromium context (see tests/e2e/extension.js), so `npm run
// build` must be run first -- `npm run test:e2e` does this automatically.
export default defineConfig({
  testDir: "tests/e2e",
  // Each test launches its own persistent browser context (a real Chromium
  // profile with the extension loaded), so tests cannot safely share a
  // worker or run concurrently against the same profile.
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
  },
});
