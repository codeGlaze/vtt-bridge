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

    let lastError = null;
    let lastVisibility = true;
    store.subscribe((state) => {
      if (state.click !== null) {
        const { toast, commands } = parseState(state);
        showToast(toast);
        console.debug(`Showed command toast: ${toast}`);
        browser.runtime.sendMessage({ type: messageType.enqueue, commands });
        console.debug(`Sent commands to background: ${JSON.stringify(commands)}`);
      } else if (state.error !== lastError) {
        showError(formatError(state.error));
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
