// window.postMessage protocol v1, spoken between this extension's Owlbear
// content script (`../entrypoints/owlbear.content.js`, running in the
// top-level owlbear.rodeo page) and the separate "VTT Bridge" Owlbear room
// extension (a same-origin-to-Owlbear, cross-origin-to-*this*-extension
// `<iframe>` embedded somewhere in that page).
//
// Owlbear Rodeo extensions can't talk to a WebExtension content script
// through any Owlbear-provided API, so the two sides find each other purely
// through window.postMessage, tagged with `source`/`v` so stray messages
// from the rest of the page (or a future v2) are ignored rather than
// misread:
//
//   1. The room extension iframe posts `HelloMessage` to `window.parent`
//      (repeating on every load/reload of that iframe).
//   2. This extension's content script, listening on `window`, records
//      `event.source` (the iframe's WindowProxy) and `event.origin`, and
//      replies `HelloAckMessage` to that exact source/origin.
//   3. Thereafter, every `RollRecord` produced by `../taps/owlbear`'s
//      `renderRollRecords` is delivered as a `RollMessage`, posted only to
//      that recorded source/origin (never with a wildcard "*" target,
//      since it carries roll data).
//
// This file is the single source of truth for the message shapes and the
// `source` string constants above; the room extension mirrors it.

/** Sent by this extension (the "tap" content script). */
export const SOURCE_TAP = "vtt-bridge";
/** Sent by the Owlbear room extension iframe. */
export const SOURCE_ROOM_EXTENSION = "vtt-bridge-tap";

/** The only protocol version that exists so far. */
export const PROTOCOL_VERSION = 1;

/**
 * @typedef {Object} HelloMessage
 * Posted by the room extension iframe to `window.parent`, announcing itself
 * (and re-announcing on every reload).
 * @property {typeof SOURCE_ROOM_EXTENSION} source
 * @property {typeof PROTOCOL_VERSION} v
 * @property {"hello"} type
 */

/**
 * @typedef {Object} HelloAckMessage
 * Posted by this extension's content script in reply to a `HelloMessage`,
 * to that message's exact `event.source`/`event.origin`.
 * @property {typeof SOURCE_TAP} source
 * @property {typeof PROTOCOL_VERSION} v
 * @property {"hello-ack"} type
 */

/**
 * @typedef {Object} RollMessage
 * Posted by this extension's content script for each roll it renders, to
 * the most recently recorded room-extension source/origin.
 * @property {typeof SOURCE_TAP} source
 * @property {typeof PROTOCOL_VERSION} v
 * @property {"roll"} type
 * @property {import("./owlbear").RollRecord} roll
 */

/** @typedef {HelloAckMessage | RollMessage} TapMessage - messages this extension sends. */
/** @typedef {HelloMessage} RoomExtensionMessage - messages the room extension sends. */

/**
 * Type guard for an incoming `window` "message" event's `data`, narrowing it
 * to a same-version `HelloMessage` from the room extension.
 *
 * @param {unknown} data
 * @returns {data is HelloMessage}
 */
export const isHelloMessage = (data) =>
  !!data &&
  typeof data === "object" &&
  /** @type {{ source?: unknown }} */ (data).source === SOURCE_ROOM_EXTENSION &&
  /** @type {{ v?: unknown }} */ (data).v === PROTOCOL_VERSION &&
  /** @type {{ type?: unknown }} */ (data).type === "hello";
