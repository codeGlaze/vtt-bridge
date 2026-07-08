# The Owlbear tap

The "Owlbear tap" pipes dice rolls from a Dungeon Master's Vault character
sheet into an Owlbear Rodeo room, so a roll made on a character sheet shows
up as a notification for the table without anyone re-typing it into chat.

It is split across two independent pieces:

- **The browser extension's content script** (built as part of the main
  VTT Bridge extension in `src/`): runs on `owlbear.rodeo` pages, watches
  for roll activity relayed from a Dungeon Master's Vault tab, and posts
  roll records into the page via `window.postMessage`.
- **The Owlbear Rodeo room extension** (this directory's sibling,
  [`../owlbear-extension/`](../owlbear-extension/)): a small hosted web app
  registered with Owlbear Rodeo as an extension. It runs in a hidden
  background iframe inside the room, receives those `postMessage` roll
  records, displays them as notifications, and broadcasts them to the rest
  of the room via the [Owlbear Rodeo SDK](https://docs.owlbear.rodeo/extensions/)
  broadcast channel.

## Architecture

```
Dungeon Master's Vault character sheet
        |  (roll happens)
        v
VTT Bridge browser extension (content script on owlbear.rodeo)
        |  window.postMessage({ source: "vtt-bridge", v: 1, type: "roll", roll })
        v
Owlbear Rodeo room extension background page (owlbear-extension/)
        |  OBR.broadcast.sendMessage("com.vtt-bridge/roll", roll, { destination: "REMOTE" })
        v
Every other room member's copy of the room extension
        |  OBR.broadcast.onMessage("com.vtt-bridge/roll", ...)
        v
OBR.notification.show(...) for each room member (subject to visibility rules)
```

### The postMessage protocol (v1)

The room extension's background page announces itself to the hosting page
on load, and re-announces every ~2 seconds until it gets an ack (to survive
load-order races with the content script):

```
-> window.parent: { source: "vtt-bridge-tap", v: 1, type: "hello" }
<- from page:      { source: "vtt-bridge", v: 1, type: "hello-ack" }
<- from page:      { source: "vtt-bridge", v: 1, type: "roll", roll: RollRecord }
```

```
RollRecord = {
  character: string, summary: string,
  formula: string | null, rolls: number[], total: number | null,
  description: string | null, visible: boolean
}
```

Only messages with `source === "vtt-bridge"` and `v === 1` are trusted.

## Installing it in a room

1. The room extension is built and deployed to GitHub Pages by
   [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) on every
   push to `main` that touches `owlbear-extension/`. GitHub Pages must be
   enabled once for this repo (Settings → Pages → Source: GitHub Actions).
2. Once deployed, the extension's manifest URL is
   `https://<owner>.github.io/vtt-bridge/manifest.json`.
3. In Owlbear Rodeo, open your profile, click **Add Extension**, and paste
   that manifest URL.
4. Add the extension to a room. It has no visible UI of its own -- it
   works entirely through notifications.
5. Install the VTT Bridge browser extension and keep an owlbear.rodeo tab
   open alongside your Dungeon Master's Vault character sheet; both halves
   are required for rolls to reach the room.

See [`../owlbear-extension/README.md`](../owlbear-extension/README.md) for
build and local-testing instructions.

## Current limitations

- **Notifications only.** Rolls show up as a single compact
  `OBR.notification.show(...)` line (e.g. `"Aria rolls Perception check:
  1d20+5 → [14] +5 = 19"`); there is no persistent roll log or dice-tray UI
  yet.
- **Hidden rolls are narrowly visible.** A `RollRecord` with
  `visible: false` is only shown to the GM (`OBR.player.getRole() ===
  "GM"`) and to the client that made the roll -- other players' clients
  suppress it. It is still broadcast to everyone; receivers decide whether
  to display it.
- **Requires both halves.** The room extension has nothing to display
  without the VTT Bridge browser extension's content script also running
  on the same owlbear.rodeo tab; likewise, the browser extension's tap has
  nothing to broadcast to without this room extension installed in the
  room.
- **No persistence.** Notifications are transient; closing them or missing
  one (e.g. a client that wasn't in the room yet) loses that roll.
