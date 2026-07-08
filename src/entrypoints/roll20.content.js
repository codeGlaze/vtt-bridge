import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

import { messageType, onElementLoad } from "@/common";
import { renderIntents } from "@/transform/renderRoll20";
import { ROLL20 } from "@/selectors";
import { showConnected } from "@/notify";

/**
 * Roll20's Jumpgate engine recreates the chat DOM, so cached element
 * references go stale. Re-query on every send instead of caching.
 *
 * @param {string[]} commands
 */
const runCommands = (commands) => {
  const input = document.querySelector(ROLL20.chatInput);
  if (!input) {
    console.warn("Roll20 chat input not found, dropping commands");
    return;
  }

  const textarea = /** @type {HTMLTextAreaElement | null} */ (input.querySelector(ROLL20.chatTextarea));
  if (!textarea) {
    console.warn("Roll20 chat textarea not found, dropping commands");
    return;
  }

  const button = /** @type {HTMLButtonElement | null} */ (
    input.querySelector(ROLL20.chatSendButton) ?? input.querySelector(ROLL20.chatSendButtonFallback)
  );
  if (!button) {
    console.warn("Roll20 chat send button not found, dropping commands");
    return;
  }

  // Preserve whatever the user was in the middle of typing.
  const draft = textarea.value;
  textarea.value = commands.join("\n");
  button.click();
  textarea.value = draft;

  console.debug(`Ran commands: ${JSON.stringify(commands)}`);
};

export default defineContentScript({
  matches: ["*://app.roll20.net/editor*"],
  cssInjectionMode: "manifest",
  main() {
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === messageType.run) {
        runCommands(renderIntents(message.intents));
      }
    });

    onElementLoad(ROLL20.chatInput, () => {
      showConnected();
      browser.runtime.sendMessage({ type: messageType.ready });
    });
  },
});
