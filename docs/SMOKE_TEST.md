# Manual smoke test

The Playwright suite (`npm run test:e2e`) proves the extension's own pipeline
against fixture pages, but it cannot prove that the *live* DMV and Roll20
frontends still match our selectors (`src/selectors.js`). Run this checklist
against the real sites before any store submission, and after any known DMV or
Roll20 frontend change.

Prerequisites: a Dungeon Master's Vault account with at least one character,
and a Roll20 account with a game you own — ideally one Jumpgate game (the
default for new games) and one legacy game. (Roll20 has no account-less demo;
a free account's built-in tutorial game at `app.roll20.net/editor/tutorial`
or an empty self-created game is the cheapest real chat target. An anonymous
DMV character has no saved id and therefore no `?frame=true` sheet URL, so a
DMV account is required for the full flow.)

Before the manual pass, `npm run probe:live` (or `-- --dev` for DMV's beta
site) checks every required DMV selector against the live site with no
account needed — it catches selector breakage early, but it cannot exercise
rolls end-to-end.

## Load the built extension

```sh
npm install && npm run build && npm run build:firefox
```

- **Chrome**: `chrome://extensions` → enable *Developer mode* → *Load
  unpacked* → select `.output/chrome-mv3/`.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Load Temporary
  Add-on…* → select `.output/firefox-mv3/manifest.json`.

Repeat the checklist in **both** browsers.

## Checklist

### Connect

- [ ] Open a DMV character sheet via the <kbd>www</kbd> link (the URL must end
      in `?frame=true`) → "Connected to VTT Bridge v2.x" toast appears.
- [ ] Open a Roll20 game in another tab → connected toast appears there too.
- [ ] Background console shows no errors (Chrome: extension's *service
      worker* link on `chrome://extensions`; Firefox: *Inspect* on
      `about:debugging`).

### Core rolls (from the DMV sheet, landing in Roll20 chat)

- [ ] Skill check → `/roll 1d20±N` appears in Roll20 chat.
- [ ] Ability check and saving throw.
- [ ] <kbd>Ctrl</kbd>-click a roll → advantage (`2d20kh1±N`).
- [ ] <kbd>Shift</kbd>-click a roll → disadvantage (`2d20kl1±N`).
- [ ] Initiative roll.

### Tabs and details

- [ ] Weapons: attack and damage rolls from the weapons table.
- [ ] Spells: expand a spell, cast it (attack roll and/or description).
- [ ] Features/proficiencies: use a feature → emote/description in chat.

### Visibility and UX

- [ ] Toggle visibility (eye button) → "Commands are hidden!" toast; rolls now
      arrive as `/gmroll` / whispers only the GM can see; toggle back.
- [ ] Type a partial message in Roll20's chat box, roll from DMV → the roll
      posts and the draft text is restored intact.
- [ ] Rolls clicked while no Roll20 tab is open are *not* delivered when one
      later connects (stale commands are intentionally discarded).

### Roll20 variants

- [ ] Repeat at least the skill roll in **both** a Jumpgate game and a legacy
      game.
- [ ] Post several rolls in a row over a few minutes (lets Chrome's service
      worker idle-terminate between rolls; deliveries must still arrive).

## If something breaks

Note which checklist item failed, the browser, Jumpgate vs legacy, and copy
any errors from (a) the page console on the DMV/Roll20 tab and (b) the
background console. Selector breakage on either site is usually a one-file
fix in `src/selectors.js`.
