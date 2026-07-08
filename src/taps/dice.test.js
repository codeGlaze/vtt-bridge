import { parseDiceExpression, rollD20, rollDamage, toSignedModifier } from "./dice";

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
 * The rng value that makes `rollDie(sides, rng)` (== `Math.floor(rng() *
 * sides) + 1`) return exactly `n` (1-indexed): landing in the middle of
 * bucket `n` keeps this robust to floating-point rounding.
 */
const valueFor = (sides, n) => (n - 0.5) / sides;

describe("parseDiceExpression", () => {
  test("plain", () => expect(parseDiceExpression("1d8")).toStrictEqual({ count: 1, sides: 8, modifier: 0 }));
  test("with positive modifier", () =>
    expect(parseDiceExpression("2d6+3")).toStrictEqual({ count: 2, sides: 6, modifier: 3 }));
  test("with negative modifier", () =>
    expect(parseDiceExpression("1d20-1")).toStrictEqual({ count: 1, sides: 20, modifier: -1 }));

  test("rejects malformed expressions", () => {
    expect(() => parseDiceExpression("d20")).toThrow();
    expect(() => parseDiceExpression("1d20+")).toThrow();
    expect(() => parseDiceExpression("")).toThrow();
  });

  // DMV's grammar (src/transform/validate.js's isValidAttack/isValidDamage)
  // only ever matches a single "NdM" group -- there is no multi-part damage
  // like "1d8+2d6" to support.
  test("rejects multi-part damage, matching DMV's grammar", () => {
    expect(() => parseDiceExpression("1d8+2d6")).toThrow();
  });
});

describe("toSignedModifier", () => {
  test("zero", () => expect(toSignedModifier(0)).toBe("0"));
  test("positive", () => expect(toSignedModifier(5)).toBe("+5"));
  test("negative", () => expect(toSignedModifier(-3)).toBe("-3"));
});

describe("rollD20", () => {
  test("plain, positive mod", () => {
    const rng = sequenceRng([valueFor(20, 14)]);
    expect(rollD20("+5", {}, rng)).toStrictEqual({ formula: "1d20+5", rolls: [14], modifier: 5, total: 19 });
  });

  test("plain, negative mod", () => {
    const rng = sequenceRng([valueFor(20, 10)]);
    expect(rollD20("-2", {}, rng)).toStrictEqual({ formula: "1d20-2", rolls: [10], modifier: -2, total: 8 });
  });

  test("plain, zero mod", () => {
    const rng = sequenceRng([valueFor(20, 1)]);
    expect(rollD20("0", {}, rng)).toStrictEqual({ formula: "1d20", rolls: [1], modifier: 0, total: 1 });
  });

  test("advantage keeps the higher die", () => {
    const rng = sequenceRng([valueFor(20, 5), valueFor(20, 17)]);
    expect(rollD20("+3", { advantage: true }, rng)).toStrictEqual({
      formula: "2d20kh1+3",
      rolls: [5, 17],
      kept: [17],
      modifier: 3,
      total: 20,
    });
  });

  test("disadvantage keeps the lower die", () => {
    const rng = sequenceRng([valueFor(20, 5), valueFor(20, 17)]);
    expect(rollD20("+3", { disadvantage: true }, rng)).toStrictEqual({
      formula: "2d20kl1+3",
      rolls: [5, 17],
      kept: [5],
      modifier: 3,
      total: 8,
    });
  });

  test("advantage takes precedence over disadvantage, like the Roll20 tap's makeD20Roll", () => {
    const rng = sequenceRng([valueFor(20, 3), valueFor(20, 9)]);
    const result = rollD20("0", { advantage: true, disadvantage: true }, rng);
    expect(result.formula).toBe("2d20kh1");
    expect(result.kept).toStrictEqual([9]);
  });

  test("defaults to Math.random when no rng is given", () => {
    const result = rollD20("+1", {});
    expect(result.rolls).toHaveLength(1);
    expect(Number.isInteger(result.rolls[0])).toBe(true);
    expect(result.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.rolls[0]).toBeLessThanOrEqual(20);
  });

  test("every roll stays within 1..20 across many trials", () => {
    for (let i = 0; i < 200; i++) {
      const result = rollD20("+2", { advantage: true });
      for (const roll of result.rolls) {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(20);
      }
    }
  });

  test("rejects an invalid modifier", () => {
    expect(() => rollD20("banana", {}, sequenceRng([0]))).toThrow();
  });
});

describe("rollDamage", () => {
  test("single die, no modifier", () => {
    const rng = sequenceRng([valueFor(8, 6)]);
    expect(rollDamage("1d8", rng)).toStrictEqual({ formula: "1d8", rolls: [6], modifier: 0, total: 6 });
  });

  test("single die, positive modifier", () => {
    const rng = sequenceRng([valueFor(6, 4)]);
    expect(rollDamage("1d6+3", rng)).toStrictEqual({ formula: "1d6+3", rolls: [4], modifier: 3, total: 7 });
  });

  test("single die, negative modifier", () => {
    const rng = sequenceRng([valueFor(4, 2)]);
    expect(rollDamage("1d4-1", rng)).toStrictEqual({ formula: "1d4-1", rolls: [2], modifier: -1, total: 1 });
  });

  test("multiple dice, summed in roll order", () => {
    const rng = sequenceRng([valueFor(6, 2), valueFor(6, 5), valueFor(6, 6)]);
    expect(rollDamage("3d6+2", rng)).toStrictEqual({ formula: "3d6+2", rolls: [2, 5, 6], modifier: 2, total: 15 });
  });

  test("defaults to Math.random when no rng is given", () => {
    const result = rollDamage("2d10");
    expect(result.rolls).toHaveLength(2);
  });

  test("every die stays within 1..sides across many trials", () => {
    for (let i = 0; i < 200; i++) {
      const result = rollDamage("4d6+1");
      expect(result.rolls).toHaveLength(4);
      for (const roll of result.rolls) {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      }
      expect(result.total).toBe(result.rolls.reduce((sum, roll) => sum + roll, 0) + 1);
    }
  });

  // See the equivalent parseDiceExpression test above: DMV never produces
  // multi-part damage, so rollDamage doesn't need to support it either.
  test("rejects multi-part damage", () => {
    expect(() => rollDamage("1d8+2d6")).toThrow();
  });
});
