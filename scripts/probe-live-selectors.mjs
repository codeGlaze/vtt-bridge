// Live selector canary: checks every DMV selector in src/selectors.js
// against the real Dungeon Master's Vault site, without needing an account.
//
// The character-builder page renders the same sheet DOM the extension
// attaches to (for a fresh, anonymous character), so core selectors can be
// validated there. Content-dependent selectors (spells, weapons, details
// tabs) only exist for characters that have that content — they are
// reported as EXPECTED-MISSING on the builder page rather than failures.
//
// Usage:
//   node scripts/probe-live-selectors.mjs           # live site
//   node scripts/probe-live-selectors.mjs --dev     # dev/beta site
//   node scripts/probe-live-selectors.mjs <url>     # any sheet/builder URL
//
// Honors HTTPS_PROXY if set. PROBE_ARGS can pass extra Chromium args
// (e.g. PROBE_ARGS=--ssl-version-max=tls1.2 for TLS-intercepting proxies).

import { existsSync } from "node:fs";

import { chromium } from "@playwright/test";
import { DMV } from "../src/selectors.js";

// Same fallback as tests/e2e/extension.js: prefer a pre-installed Chromium
// (dev containers) over Playwright's own browser resolution.
const preinstalledChromium = "/opt/pw-browsers/chromium";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (existsSync(preinstalledChromium) ? preinstalledChromium : undefined);

// Selectors that only appear when the character has matching content or a
// details tab is open; absent on a fresh builder character.
const CONTENT_DEPENDENT = new Set([
  "tableHeaderCell",
  "detailsColumns",
  "initiative",
  "proficiencyRollButtonAnchor",
  "spellRow",
  "spellRowAnchor",
  "spellPointer",
  "spellFormButton",
  "actionsSection",
  "bonusActionsSection",
  "featuresTraitsAndFeatsSection",
  "reactionsSection",
  "weapons",
  "weaponRollButtonAnchor",
]);

const arg = process.argv[2];
const url =
  arg === "--dev"
    ? "https://dev.dungeonmastersvault.com/pages/dnd/5e/character-builder"
    : (arg ?? "https://www.dungeonmastersvault.com/pages/dnd/5e/character-builder");

const browser = await chromium.launch({
  headless: true,
  executablePath,
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  args: process.env.PROBE_ARGS ? process.env.PROBE_ARGS.split(" ") : [],
});

const page = await browser.newPage();
page.setDefaultTimeout(45000);
let failures = 0;

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  // Give the ClojureScript app time to render the sheet.
  await page.waitForSelector(DMV.appReady, { timeout: 30000 });

  console.log(`Probing ${url}`);
  console.log(`Page title: ${await page.title()}\n`);

  for (const [name, selector] of Object.entries(DMV)) {
    const count = await page.locator(selector).count();
    let status;
    if (count > 0) {
      status = `OK (${count})`;
    } else if (CONTENT_DEPENDENT.has(name)) {
      status = "expected-missing";
    } else {
      status = "MISSING";
      failures++;
    }
    console.log(`${status.padEnd(18)} ${name.padEnd(30)} ${selector}`);
  }
} finally {
  await browser.close();
}

if (failures > 0) {
  console.error(`\n${failures} required selector(s) missing — DMV frontend may have changed.`);
  process.exit(1);
}
console.log("\nAll required selectors present.");
