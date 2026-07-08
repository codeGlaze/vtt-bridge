// Shared Playwright fixture for the VTT Bridge end-to-end suite.
//
// Every test gets its own persistent Chromium context with the built
// extension loaded from `.output/chrome-mv3/` (run `npm run build` first --
// `npm run test:e2e` does this automatically). All network traffic is
// intercepted: the two real URLs the extension's content scripts match are
// served from the local fixtures in `tests/e2e/fixtures/`, and everything
// else is aborted, so the suite never touches the network.
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test as base, expect } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const EXTENSION_PATH = path.resolve(__dirname, "../../.output/chrome-mv3");

// Some environments (e.g. the development container) pre-install Chromium
// outside Playwright's own browser cache; use it when present, otherwise
// fall back to Playwright's default resolution (e.g. in CI, where
// `playwright install chromium` provides the browser). Override with
// PLAYWRIGHT_CHROMIUM_EXECUTABLE to force a specific binary.
const preinstalledChromium = "/opt/pw-browsers/chromium";
export const CHROMIUM_EXECUTABLE_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (existsSync(preinstalledChromium) ? preinstalledChromium : undefined);

// The exact URLs matched by src/entrypoints/dmv.content.js,
// src/entrypoints/roll20.content.js, and src/entrypoints/owlbear.content.js
// -- must stay real-looking so the extension's manifest match patterns
// fire, even though they're served from local fixtures and never hit the
// network.
export const DMV_URL = "https://www.dungeonmastersvault.com/pages/dnd/5e/characters/12345?frame=true";
export const ROLL20_URL = "https://app.roll20.net/editor/";
export const OWLBEAR_URL = "https://www.owlbear.rodeo/room/test";

const DMV_FIXTURE_PATH = path.resolve(__dirname, "fixtures/dmv.html");
const ROLL20_FIXTURE_PATH = path.resolve(__dirname, "fixtures/roll20.html");
const OWLBEAR_FIXTURE_PATH = path.resolve(__dirname, "fixtures/owlbear.html");

const CONNECTED_TOAST_TEXT = "Connected to VTT Bridge";

const installRoutes = async (context) => {
  const [dmvHtml, roll20Html, owlbearHtml] = await Promise.all([
    fs.readFile(DMV_FIXTURE_PATH, "utf-8"),
    fs.readFile(ROLL20_FIXTURE_PATH, "utf-8"),
    fs.readFile(OWLBEAR_FIXTURE_PATH, "utf-8"),
  ]);

  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url === DMV_URL) {
      return route.fulfill({ status: 200, contentType: "text/html", body: dmvHtml });
    }
    if (url === ROLL20_URL) {
      return route.fulfill({ status: 200, contentType: "text/html", body: roll20Html });
    }
    if (url === OWLBEAR_URL) {
      return route.fulfill({ status: 200, contentType: "text/html", body: owlbearHtml });
    }
    return route.abort();
  });
};

export const test = base.extend({
  // Overrides @playwright/test's default `context` fixture (which launches
  // a fresh, extension-less browser) with a persistent context that has the
  // built extension loaded. One temporary profile per test keeps the
  // background service worker's storage.session queue isolated between
  // tests.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "vtt-bridge-e2e-"));

    const context = await base.chromium.launchPersistentContext(userDataDir, {
      headless: true,
      executablePath: CHROMIUM_EXECUTABLE_PATH,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });

    await installRoutes(context);

    await use(context);

    await context.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  },
});

export { expect };

/** Locates the "Connected to VTT Bridge" toast, wherever it's shown. */
export const connectedToast = (page) => page.locator(".vtt-toast-message", { hasText: CONNECTED_TOAST_TEXT });

/** Opens the DMV fixture page and waits for the extension to attach. */
export const openDmv = async (context) => {
  const page = await context.newPage();
  await page.goto(DMV_URL);
  await expect(connectedToast(page)).toBeVisible();
  return page;
};

/** Opens the Roll20 fixture page and waits for the extension to connect. */
export const openRoll20 = async (context) => {
  const page = await context.newPage();
  await page.goto(ROLL20_URL);
  await expect(connectedToast(page)).toBeVisible();
  return page;
};

/** Opens the Owlbear fixture page and waits for the extension to connect. */
export const openOwlbear = async (context) => {
  const page = await context.newPage();
  await page.goto(OWLBEAR_URL);
  await expect(connectedToast(page)).toBeVisible();
  return page;
};

/**
 * Resolves the fixture's stand-in "VTT Bridge" Owlbear room extension
 * iframe (see tests/e2e/fixtures/owlbear.html) as a Playwright `Frame`, so
 * the test can `evaluate` inside it (e.g. to read its `window.receivedRolls`).
 *
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<import("@playwright/test").Frame>}
 */
export const owlbearTapFrame = async (page) => {
  const handle = await page.waitForSelector("#tap-iframe");
  const frame = await handle.contentFrame();
  if (!frame) {
    throw new Error("Owlbear fixture's #tap-iframe has no content frame");
  }
  return frame;
};

/** Entries appended to the Roll20 fixture's simulated chat log. */
export const chatLogEntries = (page) => page.locator("#chat-log .chat-entry");

/** Resolves the extension's background service worker, waiting for it if necessary. */
export const getBackgroundWorker = async (context) => {
  const [existing] = context.serviceWorkers();
  return existing ?? context.waitForEvent("serviceworker");
};
