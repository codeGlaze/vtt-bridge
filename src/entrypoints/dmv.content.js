import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

import { addDispatchers } from "@/dispatch";
import { createStore } from "@/store";
import { formatError } from "@/transform/error";
import { messageType } from "@/common";
import { parseState } from "@/transform/state";
import { showConnected, showError, showToast, showVisibility } from "@/notify";

export default defineContentScript({
  matches: [
    "*://www.dungeonmastersvault.com/pages/dnd/5e/characters/*?frame=true",
    // DMV's beta/testing site, for validating upcoming DMV releases.
    "*://dev.dungeonmastersvault.com/pages/dnd/5e/characters/*?frame=true",
  ],
  cssInjectionMode: "manifest",
  main() {
    const store = createStore();
    addDispatchers(store, () => showConnected());

    /** @type {import("@/transform/error").ValidationError | null} */
    let lastError = null;
    let lastVisibility = true;
    store.subscribe((state) => {
      if (state.click !== null) {
        // `state.click !== null` guarantees this is a fully-populated DmvState,
        // matching what parseState expects.
        const { toast, intent } = parseState(/** @type {import("@/transform/state").DmvState} */ (state));
        showToast(toast);
        console.debug(`Showed command toast: ${toast}`);
        const intents = [intent];
        browser.runtime.sendMessage({ type: messageType.enqueue, intents });
        console.debug(`Sent intents to background: ${JSON.stringify(intents)}`);
      } else if (state.error !== lastError) {
        // Only ever set to a ValidationError (see src/store.js's `setError`
        // mutation) once non-null, so this branch always sees a real error.
        showError(formatError(/** @type {import("@/transform/error").ValidationError} */ (state.error)));
        lastError = state.error;
        console.debug(`Showed error toast: ${JSON.stringify(state.error)}`);
      } else if (state.visible !== lastVisibility) {
        showVisibility(state.visible);
        lastVisibility = state.visible;
        console.debug(`Showed visibility toast: ${JSON.stringify(state.visible)}`);
      }
    });
  },
});
