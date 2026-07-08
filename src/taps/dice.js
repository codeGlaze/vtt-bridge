// Local dice rolling for the Owlbear tap.
//
// Owlbear Rodeo (unlike Roll20) has no server-side dice engine to hand chat
// commands to -- there's no chat at all. This VTT's tap has to roll the
// dice itself, client-side, and hand the room extension the resulting
// numbers to render.
//
// The notations rolled here are exactly what DMV produces and
// `src/transform/validate.js` validates:
//   - `isValidMod`: a signed modifier string, e.g. "+5", "-1", "0".
//   - `isValidDamage`/`isValidAttack` (identical grammar): a *single* dice
//     group with an optional signed modifier, e.g. "2d6+3", "1d20-1", "1d8".
//     DMV never emits multi-part damage (e.g. "1d8+2d6") -- the regex in
//     validate.js only ever matches one `NdM` group, so this module doesn't
//     need to parse multiple dice groups either.

/**
 * @typedef {() => number} Rng - returns a float in [0, 1), like `Math.random`.
 */

/**
 * @typedef {Object} DiceRollResult
 * @property {string} formula - the dice formula actually rolled, e.g. "2d20kh1+5".
 * @property {number[]} rolls - every individual die result, in roll order.
 * @property {number[]} [kept] - for advantage/disadvantage d20 rolls, the single kept die.
 * @property {number} modifier - the flat numeric modifier applied.
 * @property {number} total - the final total (the kept die, or the sum of `rolls`, plus `modifier`).
 */

const DICE_EXPRESSION_RE = /^([0-9]+)d([0-9]+)([+-][0-9]+)?$/;
const MODIFIER_RE = /^[+-]?[0-9]+$/;

/**
 * @param {number} sides
 * @param {Rng} rng
 * @returns {number} an integer in [1, sides].
 */
const rollDie = (sides, rng) => Math.floor(rng() * sides) + 1;

/**
 * @param {string} mod - signed modifier string per `isValidMod` in `../transform/validate`.
 * @returns {number}
 */
const parseModifier = (mod) => {
  if (!MODIFIER_RE.test(mod)) {
    throw new Error(`Invalid modifier: ${JSON.stringify(mod)}`);
  }
  return parseInt(mod, 10);
};

/**
 * @param {number} modifier
 * @returns {string} e.g. "+5", "-1", "" for 0 (no suffix at all).
 */
const formatModifierSuffix = (modifier) => {
  if (modifier === 0) {
    return "";
  }
  return modifier > 0 ? `+${modifier}` : `${modifier}`;
};

/**
 * @param {number} modifier
 * @returns {string} a signed modifier string per `isValidMod`, e.g. "+5", "-1", "0".
 */
export const toSignedModifier = (modifier) => (modifier === 0 ? "0" : formatModifierSuffix(modifier));

/**
 * Parse a single dice-group expression per `isValidAttack`/`isValidDamage`
 * in `../transform/validate`, e.g. "2d6+3" -> `{ count: 2, sides: 6, modifier: 3 }`.
 *
 * @param {string} expression
 * @returns {{ count: number, sides: number, modifier: number }}
 */
export const parseDiceExpression = (expression) => {
  const match = DICE_EXPRESSION_RE.exec(expression);
  if (!match) {
    throw new Error(`Invalid dice expression: ${JSON.stringify(expression)}`);
  }
  const [, countStr, sidesStr, modStr] = match;
  return {
    count: parseInt(countStr, 10),
    sides: parseInt(sidesStr, 10),
    modifier: modStr ? parseInt(modStr, 10) : 0,
  };
};

/**
 * Roll a d20-based check: a plain 1d20, or (with advantage/disadvantage) a
 * 2d20 pool keeping the higher/lower die -- matching the "2d20kh1"/"2d20kl1"
 * conventions in `../transform/commands`. Advantage takes precedence if both
 * are somehow set (mirrors the Roll20 tap's `makeD20Roll`, which checks
 * `hasAdvantage` first).
 *
 * @param {string} mod - signed modifier string per `isValidMod`.
 * @param {{ advantage?: boolean, disadvantage?: boolean }} [options]
 * @param {Rng} [rng]
 * @returns {DiceRollResult}
 */
export const rollD20 = (mod, { advantage = false, disadvantage = false } = {}, rng = Math.random) => {
  const modifier = parseModifier(mod);
  const suffix = formatModifierSuffix(modifier);

  if (advantage || disadvantage) {
    const rolls = [rollDie(20, rng), rollDie(20, rng)];
    const kept = [advantage ? Math.max(...rolls) : Math.min(...rolls)];
    return {
      formula: `2d20${advantage ? "kh1" : "kl1"}${suffix}`,
      rolls,
      kept,
      modifier,
      total: kept[0] + modifier,
    };
  }

  const rolls = [rollDie(20, rng)];
  return { formula: `1d20${suffix}`, rolls, modifier, total: rolls[0] + modifier };
};

/**
 * Roll a damage (or attack) dice expression per `isValidDamage`/`isValidAttack`.
 *
 * @param {string} damage - e.g. "2d6+3".
 * @param {Rng} [rng]
 * @returns {DiceRollResult}
 */
export const rollDamage = (damage, rng = Math.random) => {
  const { count, sides, modifier } = parseDiceExpression(damage);
  const rolls = Array.from({ length: count }, () => rollDie(sides, rng));
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  return { formula: damage, rolls, modifier, total };
};
