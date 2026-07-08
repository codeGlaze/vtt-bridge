// Internal-only bridge between this extension's two Owlbear content
// scripts -- NOT part of the public `./protocol` v1 contract the "VTT
// Bridge" room extension speaks.
//
// Chrome does not deliver a window "message" event to an ISOLATED-world
// content script's listeners when that event's `source` is a genuinely
// different frame (confirmed empirically: same-window/self postMessage
// crosses the ISOLATED/MAIN world boundary just fine, but a message posted
// by a child iframe to `window.parent` does not reach an ISOLATED-world
// listener on that parent window -- see `../entrypoints/owlbear-bridge.content.js`
// for the long version). Since the room extension is exactly such a
// cross-frame iframe, `../entrypoints/owlbear-bridge.content.js` (a MAIN-world
// sibling of `../entrypoints/owlbear.content.js`, which *can* see the
// handshake) detects it and relays the fact inward via a same-window
// postMessage using the shapes below.
//
// (The reverse direction -- an ISOLATED-world content script posting *to* a
// cross-frame iframe -- is not restricted, so once the ISOLATED-world script
// knows which iframe is the tap, it talks to it directly; no relay needed
// for outgoing messages.)

/** Tags messages relayed between this extension's own MAIN/ISOLATED worlds. */
export const INTERNAL_BRIDGE_SOURCE = "vtt-bridge-internal";

/**
 * DOM attribute the MAIN-world bridge marks the hello-sending iframe
 * element with, so the ISOLATED-world content script can find the exact
 * same element -- DOM elements (and their attributes) are shared across
 * worlds; arbitrary JS object references (like the iframe's WindowProxy
 * passed as `MessageEvent.source`) are not.
 */
export const TAP_MARKER_ATTRIBUTE = "data-vtt-bridge-tap";

/**
 * @typedef {Object} HelloDetectedMessage
 * Relayed by the MAIN-world bridge to the ISOLATED-world content script
 * after it sees (and tags the source iframe for) a `HelloMessage`
 * (`./protocol`).
 * @property {typeof INTERNAL_BRIDGE_SOURCE} source
 * @property {"hello-detected"} type
 * @property {string} origin - the hello's `event.origin`.
 * @property {boolean} found - whether the source iframe could be matched against `document.querySelectorAll("iframe")`.
 */
