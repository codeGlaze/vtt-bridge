import { classes } from "../common";
import { intentKinds, parseState } from "./state";

describe("parse state", () => {
  test("Player rolls STR check with advantage", () => {
    const state = {
      click: { className: classes.rollAbilityScore, event: { ctrlKey: true }, data: { name: "STR", mod: "+1" } },
      visible: true,
      character: "Player",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Player rolled STR check with advantage!");
    expect(intent).toStrictEqual({
      kind: intentKinds.check,
      character: "Player",
      name: "STR",
      mod: "+1",
      advantage: true,
      disadvantage: false,
      visible: true,
    });
  });

  test("Wizard rolls initiative with disadvantage", () => {
    const state = {
      click: { className: classes.rollInitiative, event: { shiftKey: true }, data: { mod: "0", name: "initiative" } },
      visible: true,
      character: "Wizard",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Wizard rolled initiative with disadvantage!");
    expect(intent).toStrictEqual({
      kind: intentKinds.initiative,
      character: "Wizard",
      name: "initiative",
      mod: "0",
      advantage: false,
      disadvantage: true,
      visible: true,
    });
  });

  test("Fighter rolls Club damage (hidden)", () => {
    const state = {
      click: { className: classes.rollWeaponDamage, event: {}, data: { name: "Club", damage: "1d8" } },
      visible: false,
      character: "Fighter",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Fighter rolled Club damage! (hidden)");
    expect(intent).toStrictEqual({
      kind: intentKinds.damage,
      character: "Fighter",
      name: "Club",
      damage: "1d8",
      advantage: false,
      disadvantage: false,
      visible: false,
    });
  });

  test("Fighter attacks with Longsword", () => {
    const state = {
      click: { className: classes.attackWithWeapon, event: {}, data: { name: "Longsword", attack: "1d20+5" } },
      visible: true,
      character: "Fighter",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Fighter attacked with Longsword!");
    expect(intent).toStrictEqual({
      kind: intentKinds.attack,
      character: "Fighter",
      name: "Longsword",
      attack: "1d20+5",
      advantage: false,
      disadvantage: false,
      visible: true,
    });
  });

  test("Wizard attacks with Fire Bolt", () => {
    const state = {
      click: { className: classes.attackWithSpell, event: {}, data: { name: "Fire Bolt", attack: "1d20+5" } },
      visible: true,
      character: "Wizard",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Wizard attacked with Fire Bolt!");
    expect(intent).toStrictEqual({
      kind: intentKinds.attack,
      character: "Wizard",
      name: "Fire Bolt",
      attack: "1d20+5",
      advantage: false,
      disadvantage: false,
      visible: true,
    });
  });

  test("Wizard casts Magic Missile", () => {
    const state = {
      click: { className: classes.castSpell, event: {}, data: { name: "Magic Missile", description: "3 darts" } },
      visible: true,
      character: "Wizard",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Wizard cast Magic Missile!");
    expect(intent).toStrictEqual({
      kind: intentKinds.castSpell,
      character: "Wizard",
      name: "Magic Missile",
      description: "3 darts",
      advantage: false,
      disadvantage: false,
      visible: true,
    });
  });

  test("Player rolls a proficiency check", () => {
    const state = {
      click: { className: classes.rollProficiency, event: {}, data: { name: "Thieves' Tools", mod: "+3" } },
      visible: true,
      character: "Player",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Player rolled Thieves' Tools!");
    expect(intent).toStrictEqual({
      kind: intentKinds.proficiency,
      character: "Player",
      name: "Thieves' Tools",
      mod: "+3",
      advantage: false,
      disadvantage: false,
      visible: true,
    });
  });

  test("Fighter rolls a CON save with advantage (hidden)", () => {
    const state = {
      click: { className: classes.rollSavingThrow, event: { ctrlKey: true }, data: { name: "CON", mod: "+2" } },
      visible: false,
      character: "Fighter",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Fighter rolled CON save with advantage! (hidden)");
    expect(intent).toStrictEqual({
      kind: intentKinds.savingThrow,
      character: "Fighter",
      name: "CON",
      mod: "+2",
      advantage: true,
      disadvantage: false,
      visible: false,
    });
  });

  test("Rogue uses Sneak Attack", () => {
    const state = {
      click: { className: classes.useFeature, event: {}, data: { name: "Sneak Attack", description: "+3d6 damage" } },
      visible: true,
      character: "Rogue",
    };
    const { toast, intent } = parseState(state);
    expect(toast).toBe("Rogue used Sneak Attack!");
    expect(intent).toStrictEqual({
      kind: intentKinds.useFeature,
      character: "Rogue",
      name: "Sneak Attack",
      description: "+3d6 damage",
      advantage: false,
      disadvantage: false,
      visible: true,
    });
  });
});
