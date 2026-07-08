# VTT Bridge -- Owlbear Rodeo room extension

The Owlbear Rodeo half of the "Owlbear tap": a small static web app, loaded
by Owlbear Rodeo as a background extension, that receives dice-roll records
tapped from Dungeon Master's Vault character sheets (via the VTT Bridge
browser extension's content script) and displays/broadcasts them in the
room. See [`../docs/OWLBEAR.md`](../docs/OWLBEAR.md) for the full
architecture and protocol.

## Build

```sh
npm install
npm run build
```

This bundles `src/background.js` with esbuild and copies `public/`
(`manifest.json`, `background.html`, `icon.png`) into `dist/`. `dist/` is
what gets published to GitHub Pages by `.github/workflows/pages.yml` -- it
is not checked into git.

This is a self-contained package (its own `package.json`, independent of
the root project's `package.json`/lint/test setup).

## Local testing

Owlbear Rodeo supports loading an extension from a `localhost` manifest
URL during development, so you don't need to deploy anywhere to iterate:

1. `npm run build`, then serve `dist/` over HTTP, e.g. `npx serve dist`
   (or any static file server) -- note the port it prints.
2. In your Owlbear Rodeo profile, click **Add Extension** and paste the
   local manifest URL, e.g. `http://localhost:3000/manifest.json`.
3. Add the extension to a room to test it.

See the official
["Install Your Extension"](https://docs.owlbear.rodeo/extensions/tutorial-hello-world/install-your-extension/)
tutorial page, which documents this localhost install flow.

## Deploying

Pushes to `main` that touch this directory are built and published to
GitHub Pages by `.github/workflows/pages.yml`. Once GitHub Pages is
enabled for this repo (Settings → Pages → Source: GitHub Actions), the
installable manifest URL is:

```
https://<owner>.github.io/vtt-bridge/manifest.json
```

All paths inside `manifest.json` and `background.html` are relative (no
leading `/`), so the built extension works correctly when served from
that `/vtt-bridge/` sub-path rather than a domain root.
