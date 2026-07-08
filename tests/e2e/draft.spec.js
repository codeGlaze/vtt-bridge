import { chatLogEntries, expect, openDmv, openRoll20, test } from "./extension.js";

test("preserves an in-progress Roll20 chat draft across a posted command", async ({ context }) => {
  const roll20 = await openRoll20(context);
  const dmv = await openDmv(context);

  const textarea = roll20.locator("#textchat-input textarea");
  const draft = "a draft the user was in the middle of typing";
  await textarea.fill(draft);

  const acrobaticsRow = dmv.locator(".skills tr", { has: dmv.locator(".skill-name", { hasText: "Acrobatics" }) });
  await acrobaticsRow.locator(".roll-button").click();

  await expect(chatLogEntries(roll20)).toHaveCount(1);
  // roll20.content.js's `runCommands` saves the textarea's value, overwrites
  // it with the commands, clicks send, then restores the saved draft.
  await expect(textarea).toHaveValue(draft);
});
