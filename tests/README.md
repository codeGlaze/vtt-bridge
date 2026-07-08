# End-to-end tests

The end-to-end suite drives the built extension in a real (headless)
Chromium instance with [Playwright](https://playwright.dev/).

## Running

```sh
npm run test:e2e
```

This builds the extension (`npm run build` -> `.output/chrome-mv3/`) and then
runs `playwright test`. The extension must be built before Playwright runs,
since the tests load it straight from `.output/chrome-mv3/`.

## How it works

- `tests/e2e/extension.js` is a shared Playwright fixture. Each test gets its
  own persistent Chromium context (`launchPersistentContext`) with the
  extension loaded via `--load-extension`, so the background service
  worker's `storage.session` queue never bleeds between tests.
- `tests/e2e/fixtures/dmv.html` and `tests/e2e/fixtures/roll20.html` are
  minimal, hand-built replicas of a Dungeon Master's Vault character sheet
  and the Roll20 chat panel -- just enough DOM structure for
  `src/dispatch/*.js` and `src/entrypoints/roll20.content.js` to do their
  work. `roll20.html` simulates Roll20 accepting a chat message by appending
  the textarea's value to a `#chat-log` div when its send button is clicked.
- The fixture's `context` intercepts every request (`context.route`): the
  two real URLs the content scripts are configured to match
  (`https://www.dungeonmastersvault.com/...?frame=true` and
  `https://app.roll20.net/editor/`) are fulfilled with the local fixture
  HTML, and everything else is aborted. This keeps the suite hermetic while
  still exercising the extension's real manifest match patterns.
- `tests/e2e/*.spec.js` cover: DMV listener injection, the Roll20 "connected"
  toast, the full DMV -> background -> Roll20 command pipeline (including an
  advantage roll via ctrl-click), the hidden/`/gmroll` visibility toggle, the
  intentional stale-queue-drop behavior when a roll is made with no Roll20
  tab open, and draft preservation in the Roll20 chat textarea.

## Adding a fixture element

If a dispatch module starts querying a new selector, add the matching markup
to the relevant fixture in `tests/e2e/fixtures/` -- build it from the
selector/dispatch source (`src/selectors.js`, `src/dispatch/`), not from
memory of the live site, since the dispatch modules assume specific innerText
formats (e.g. modifiers like `"+5"`) and DOM shapes.
