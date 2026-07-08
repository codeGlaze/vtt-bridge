import { expect, openDmv, openOwlbear, owlbearTapFrame, test } from "./extension.js";

// The Acrobatics row in tests/e2e/fixtures/dmv.html carries a "+5" modifier
// and the fixture's character name is "Test Hero"; src/taps/dice.js rolls a
// plain "1d20+5" for a check with no advantage/disadvantage.
const acrobaticsRollButton = (dmv) =>
  dmv.locator(".skills tr", { has: dmv.locator(".skill-name", { hasText: "Acrobatics" }) }).locator(".roll-button");

test("a skill roll reaches the Owlbear room extension iframe as a protocol-v1 roll message", async ({ context }) => {
  // Owlbear must be connected first so the background has a live tap tab to
  // deliver to (see src/entrypoints/background.js's `deliver`).
  const owlbear = await openOwlbear(context);
  const dmv = await openDmv(context);

  const tapFrame = await owlbearTapFrame(owlbear);
  // Wait for the fixture iframe's own "hello" handshake (src/taps/protocol.js)
  // to have registered, so the content script doesn't have to queue the roll.
  await expect.poll(() => tapFrame.evaluate(() => Array.isArray(window.receivedRolls))).toBe(true);

  await acrobaticsRollButton(dmv).click();

  await expect.poll(() => tapFrame.evaluate(() => window.receivedRolls.length)).toBe(1);

  const [roll] = await tapFrame.evaluate(() => window.receivedRolls);

  expect(roll.character).toBe("Test Hero");
  expect(roll.summary).toBe("Test Hero rolls Acrobatics check");
  expect(roll.formula).toBe("1d20+5");
  expect(roll.rolls).toHaveLength(1);
  expect(roll.total).toBe(roll.rolls[0] + 5);
  expect(roll.description).toBeNull();
  expect(roll.visible).toBe(true);
});

test("a ctrl-click rolls with advantage (2d20kh1+N)", async ({ context }) => {
  const owlbear = await openOwlbear(context);
  const dmv = await openDmv(context);

  const tapFrame = await owlbearTapFrame(owlbear);
  await expect.poll(() => tapFrame.evaluate(() => Array.isArray(window.receivedRolls))).toBe(true);

  await acrobaticsRollButton(dmv).click({ modifiers: ["Control"] });

  await expect.poll(() => tapFrame.evaluate(() => window.receivedRolls.length)).toBe(1);

  const [roll] = await tapFrame.evaluate(() => window.receivedRolls);

  expect(roll.formula).toBe("2d20kh1+5");
  expect(roll.rolls).toHaveLength(2);
  for (const die of roll.rolls) {
    expect(die).toBeGreaterThanOrEqual(1);
    expect(die).toBeLessThanOrEqual(20);
  }
  expect(roll.total).toBe(Math.max(...roll.rolls) + 5);
});

test("a roll clicked before the room extension says hello is queued and flushed on handshake", async ({ context }) => {
  const owlbear = await openOwlbear(context);
  const dmv = await openDmv(context);

  // Wait for the content script itself to have registered with the
  // background (the "Connected" toast), but grab the roll frame reference
  // without waiting for its handshake -- click immediately, racing the
  // fixture iframe's own hello.
  const tapFrame = await owlbearTapFrame(owlbear);

  await acrobaticsRollButton(dmv).click();

  // Whether or not this particular click won the race against the iframe's
  // hello, the content script's in-memory queue (src/entrypoints/owlbear.content.js)
  // guarantees it is delivered once the handshake lands.
  await expect.poll(() => tapFrame.evaluate(() => window.receivedRolls?.length ?? 0)).toBe(1);
});
