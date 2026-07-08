# Development

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- npm (bundled with Node.js)

## Getting started

```sh
# Clone the repository
git clone https://github.com/codeGlaze/vtt-bridge.git && cd vtt-bridge

# Install dependencies (also runs `wxt prepare` via postinstall)
npm install
```

## Development

```sh
# Launch Chrome with the extension loaded, rebuilding on change
npm run dev

# Same, but for Firefox
npm run dev:firefox
```

Both commands are powered by [WXT](https://wxt.dev/), which opens a browser instance with the extension pre-loaded.

## Testing and linting

```sh
# Run unit tests (Vitest) for src/transform
npm test

# Lint with ESLint
npm run lint

# Check formatting with Prettier
npm run format:check

# Auto-format with Prettier
npm run format
```

## Building

```sh
# Build for Chrome -> .output/chrome-mv3
npm run build

# Build for Firefox -> .output/firefox-mv3
npm run build:firefox

# Package store-ready zips -> .output/*.zip
npm run zip
npm run zip:firefox
```

## Source layout

- `src/entrypoints/` — the background script (service worker on Chrome, event page on Firefox) and the two content scripts (`dmv.content.js` for Dungeon Master's Vault, `roll20.content.js` for Roll20)
- `src/dispatch/` — attaches roll-button listeners to the DMV character sheet, one module per action type
- `src/transform/` — pure command/state transformation logic, covered by Vitest unit tests
- `src/store.js` — small pub/sub state store used by the DMV content script
- `src/notify.js` — user-facing notifications
- `src/common.js` — shared helpers

`tests/` contains a legacy Python/Selenium end-to-end harness that is pending replacement with Playwright; see ROADMAP.md (Phase 3) for details.
