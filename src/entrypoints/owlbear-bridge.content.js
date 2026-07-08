import { defineContentScript } from "wxt/utils/define-content-script";

import { INTERNAL_BRIDGE_SOURCE, TAP_MARKER_ATTRIBUTE } from "@/taps/internalBridge";
import { isHelloMessage } from "@/taps/protocol";

/**
 * The MAIN-world half of the Owlbear tap's iframe handshake.
 *
 * Chrome does not deliver a window "message" event to an ISOLATED-world
 * content script's listeners when that event's `source` is a genuinely
 * different frame (e.g. a child iframe posting to `window.parent`) -- only
 * same-window (self) postMessage crosses that boundary. Since the "VTT
 * Bridge" Owlbear room extension is exactly such a cross-frame iframe, this
 * MAIN-world sibling of `./owlbear.content.js` is the only place in this
 * extension that can actually observe its `hello` handshake
 * (`@/taps/protocol`).
 *
 * MAIN-world content scripts have no access to extension APIs, so this
 * script's only job is to notice the handshake, tag the responsible iframe
 * element (shared DOM, unlike JS object references, which are not shared
 * across worlds) with `TAP_MARKER_ATTRIBUTE`, and relay the rest to
 * `owlbear.content.js` via a same-window postMessage -- which *is*
 * delivered across worlds. `owlbear.content.js` does the actual talking to
 * the extension background and to the tagged iframe from there; sending *to*
 * a cross-frame iframe from an ISOLATED-world content script is not
 * restricted, only receiving *from* one is, so no relay is needed for
 * outgoing messages.
 */
export default defineContentScript({
  matches: ["*://www.owlbear.rodeo/*", "*://owlbear.rodeo/*"],
  world: "MAIN",
  main() {
    window.addEventListener("message", (event) => {
      if (!isHelloMessage(event.data)) {
        return;
      }

      const iframes = Array.from(document.querySelectorAll("iframe"));
      // Only one iframe can be "the" tap at a time; clear any stale marker
      // before re-marking (e.g. a previous hello from a since-removed or
      // since-reloaded iframe).
      for (const iframe of iframes) {
        iframe.removeAttribute(TAP_MARKER_ATTRIBUTE);
      }
      const source = iframes.find((iframe) => iframe.contentWindow === event.source);
      if (source) {
        source.setAttribute(TAP_MARKER_ATTRIBUTE, "");
      }

      window.postMessage(
        { source: INTERNAL_BRIDGE_SOURCE, type: "hello-detected", origin: event.origin, found: !!source },
        window.location.origin,
      );
    });
  },
});
