import { chatLogEntries, expect, openDmv, openRoll20, test } from "./extension.js";

// The Acrobatics row in tests/e2e/fixtures/dmv.html carries a "+5" modifier;
// src/transform/commands.js `makeD20Roll` turns that into "1d20+5" (plain)
// or "2d20kh1+5" (advantage), per src/transform/commands.test.js.
const acrobaticsRollButton = (dmv) =>
  dmv.locator(".skills tr", { has: dmv.locator(".skill-name", { hasText: "Acrobatics" }) }).locator(".roll-button");

test("a skill roll reaches the Roll20 chat log as /roll 1d20+<mod>", async ({ context }) => {
  // Roll20 must be connected first so the background has a live tab to
  // deliver to.
  const roll20 = await openRoll20(context);
  const dmv = await openDmv(context);

  await acrobaticsRollButton(dmv).click();

  await expect(chatLogEntries(roll20)).toHaveCount(1);
  await expect(chatLogEntries(roll20).last()).toContainText("/roll 1d20+5");
});

test("a ctrl-click rolls with advantage (2d20kh1)", async ({ context }) => {
  const roll20 = await openRoll20(context);
  const dmv = await openDmv(context);

  await acrobaticsRollButton(dmv).click({ modifiers: ["Control"] });

  await expect(chatLogEntries(roll20)).toHaveCount(1);
  await expect(chatLogEntries(roll20).last()).toContainText("/roll 2d20kh1+5");
});
