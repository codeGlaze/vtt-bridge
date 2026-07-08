import { parseDiceExpression, rollD20, rollDamage, toSignedModifier } from "./dice";

import { intentKinds } from "../transform/state";

/**
 * @typedef {Object} RollRecord
 *
 * A display-ready record for a single {@link import("../transform/state").RollIntent},
 * with dice already rolled (Owlbear Rodeo has no server-side dice engine of
 * its own). Delivered to the "VTT Bridge" Owlbear room extension over
 * `../taps/protocol`'s window.postMessage channel.
 *
 * @property {string} character
 * @property {string} summary - the same emote phrasing as the Roll20 tap (`../taps/roll20`),
 *   minus Roll20 chat syntax, e.g. "Aria attacks with Longsword", "Aria rolls Perception check".
 * @property {string | null} formula - e.g. "2d20kh1+5", "2d6+3"; `null` for description-only kinds.
 * @property {number[]} rolls - individual die results, in roll order (`[]` when `formula` is `null`).
 * @property {number | null} total
 * @property {string | null} description - the castSpell/useFeature description text; `null` otherwise.
 * @property {boolean} visible
 */

/**
 * The d20-based kinds: a plain 1d20, or (with advantage/disadvantage) 2d20
 * keeping the higher/lower die, plus the intent's `mod`.
 */
const d20Kinds = new Set([intentKinds.check, intentKinds.initiative, intentKinds.proficiency, intentKinds.savingThrow]);

/**
 * The base emote text per kind, exactly matching the text argument the
 * Roll20 tap (`./roll20`) passes to `makeEmote`/`makeToast` for the same
 * kind -- just without Roll20's "/em :"/"with advantage" chat syntax, which
 * carries no information the RollRecord's `formula` doesn't already convey.
 *
 * @param {import("../transform/state").RollIntent} intent
 * @returns {string}
 */
const summarize = ({ kind, character, name }) => {
  switch (kind) {
    case intentKinds.attack:
      return `${character} attacks with ${name}`;
    case intentKinds.castSpell:
      return `${character} casts ${name}`;
    case intentKinds.check:
      return `${character} rolls ${name} check`;
    case intentKinds.initiative:
      return `${character} rolls ${name}`;
    case intentKinds.proficiency:
      return `${character} rolls ${name}`;
    case intentKinds.savingThrow:
      return `${character} rolls ${name} save`;
    case intentKinds.damage:
      return `${character} rolls ${name} damage`;
    case intentKinds.useFeature:
      return `${character} uses ${name}`;
    default:
      throw new Error(`Unknown intent kind: ${kind}`);
  }
};

/**
 * @param {import("../transform/state").RollIntent} intent
 * @param {import("./dice").Rng} rng
 * @returns {RollRecord}
 */
const renderRollRecord = (intent, rng) => {
  // Only the fields relevant to `kind` are ever populated (see RollIntent);
  // cast the rest to non-optional so each branch below can use them
  // directly, exactly as `parseState` guarantees for that `kind`.
  const { kind, character, mod, damage, attack, description, advantage, disadvantage, visible } =
    /** @type {Required<import("../transform/state").RollIntent>} */ (intent);
  const summary = summarize(intent);
  const base = { character, summary, visible };

  if (d20Kinds.has(kind)) {
    const { formula, rolls, total } = rollD20(mod, { advantage, disadvantage }, rng);
    return { ...base, formula, rolls, total, description: null };
  }

  switch (kind) {
    case intentKinds.attack: {
      // `attack` (e.g. "1d20+5") already bakes the modifier into a dice
      // expression (see `isValidAttack` in `../transform/validate`); pull it
      // back out so advantage/disadvantage can be applied the same way as
      // every other d20 roll (2d20kh1/kl1), rather than rolling the whole
      // expression twice like the Roll20 tap's `makeWeaponAttack` does.
      const { modifier } = parseDiceExpression(attack);
      const { formula, rolls, total } = rollD20(toSignedModifier(modifier), { advantage, disadvantage }, rng);
      return { ...base, formula, rolls, total, description: null };
    }
    case intentKinds.damage: {
      const { formula, rolls, total } = rollDamage(damage, rng);
      return { ...base, formula, rolls, total, description: null };
    }
    case intentKinds.castSpell:
    case intentKinds.useFeature:
      return { ...base, formula: null, rolls: [], total: null, description };
    default:
      throw new Error(`Unknown intent kind: ${kind}`);
  }
};

/**
 * Render a list of intents (in delivery order) into display-ready
 * {@link RollRecord}s, rolling all dice locally.
 *
 * @param {import("../transform/state").RollIntent[]} intents
 * @param {import("./dice").Rng} [rng]
 * @returns {RollRecord[]}
 */
export const renderRollRecords = (intents, rng = Math.random) => intents.map((intent) => renderRollRecord(intent, rng));
