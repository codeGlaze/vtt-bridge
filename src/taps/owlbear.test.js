import { intentKinds } from "../transform/state";
import { renderIntents } from "./roll20";
import { renderRollRecords } from "./owlbear";

/** Builds a deterministic rng that returns a fixed sequence of values, one per call. */
const sequenceRng = (values) => {
  let i = 0;
  return () => {
    if (i >= values.length) {
      throw new Error("rng exhausted");
    }
    return values[i++];
  };
};

/**
 * The rng value that makes a `Math.floor(rng() * sides) + 1` die roll
 * return exactly `n` (1-indexed); landing in the middle of bucket `n` keeps
 * this robust to floating-point rounding.
 */
const valueFor = (sides, n) => (n - 0.5) / sides;

/**
 * Strips Roll20 chat syntax (the "/em :"/"/w gm " prefix, the "with
 * advantage"/"with disadvantage" suffix) off the emote command the Roll20
 * tap produces for an intent, leaving the same base text a RollRecord's
 * `summary` should carry.
 *
 * @param {import("../transform/state").RollIntent} intent
 * @returns {string}
 */
const roll20BaseEmoteText = (intent) => {
  const [emoteCommand] = renderIntents([intent]);
  return emoteCommand
    .replace(/^\/em : /, "")
    .replace(/^\/w gm /, "")
    .replace(/ with (advantage|disadvantage)$/, "");
};

describe("renderRollRecords: summary phrasing parity with the Roll20 tap", () => {
  /** @type {import("../transform/state").RollIntent[]} */
  const intents = [
    {
      kind: intentKinds.attack,
      character: "Fighter",
      name: "Longsword",
      attack: "1d20+5",
      advantage: false,
      disadvantage: false,
      visible: true,
    },
    {
      kind: intentKinds.attack,
      character: "Wizard",
      name: "Fire Bolt",
      attack: "1d20+5",
      advantage: true,
      disadvantage: false,
      visible: false,
    },
    {
      kind: intentKinds.castSpell,
      character: "Wizard",
      name: "Magic Missile",
      description: "3 darts",
      advantage: false,
      disadvantage: false,
      visible: true,
    },
    {
      kind: intentKinds.check,
      character: "Player",
      name: "STR",
      mod: "+1",
      advantage: true,
      disadvantage: false,
      visible: true,
    },
    {
      kind: intentKinds.initiative,
      character: "Wizard",
      name: "initiative",
      mod: "0",
      advantage: false,
      disadvantage: true,
      visible: true,
    },
    {
      kind: intentKinds.proficiency,
      character: "Player",
      name: "Thieves' Tools",
      mod: "+3",
      advantage: false,
      disadvantage: false,
      visible: true,
    },
    {
      kind: intentKinds.savingThrow,
      character: "Fighter",
      name: "CON",
      mod: "+2",
      advantage: true,
      disadvantage: false,
      visible: false,
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
    {
      kind: intentKinds.useFeature,
      character: "Rogue",
      name: "Sneak Attack",
      description: "+3d6 damage",
      advantage: false,
      disadvantage: false,
      visible: true,
    },
  ];

  test.each(intents.map((intent) => [`${intent.kind}: ${intent.character} / ${intent.name}`, intent]))(
    "%s",
    (_label, intent) => {
      const [record] = renderRollRecords([intent], sequenceRng([valueFor(20, 10), valueFor(20, 10)]));
      expect(record.summary).toBe(roll20BaseEmoteText(intent));
    },
  );
});

describe("renderRollRecords: per-kind coverage", () => {
  test("attack, visible, no advantage/disadvantage", () => {
    const rng = sequenceRng([valueFor(20, 14)]);
    const [record] = renderRollRecords(
      [
        {
          kind: intentKinds.attack,
          character: "Fighter",
          name: "Longsword",
          attack: "1d20+5",
          advantage: false,
          disadvantage: false,
          visible: true,
        },
      ],
      rng,
    );
    expect(record).toStrictEqual({
      character: "Fighter",
      summary: "Fighter attacks with Longsword",
      formula: "1d20+5",
      rolls: [14],
      total: 19,
      description: null,
      visible: true,
    });
  });

  test("attack, with advantage, hidden -- rolls 2d20kh1, not the attack expression twice", () => {
    const rng = sequenceRng([valueFor(20, 5), valueFor(20, 17)]);
    const [record] = renderRollRecords(
      [
        {
          kind: intentKinds.attack,
          character: "Wizard",
          name: "Fire Bolt",
          attack: "1d20+5",
          advantage: true,
          disadvantage: false,
          visible: false,
        },
      ],
      rng,
    );
    expect(record).toStrictEqual({
      character: "Wizard",
      summary: "Wizard attacks with Fire Bolt",
      formula: "2d20kh1+5",
      rolls: [5, 17],
      total: 22,
      description: null,
      visible: false,
    });
  });

  test("castSpell is description-only (no dice)", () => {
    const [record] = renderRollRecords([
      {
        kind: intentKinds.castSpell,
        character: "Wizard",
        name: "Magic Missile",
        description: "3 darts",
        advantage: false,
        disadvantage: false,
        visible: true,
      },
    ]);
    expect(record).toStrictEqual({
      character: "Wizard",
      summary: "Wizard casts Magic Missile",
      formula: null,
      rolls: [],
      total: null,
      description: "3 darts",
      visible: true,
    });
  });

  test("check, visible, no advantage/disadvantage", () => {
    const rng = sequenceRng([valueFor(20, 8)]);
    const [record] = renderRollRecords(
      [
        {
          kind: intentKinds.check,
          character: "Player",
          name: "STR",
          mod: "+1",
          advantage: false,
          disadvantage: false,
          visible: true,
        },
      ],
      rng,
    );
    expect(record).toStrictEqual({
      character: "Player",
      summary: "Player rolls STR check",
      formula: "1d20+1",
      rolls: [8],
      total: 9,
      description: null,
      visible: true,
    });
  });

  test("check, with advantage", () => {
    const rng = sequenceRng([valueFor(20, 3), valueFor(20, 19)]);
    const [record] = renderRollRecords(
      [
        {
          kind: intentKinds.check,
          character: "Player",
          name: "STR",
          mod: "+1",
          advantage: true,
          disadvantage: false,
          visible: true,
        },
      ],
      rng,
    );
    expect(record.formula).toBe("2d20kh1+1");
    expect(record.rolls).toStrictEqual([3, 19]);
    expect(record.total).toBe(20);
  });

  test("savingThrow, with disadvantage, hidden", () => {
    const rng = sequenceRng([valueFor(20, 12), valueFor(20, 4)]);
    const [record] = renderRollRecords(
      [
        {
          kind: intentKinds.savingThrow,
          character: "Fighter",
          name: "CON",
          mod: "+2",
          advantage: false,
          disadvantage: true,
          visible: false,
        },
      ],
      rng,
    );
    expect(record).toStrictEqual({
      character: "Fighter",
      summary: "Fighter rolls CON save",
      formula: "2d20kl1+2",
      rolls: [12, 4],
      total: 6,
      description: null,
      visible: false,
    });
  });

  test("initiative", () => {
    const rng = sequenceRng([valueFor(20, 1)]);
    const [record] = renderRollRecords(
      [
        {
          kind: intentKinds.initiative,
          character: "Wizard",
          name: "initiative",
          mod: "0",
          advantage: false,
          disadvantage: false,
          visible: true,
        },
      ],
      rng,
    );
    expect(record).toStrictEqual({
      character: "Wizard",
      summary: "Wizard rolls initiative",
      formula: "1d20",
      rolls: [1],
      total: 1,
      description: null,
      visible: true,
    });
  });

  test("proficiency", () => {
    const rng = sequenceRng([valueFor(20, 15)]);
    const [record] = renderRollRecords(
      [
        {
          kind: intentKinds.proficiency,
          character: "Player",
          name: "Thieves' Tools",
          mod: "+3",
          advantage: false,
          disadvantage: false,
          visible: true,
        },
      ],
      rng,
    );
    expect(record).toStrictEqual({
      character: "Player",
      summary: "Player rolls Thieves' Tools",
      formula: "1d20+3",
      rolls: [15],
      total: 18,
      description: null,
      visible: true,
    });
  });

  test("damage", () => {
    const rng = sequenceRng([valueFor(8, 6)]);
    const [record] = renderRollRecords(
      [
        {
          kind: intentKinds.damage,
          character: "Fighter",
          name: "Club",
          damage: "1d8",
          advantage: false,
          disadvantage: false,
          visible: false,
        },
      ],
      rng,
    );
    expect(record).toStrictEqual({
      character: "Fighter",
      summary: "Fighter rolls Club damage",
      formula: "1d8",
      rolls: [6],
      total: 6,
      description: null,
      visible: false,
    });
  });

  test("useFeature is description-only (no dice)", () => {
    const [record] = renderRollRecords([
      {
        kind: intentKinds.useFeature,
        character: "Rogue",
        name: "Sneak Attack",
        description: "+3d6 damage",
        advantage: false,
        disadvantage: false,
        visible: true,
      },
    ]);
    expect(record).toStrictEqual({
      character: "Rogue",
      summary: "Rogue uses Sneak Attack",
      formula: null,
      rolls: [],
      total: null,
      description: "+3d6 damage",
      visible: true,
    });
  });

  test("multiple intents render in order", () => {
    const rng = sequenceRng([valueFor(20, 8), valueFor(6, 3)]);
    const records = renderRollRecords(
      [
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
          damage: "1d6",
          advantage: false,
          disadvantage: false,
          visible: false,
        },
      ],
      rng,
    );
    expect(records.map((record) => record.summary)).toStrictEqual([
      "Player rolls STR check",
      "Fighter rolls Club damage",
    ]);
    expect(records[0].total).toBe(9);
    expect(records[1].total).toBe(3);
  });

  test("defaults to Math.random when no rng is given", () => {
    const [record] = renderRollRecords([
      {
        kind: intentKinds.check,
        character: "Player",
        name: "STR",
        mod: "+1",
        advantage: false,
        disadvantage: false,
        visible: true,
      },
    ]);
    expect(record.rolls).toHaveLength(1);
    expect(record.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(record.rolls[0]).toBeLessThanOrEqual(20);
  });

  test("unknown intent kind throws", () => {
    expect(() =>
      renderRollRecords([{ kind: "bogus", character: "X", advantage: false, disadvantage: false, visible: true }]),
    ).toThrow();
  });
});
