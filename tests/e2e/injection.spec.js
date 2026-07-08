import { connectedToast, DMV_URL, expect, test } from "./extension.js";

test("attaches roll listeners to the DMV sheet and shows the connected toast", async ({ context }) => {
  const page = await context.newPage();
  await page.goto(DMV_URL);

  await expect(connectedToast(page)).toBeVisible();

  // dispatch/*.js tag every button it wires up with a `vtt-*` marker class
  // (src/common.js `classes`), which is the observable proof that listeners
  // were actually attached rather than merely present in the DOM.
  await expect(page.locator(".ability-scores .roll-button.vtt-roll-ability-score")).toHaveCount(6);
  await expect(page.locator(".skills .roll-button.vtt-roll-skill")).toHaveCount(2);
  await expect(page.locator(".saving-throws .roll-button.vtt-roll-saving-throw")).toHaveCount(2);

  // dispatch/toggleVisibility.js injects a toggle button into
  // ".character-summary".
  await expect(page.locator(".character-summary .vtt-toggle-visibility")).toHaveCount(1);
});
