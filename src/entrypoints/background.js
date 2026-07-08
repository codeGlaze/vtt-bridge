import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { messageType } from "@/common";

const QUEUE_KEY = "intentQueue";
// Every tab running a per-VTT "tap" content script that has said `ready`
// (Roll20, Owlbear, ...) -- not just Roll20, despite the old key name.
const TAP_TABS_KEY = "tapTabs";

/** @typedef {import("@/transform/state").RollIntent} RollIntent */

/** @returns {Promise<RollIntent[]>} */
const getQueue = async () =>
  /** @type {RollIntent[] | undefined} */ ((await browser.storage.session.get(QUEUE_KEY))[QUEUE_KEY]) ?? [];
/** @param {RollIntent[]} queue */
const setQueue = (queue) => browser.storage.session.set({ [QUEUE_KEY]: queue });

/** @returns {Promise<number[]>} */
const getTapTabs = async () =>
  /** @type {number[] | undefined} */ ((await browser.storage.session.get(TAP_TABS_KEY))[TAP_TABS_KEY]) ?? [];
/** @param {number[]} tabs */
const setTapTabs = (tabs) => browser.storage.session.set({ [TAP_TABS_KEY]: tabs });

/** @param {number} [tabId] */
const addTapTab = async (tabId) => {
  if (tabId == null) {
    return;
  }
  const tabs = await getTapTabs();
  if (!tabs.includes(tabId)) {
    await setTapTabs([...tabs, tabId]);
  }
};

/** @param {number} [tabId] */
const removeTapTab = async (tabId) => {
  const tabs = await getTapTabs();
  await setTapTabs(tabs.filter((id) => id !== tabId));
};

/**
 * Try to deliver intents to every registered tap tab (any tab running a
 * per-VTT content script that has said `ready` -- Roll20, Owlbear, ...).
 *
 * Tabs that fail to receive the message (e.g. because they were closed) are
 * dropped from the registry. Returns whether at least one tab received the
 * intents.
 *
 * @param {RollIntent[]} intents
 * @returns {Promise<boolean>}
 */
const deliver = async (intents) => {
  const tabs = await getTapTabs();
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
    await setTapTabs(tabs.filter((id) => !stale.includes(id)));
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
  await addTapTab(tabId);
  // Preserve the old behavior: connecting a tap clears any stale queue.
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
    removeTapTab(tabId);
  });
});
