import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { messageType } from "@/common";

const QUEUE_KEY = "intentQueue";
const TABS_KEY = "roll20Tabs";

/** @typedef {import("@/transform/state").RollIntent} RollIntent */

/** @returns {Promise<RollIntent[]>} */
const getQueue = async () =>
  /** @type {RollIntent[] | undefined} */ ((await browser.storage.session.get(QUEUE_KEY))[QUEUE_KEY]) ?? [];
/** @param {RollIntent[]} queue */
const setQueue = (queue) => browser.storage.session.set({ [QUEUE_KEY]: queue });

/** @returns {Promise<number[]>} */
const getTabs = async () =>
  /** @type {number[] | undefined} */ ((await browser.storage.session.get(TABS_KEY))[TABS_KEY]) ?? [];
/** @param {number[]} tabs */
const setTabs = (tabs) => browser.storage.session.set({ [TABS_KEY]: tabs });

/** @param {number} [tabId] */
const addTab = async (tabId) => {
  if (tabId == null) {
    return;
  }
  const tabs = await getTabs();
  if (!tabs.includes(tabId)) {
    await setTabs([...tabs, tabId]);
  }
};

/** @param {number} [tabId] */
const removeTab = async (tabId) => {
  const tabs = await getTabs();
  await setTabs(tabs.filter((id) => id !== tabId));
};

/**
 * Try to deliver intents to every registered Roll20 tab.
 *
 * Tabs that fail to receive the message (e.g. because they were closed) are
 * dropped from the registry. Returns whether at least one tab received the
 * intents.
 *
 * @param {RollIntent[]} intents
 * @returns {Promise<boolean>}
 */
const deliver = async (intents) => {
  const tabs = await getTabs();
  /** @type {number[]} */
  const stale = [];
  let delivered = false;

  await Promise.all(
    tabs.map(async (tabId) => {
      try {
        await browser.tabs.sendMessage(tabId, { type: messageType.run, intents });
        delivered = true;
      } catch {
        stale.push(tabId);
      }
    }),
  );

  if (stale.length > 0) {
    await setTabs(tabs.filter((id) => !stale.includes(id)));
  }

  return delivered;
};

/** @param {RollIntent[]} intents */
const handleEnqueue = async (intents) => {
  const delivered = await deliver(intents);
  if (!delivered) {
    const queue = await getQueue();
    await setQueue([...queue, ...intents]);
  }
};

/** @param {number} [tabId] */
const handleReady = async (tabId) => {
  await addTab(tabId);
  // Preserve the old behavior: connecting to Roll20 clears any stale queue.
  await setQueue([]);
};

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case messageType.enqueue:
        handleEnqueue(message.intents).then(() => sendResponse({ ok: true }));
        return true;

      case messageType.ready:
        handleReady(sender.tab?.id).then(() => sendResponse({ ok: true }));
        return true;

      case messageType.clear:
        setQueue([]).then(() => sendResponse({ ok: true }));
        return true;

      default:
        console.warn(`Unknown message type: ${message.type}`);
        return false;
    }
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    removeTab(tabId);
  });
});
