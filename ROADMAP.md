# VTT Bridge — Modernization Analysis & Roadmap

*Written July 2026. Covers: current-state analysis, cross-browser (Chrome + Firefox) compatibility, maintainability, and a potential OrcPub / Dungeon Master's Vault API integration.*

---

## 1. Where the project stands today

VTT Bridge is a compact (~1,000 lines of vanilla JS) WebExtension, last meaningfully updated in September 2021 (v1.6.3). The architecture is simple and sound:

```
DMV content script (dmv.js)          Background page              Roll20 content script (roll20.js)
─────────────────────────────        ──────────────────           ─────────────────────────────────
Scrapes character sheet DOM,    →    In-memory command       →    Polls queue every 1s, pastes
attaches roll buttons, builds        queue (enqueue /              commands into #textchat-input
Roll20 chat commands                 dequeue / clear)              textarea and clicks send
```

Supporting layers: `src/dispatch/` (DOM listeners per feature), `src/transform/` (pure functions building chat commands — the only unit-tested code), `src/store.js` (a tiny `beedle` pub/sub store), `src/notify.js` (Notyf toasts).

### What's broken or at risk

| Issue | Severity | Detail |
|---|---|---|
| **Manifest V2 is dead in Chrome** | 🔴 Critical | Chrome fully disabled MV2 for all users in July 2025 (Chrome 138); the enterprise escape hatch is gone (Chrome 139). **The Chrome extension does not run for any current Chrome user today.** The Chrome Web Store removes remaining MV2 listings on **August 31, 2026** — after that the listing (and its install base/reviews) is gone. ([Official timeline](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline)) |
| **Roll20 Jumpgate DOM staleness** | 🔴 High | Jumpgate (Roll20's rebuilt engine) has been the default for new games since January 2025. Same URL (`app.roll20.net/editor`), and `#textchat-input` still exists — but Jumpgate **recreates chat DOM elements dynamically**, so references captured once at page load go stale and sends fail silently. Beyond20 hit exactly this and fixed it by re-querying the DOM on every post ([Beyond20 #1321](https://github.com/kakaroto/Beyond20/issues/1321) → [PR #1324](https://github.com/kakaroto/Beyond20/pull/1324)). `roll20.js` caches nothing across sends but does select the send button by `.btn`, which is unverified under Jumpgate — Beyond20 selects by tag (`querySelector("button")`). |
| **DMV is about to churn its DOM** | 🟡 Medium | DMV announced [v2.6.0.0 "2026 Full-Stack Modernization"](https://www.dungeonmastersvault.com/2026/03/31/%f0%9f%9a%80-release-of-2-6-0-0-2026-full-stack-modernization-is-coming/) (React 16 → 18, Clojure/Java upgrades) with an explicit warning: *"If you maintain custom integrations or plugins, expect required changes."* Everything in `src/dispatch/` scrapes that DOM. |
| **Build toolchain is unmaintained** | 🟡 Medium | Parcel 1 (`parcel-bundler`) is deprecated on npm ("no longer maintained"); Babel/Jest/ESLint/Prettier/web-ext pins are all 4–6 major versions behind; `webextension-polyfill` has had no release since May 2024 and is unnecessary in an MV3-only world. |
| **E2E harness is unrunnable** | 🟡 Medium | Python Selenium 3.141 (2018-era) with pinned `urllib3 1.25`; Selenium 3 predates the W3C-only webdriver world and won't drive current browsers. |
| **No CI** | 🟡 Medium | `.github/` contains only issue templates. Nothing runs lint/tests/builds on push or PR. |

### What's worth keeping

- The **layered design** (dispatch → store → transform → messaging) is good. The `transform/` layer is pure, tested, and browser-agnostic — it needs no changes.
- The **content-script + chat-injection approach for Roll20 is still the state of the art**. Roll20 has no public API for posting chat (the only sanctioned surface is the Pro-only server-side Mod script sandbox), and the dominant comparable extension, Beyond20 (actively released as of June 2026), uses the identical `#textchat-input` technique. ToS-wise, extensions are "unsupported, not banned" — no known enforcement against Beyond20/VTTES-style tools.
- The URL match patterns for both sites are still correct.

---

## 2. Roadmap

Ordered by urgency. Phases 1–2 restore Chrome and harden Roll20 support; 3–4 are the maintainability payoff; 5 is the API investment.

### Phase 1 — Manifest V3 migration + new build tooling 🔴 *(do first; CWS deadline Aug 31, 2026)*

The MV2 → MV3 changes and the bundler replacement are entangled (the manifest is generated/validated by the toolchain), so do them together.

1. **Replace Parcel 1.** Two good options in 2026:
   - **[WXT](https://wxt.dev/)** *(recommended)* — actively maintained, works with vanilla JS (no framework required), and handles the exact pain points of this project natively: per-browser manifest generation, per-browser dev runner (wraps `web-ext`), and store-ready zips (`wxt build -b firefox`, `wxt zip`). Still pre-1.0, but it's the de facto standard now.
   - **Plain esbuild + `web-ext` 10** — fewest moving parts, zero framework risk; requires a small script to emit per-browser manifests. Choose this if a pre-1.0 dependency feels wrong for a maintenance-mode project.
2. **Manifest V3 conversion** (small for this extension — no `webRequest`, no popup, no host permission changes):
   - `manifest_version: 3`.
   - Background: declare **both** `background.service_worker` (Chrome) and `background.scripts` (Firefox event page — Firefox does not support extension service workers). This dual-key manifest is [MDN's documented cross-browser pattern](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background) and both stores accept it; WXT alternatively just generates per-browser manifests.
   - Add `browser_specific_settings.gecko.id` — **required** for Firefox MV3 (strip it from the Chrome build if generating per-browser manifests).
3. **Make background state survive worker termination.** The in-memory `queue` in `background.js` dies whenever Chrome kills the service worker (it will, constantly). Replace with **`browser.storage.session`** — in-memory semantics, 10 MB quota, supported in Chrome 102+ / Firefox 115+, and works identically under Firefox's event-page model. This is the standard fix.
4. **Drop `webextension-polyfill`.** Dormant (last release May 2024) and pointless post-MV2: Chrome's `chrome.*` APIs are promise-based in MV3 and Firefox natively provides `browser.*`. A one-line alias covers both: `const api = globalThis.browser ?? globalThis.chrome;` (WXT ships an equivalent `browser` object). This also removes the awkward `dist/polyfill.js` copy step from every manifest entry.
5. **Re-submit to both stores.** The Chrome listing must receive an MV3 update **before August 31, 2026** or it is delisted. Firefox: MV2 remains fully supported (Mozilla has no announced deprecation), so nothing breaks there in the interim — but ship the same MV3 build to both to keep one codebase.

**Exit criteria:** extension loads and round-trips a roll in current stable Chrome and Firefox; MV3 packages pass `web-ext lint` / `addons-linter` and CWS validation.

### Phase 2 — Roll20 Jumpgate hardening 🔴

1. **Re-query the chat DOM on every send.** In `receiveCommands()`, look up `#textchat-input`, its `textarea`, and its send button fresh each time (Beyond20's fix in [PR #1324](https://github.com/kakaroto/Beyond20/pull/1324)). Never hold references across sends.
2. **Select the send button by tag** (`input.querySelector("button")`) instead of `.btn` — the class is unverified under Jumpgate; Beyond20 uses the tag selector.
3. **Preserve the user's draft**: save and restore the textarea's existing contents around a send (Beyond20 does this; today vtt-bridge clobbers whatever the user was typing).
4. **Replace the 1-second `setInterval` poll with push messaging.** Have the background script push queued commands to the Roll20 tab (`tabs.sendMessage` after the Roll20 content script announces itself, or a long-lived `runtime.connect` port), keeping `storage.session` as the buffer for commands issued before a Roll20 tab exists. Benefits: no wasted wakeups keeping the MV3 service worker alive artificially, sub-second roll latency, and simpler failure reasoning. *(Can ship after Phase 1 — polling still works under MV3, each poll just wakes the worker.)*
5. **Test against both editors**: Jumpgate games (default for new games) *and* legacy games, which still exist and behave slightly differently.
6. Note for the future: Roll20's late-2025 CSP hardening blocks inline `style` attributes in injected chat HTML. VTT Bridge only sends plain `/roll` text commands, which are unaffected — keep it that way unless there's a strong reason not to.

### Phase 3 — Toolchain & test modernization 🟡

1. **Dev tooling**: ESLint 9 (flat config) + Prettier 3; migrate Jest → **Vitest** (near-drop-in for the `transform/` tests, removes the Babel dependency entirely since Vitest handles ESM natively). With Parcel and Babel gone, `devDependencies` shrinks from 13 packages to ~5.
2. **CI (GitHub Actions)**: on push/PR — install, lint, unit tests, build both browser packages, `web-ext lint`, upload zips as artifacts. This alone is the biggest maintainability win per hour invested.
3. **Replace the Python/Selenium e2e harness with Playwright (TypeScript/JS)**: one language for the whole repo, first-class Chromium extension loading (`launchPersistentContext` with `--load-extension`), and the existing `tests/characters.json` fixtures carry over. Firefox extension automation is weaker in Playwright; pragmatic split: Playwright e2e on Chromium in CI + `web-ext run` for manual Firefox smoke tests before release.
4. **Consider TypeScript (or JSDoc `checkJs`)** for `src/` — at ~1,000 lines this is a day of work, and the type layer documents the message protocol and command shapes, which is where regressions hide. Optional but high leverage; WXT is TS-native.
5. **Drop `beedle`** (micro-store, effectively unmaintained): the store has 4 actions and 4 mutations — a ~20-line plain module with a subscribe function removes the last runtime dependency besides Notyf.
6. **Centralize all DMV/Roll20 CSS selectors in one module** (`src/selectors.js`) with loud console errors when a selector misses. Today selectors are scattered through 12 dispatch files; when DMV 2.6.0.0 lands, the break-fix loop becomes "update one file" instead of an archaeology dig.

### Phase 4 — Release automation & project hygiene 🟢

1. **Release workflow**: tag-triggered GitHub Action that builds both zips, signs/uploads to AMO (`web-ext sign` — the AMO API is well supported) and uploads to CWS (via `chrome-webstore-upload` or the CWS API). Removes the manual-upload bus factor.
2. **Single source of version truth** — today the version lives in both `manifest.json` and `package.json`; generate one from the other (WXT does this automatically from `package.json`).
3. **Docs**: rewrite `DEVELOPERS.md` for the new toolchain (currently instructs `yarn global add parcel`, which installs the deprecated Parcel 1); add a `CHANGELOG.md`; update README (it still describes the upstream project's maintenance-mode status and badges — decide what this fork's own status and store listings are).
4. **Scheduled canary** *(optional)*: a weekly CI job that loads the DMV character sheet and asserts the anchor selectors still exist — turns "users report breakage on Discord" into "CI email before users notice." Worth it given two upstream sites that change without notice.

### Phase 5 — OrcPub / DMV API integration 🟢 *(the strategic bet)*

**Finding: there is no official API, but there is a real, viable endpoint.** DMV is the community fork of OrcPub2 ([Orcpub/orcpub](https://github.com/Orcpub/orcpub), EPL-2.0, actively maintained — commits through April 2026). Its backend serves the character sheet page's own data from:

```
GET https://www.dungeonmastersvault.com/dnd/5e/characters/:id     → EDN, no auth
```

The `:id` is the same one in the sheet URL the extension already matches. This is exactly how the sheet's frontend loads its data (`re-frame` sub in `subs.cljs` → plain HTTP GET). Verified in source on both `master` and `develop`; a live 200 wasn't confirmed against production (the test-fixture characters in `tests/characters.json` appear deleted — a one-minute `curl` with a live character id settles it).

**Caveats:** it's undocumented and unstable by definition; the payload is the *raw* character entity (selections/modifiers) — derived stats (skill bonuses, save DCs, attack strings — exactly what VTT Bridge needs) are computed client-side in OrcPub's ClojureScript, so consuming the raw entity means reimplementing nontrivial rules logic.

**Recommended plan:**

1. **Verify the endpoint live** with a real character id (one `curl`).
2. **Engage the DMV maintainers** — they're reachable ([Discord](https://discord.gg/uv5vXhk), active GitHub) and VTT Bridge is the *official* Roll20 integration linked from DMV's homepage, so there's standing to ask. The 2.6.0.0 release explicitly acknowledges integration breakage, making now the right moment. The concrete ask: a small, documented, versioned endpoint returning **derived** character stats as JSON (the numbers already computed for the PDF export path). Since OrcPub is EPL-2.0 open source, this can be contributed as a PR rather than requested as a favor — likely ~a few hundred lines exposing existing cljc computation server-side.
3. **Adopt a hybrid architecture** (this is the key design decision):
   - **Data from the API** — modifiers, weapons, spells, features come from the endpoint instead of `innerText` scraping. Eliminates the whole `validate.js` "is this innerText actually a modifier?" error class.
   - **Buttons still in the DOM** — injection points for click targets are inherently DOM-coupled; that doesn't go away. But anchoring buttons is far more resilient than parsing values out of table cells, and after Phase 3.6 all anchors live in one file.
   - Net effect: DMV DOM churn (like 2.6.0.0) breaks *button placement* (cosmetic, quick fix) instead of *roll correctness* (data corruption, hard to even notice).
4. **Keep DOM scraping as the fallback** until the API path has soaked for a release or two.

**On the Roll20 side, no API is possible**: no public REST/websocket surface exists or is announced; chat injection remains the only option (see Phase 2).

---

## 3. Suggested sequencing & effort

| Phase | Effort (rough) | Outcome |
|---|---|---|
| 1. MV3 + tooling | 2–4 days | **Chrome works again**; deadline met |
| 2. Jumpgate hardening | 1–2 days | Roll20 side reliable on current platform |
| 3. Toolchain/tests | 2–4 days | CI green, one language, deps current |
| 4. Release automation | 1–2 days | One-command releases to both stores |
| 5. API integration | 1–2 weeks incl. upstream PR | Resilience to DMV changes; the long-term maintainability payoff |

Phases 1+2 are one combined "resurrection release" (target: well before **Aug 31, 2026**). Phase 5 runs partly on the DMV maintainers' timeline, so start the conversation early even though the code lands last.

---

## 4. Key references

- [Chrome MV2 deprecation timeline](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline) · [MDN cross-browser `background` key](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background) · [Firefox MV3 migration guide](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)
- [WXT](https://wxt.dev/) · [web-ext](https://github.com/mozilla/web-ext) · [MDN `storage.session`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/session)
- [Roll20 Jumpgate](https://help.roll20.net/hc/en-us/articles/21569402281495-Jumpgate) · [Beyond20 stale-DOM fix](https://github.com/kakaroto/Beyond20/pull/1324)
- [Orcpub/orcpub repo](https://github.com/Orcpub/orcpub) ([routes.clj](https://github.com/Orcpub/orcpub/blob/develop/src/clj/orcpub/routes.clj)) · [DMV 2.6.0.0 announcement](https://www.dungeonmastersvault.com/2026/03/31/%f0%9f%9a%80-release-of-2-6-0-0-2026-full-stack-modernization-is-coming/) · [DMV Discord](https://discord.gg/uv5vXhk)
