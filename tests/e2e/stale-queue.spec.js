import { chatLogEntries, expect, getBackgroundWorker, openDmv, openRoll20, test } from "./extension.js";

test("a roll clicked with no Roll20 tab open is dropped, not delivered late", async ({ context }) => {
  const dmv = await openDmv(context);

  const acrobaticsRow = dmv.locator(".skills tr", { has: dmv.locator(".skill-name", { hasText: "Acrobatics" }) });
  await acrobaticsRow.locator(".roll-button").click();

  // The command has nowhere to go yet (no Roll20 tab registered), so
  // background.js's `handleEnqueue` queues it in storage.session. Wait for
  // that queue write to actually land before opening Roll20, so the test
  // doesn't race the (fire-and-forget) runtime.sendMessage call the DMV
  // content script makes.
  const background = await getBackgroundWorker(context);
  await expect
    .poll(() =>
      background.evaluate(() => chrome.storage.session.get("intentQueue").then((r) => (r.intentQueue ?? []).length)),
    )
    .toBeGreaterThan(0);

  const roll20 = await openRoll20(context);

  // Connecting to Roll20 intentionally clears any stale queue (see
  // background.js `handleReady`) instead of flushing it, so the queued
  // command must never arrive -- this is documented, deliberate behavior,
  // not a bug.
  await expect(chatLogEntries(roll20)).toHaveCount(0);
  await expect(roll20.locator("#textchat-input textarea")).toHaveValue("");
});
