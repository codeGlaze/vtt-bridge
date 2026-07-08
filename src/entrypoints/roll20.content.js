import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

import { messageType, onElementLoad } from "@/common";
import { showConnected } from "@/notify";

/**
 * Roll20's Jumpgate engine recreates the chat DOM, so cached element
 * references go stale. Re-query on every send instead of caching.
 */
const runCommands = (commands) => {
  const input = document.querySelector("#textchat-input");
  if (!input) {
    console.warn("Roll20 chat input not found, dropping commands");
    return;
  }

  const textarea = input.querySelector("textarea");
  if (!textarea) {
    console.warn("Roll20 chat textarea not found, dropping commands");
    return;
  }

  const button = input.querySelector("button") ?? input.querySelector(".btn");
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
        runCommands(message.commands);
      }
    });

    onElementLoad("#textchat-input", () => {
      showConnected();
      browser.runtime.sendMessage({ type: messageType.ready });
    });
  },
});
