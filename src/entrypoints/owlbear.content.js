import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

import { messageType } from "@/common";
import { INTERNAL_BRIDGE_SOURCE, TAP_MARKER_ATTRIBUTE } from "@/taps/internalBridge";
import { PROTOCOL_VERSION, SOURCE_TAP } from "@/taps/protocol";
import { renderRollRecords } from "@/taps/owlbear";
import { showConnected, showToast } from "@/notify";

// How long to wait, after a roll first has nowhere to go, before warning
// the user that the room extension hasn't shown up.
const HELLO_GRACE_PERIOD_MS = 2000;

export default defineContentScript({
  matches: ["*://www.owlbear.rodeo/*", "*://owlbear.rodeo/*"],
  cssInjectionMode: "manifest",
  main() {
    // Owlbear Rodeo's own page has no API this extension can use to reach
    // the separate "VTT Bridge" room extension (a cross-origin iframe
    // somewhere in the page) -- the two sides only find each other via
    // window.postMessage, per the handshake documented in `@/taps/protocol`.
    /** @type {Window | null} */
    let tapSource = null;
    /** @type {string | null} */
    let tapOrigin = null;

    /** Rolls buffered because no tap iframe had said hello yet. */
    /** @type {import("@/taps/owlbear").RollRecord[]} */
    let pending = [];
    let warnedMissingTap = false;
    let missingTapTimerScheduled = false;

    /** @param {import("@/taps/owlbear").RollRecord} roll */
    const deliver = (roll) => {
      if (tapSource && tapOrigin) {
        tapSource.postMessage({ source: SOURCE_TAP, v: PROTOCOL_VERSION, type: "roll", roll }, tapOrigin);
        return;
      }

      pending.push(roll);

      if (!missingTapTimerScheduled) {
        missingTapTimerScheduled = true;
        setTimeout(() => {
          if (!tapSource && !warnedMissingTap) {
            warnedMissingTap = true;
            showToast("Owlbear Rodeo room extension not detected");
          }
        }, HELLO_GRACE_PERIOD_MS);
      }
    };

    // The room extension iframe's `hello` (@/taps/protocol) is a genuinely
    // cross-frame postMessage, which Chrome does not deliver to this
    // (ISOLATED-world) listener directly -- `./owlbear-bridge.content.js`
    // (a MAIN-world sibling of this script) is the one that actually sees
    // it, tags the source iframe, and relays it here.
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || data.source !== INTERNAL_BRIDGE_SOURCE || data.type !== "hello-detected" || !data.found) {
        return;
      }

      const marked = /** @type {HTMLIFrameElement | null} */ (document.querySelector(`[${TAP_MARKER_ATTRIBUTE}]`));
      if (!marked || !marked.contentWindow) {
        return;
      }

      // The room extension iframe may say hello more than once (e.g. it
      // reloads); always trust the most recent handshake.
      tapSource = marked.contentWindow;
      tapOrigin = /** @type {string} */ (data.origin);
      tapSource.postMessage({ source: SOURCE_TAP, v: PROTOCOL_VERSION, type: "hello-ack" }, tapOrigin);

      if (pending.length > 0) {
        const queued = pending;
        pending = [];
        for (const roll of queued) {
          deliver(roll);
        }
      }
    });

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === messageType.run) {
        for (const roll of renderRollRecords(message.intents)) {
          deliver(roll);
        }
      }
    });

    showConnected();
    browser.runtime.sendMessage({ type: messageType.ready });
  },
});
