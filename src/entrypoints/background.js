import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { messageType } from "@/common";

const QUEUE_KEY = "intentQueue";
const TABS_KEY = "roll20Tabs";

const getQueue = async () => (await browser.storage.session.get(QUEUE_KEY))[QUEUE_KEY] ?? [];
const setQueue = (queue) => browser.storage.session.set({ [QUEUE_KEY]: queue });

const getTabs = async () => (await browser.storage.session.get(TABS_KEY))[TABS_KEY] ?? [];
const setTabs = (tabs) => browser.storage.session.set({ [TABS_KEY]: tabs });

const addTab = async (tabId) => {
  if (tabId == null) {
    return;
  }
  const tabs = await getTabs();
  if (!tabs.includes(tabId)) {
    await setTabs([...tabs, tabId]);
  }
};

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
 */
const deliver = async (intents) => {
  const tabs = await getTabs();
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

const handleEnqueue = async (intents) => {
  const delivered = await deliver(intents);
  if (!delivered) {
    const queue = await getQueue();
    await setQueue([...queue, ...intents]);
  }
};

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
