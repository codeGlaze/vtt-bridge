import { chatLogEntries, expect, openDmv, openRoll20, test } from "./extension.js";

test("toggling visibility sends hidden commands as /gmroll", async ({ context }) => {
  const roll20 = await openRoll20(context);
  const dmv = await openDmv(context);

  // dispatch/toggleVisibility.js's injected button; the first click flips
  // the store's default `visible: true` to false.
  await dmv.locator(".vtt-toggle-visibility").click();

  const acrobaticsRow = dmv.locator(".skills tr", { has: dmv.locator(".skill-name", { hasText: "Acrobatics" }) });
  await acrobaticsRow.locator(".roll-button").click();

  await expect(chatLogEntries(roll20)).toHaveCount(1);
  await expect(chatLogEntries(roll20).last()).toContainText("/gmroll 1d20+5");
});
