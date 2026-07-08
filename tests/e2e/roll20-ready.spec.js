import { connectedToast, expect, ROLL20_URL, test } from "./extension.js";

test("shows the connected toast once the Roll20 chat input is ready", async ({ context }) => {
  const page = await context.newPage();
  await page.goto(ROLL20_URL);

  await expect(connectedToast(page)).toBeVisible();
});
