import { classes } from "../common";
import { intentKinds, parseState } from "../transform/state";
import { renderIntents } from "./roll20";

// These three cases mirror the exact click fixtures that used to live in
// state.test.js, back when `parseState` produced Roll20 command strings
// directly. Composing `parseState` (DMV side) with `renderIntents` (Roll20
// sink) here proves the end-to-end output is unchanged by the refactor.
describe("render roll20 intents (parity with the old command strings)", () => {
  test("Player rolls STR check with advantage", () => {
    const state = {
      click: { className: classes.rollAbilityScore, event: { ctrlKey: true }, data: { name: "STR", mod: "+1" } },
      visible: true,
      character: "Player",
    };
    const { intent } = parseState(state);
    expect(renderIntents([intent])).toStrictEqual(["/em : Player rolls STR check with advantage", "/roll 2d20kh1+1"]);
  });

  test("Wizard rolls initiative with disadvantage", () => {
    const state = {
      click: { className: classes.rollInitiative, event: { shiftKey: true }, data: { mod: "0", name: "initiative" } },
      visible: true,
      character: "Wizard",
    };
    const { intent } = parseState(state);
    expect(renderIntents([intent])).toStrictEqual([
      "/em : Wizard rolls initiative with disadvantage",
      "/roll 2d20kl1 &{tracker}",
    ]);
  });

  test("Fighter rolls Club damage (hidden)", () => {
    const state = {
      click: { className: classes.rollWeaponDamage, event: {}, data: { name: "Club", damage: "1d8" } },
      visible: false,
      character: "Fighter",
    };
    const { intent } = parseState(state);
    expect(renderIntents([intent])).toStrictEqual(["/w gm Fighter rolls Club damage", "/gmroll 1d8"]);
  });
});

describe("render roll20 intents (per kind coverage)", () => {
  test("attack, visible", () => {
    const intent = {
      kind: intentKinds.attack,
      character: "Fighter",
      name: "Longsword",
      attack: "1d20+5",
      advantage: false,
      disadvantage: false,
      visible: true,
    };
    expect(renderIntents([intent])).toStrictEqual(["/em : Fighter attacks with Longsword", "/roll 1d20+5"]);
  });

  test("attack, with advantage, hidden", () => {
    const intent = {
      kind: intentKinds.attack,
      character: "Wizard",
      name: "Fire Bolt",
      attack: "1d20+5",
      advantage: true,
      disadvantage: false,
      visible: false,
    };
    expect(renderIntents([intent])).toStrictEqual([
      "/w gm Wizard attacks with Fire Bolt with advantage",
      "/gmroll 1d20+5\n/gmroll 1d20+5",
    ]);
  });

  test("castSpell, visible", () => {
    const intent = {
      kind: intentKinds.castSpell,
      character: "Wizard",
      name: "Magic Missile",
      description: "3 darts",
      advantage: false,
      disadvantage: false,
      visible: true,
    };
    expect(renderIntents([intent])).toStrictEqual(["/em : Wizard casts Magic Missile", "3 darts"]);
  });

  test("castSpell, hidden", () => {
    const intent = {
      kind: intentKinds.castSpell,
      character: "Wizard",
      name: "Magic Missile",
      description: "3 darts",
      advantage: false,
      disadvantage: false,
      visible: false,
    };
    expect(renderIntents([intent])).toStrictEqual(["/w gm Wizard casts Magic Missile", "/w gm 3 darts"]);
  });

  test("proficiency, visible", () => {
    const intent = {
      kind: intentKinds.proficiency,
      character: "Player",
      name: "Thieves' Tools",
      mod: "+3",
      advantage: false,
      disadvantage: false,
      visible: true,
    };
    expect(renderIntents([intent])).toStrictEqual(["/em : Player rolls Thieves' Tools", "/roll 1d20+3"]);
  });

  test("savingThrow, with advantage, hidden", () => {
    const intent = {
      kind: intentKinds.savingThrow,
      character: "Fighter",
      name: "CON",
      mod: "+2",
      advantage: true,
      disadvantage: false,
      visible: false,
    };
    expect(renderIntents([intent])).toStrictEqual(["/w gm Fighter rolls CON save with advantage", "/gmroll 2d20kh1+2"]);
  });

  test("useFeature, visible", () => {
    const intent = {
      kind: intentKinds.useFeature,
      character: "Rogue",
      name: "Sneak Attack",
      description: "+3d6 damage",
      advantage: false,
      disadvantage: false,
      visible: true,
    };
    expect(renderIntents([intent])).toStrictEqual(["/em : Rogue uses Sneak Attack", "+3d6 damage"]);
  });

  test("multiple intents flatten in order", () => {
    const intents = [
      {
        kind: intentKinds.check,
        character: "Player",
        name: "STR",
        mod: "+1",
        advantage: false,
        disadvantage: false,
        visible: true,
      },
      {
        kind: intentKinds.damage,
        character: "Fighter",
        name: "Club",
        damage: "1d8",
        advantage: false,
        disadvantage: false,
        visible: false,
      },
    ];
    expect(renderIntents(intents)).toStrictEqual([
      "/em : Player rolls STR check",
      "/roll 1d20+1",
      "/w gm Fighter rolls Club damage",
      "/gmroll 1d8",
    ]);
  });
});
