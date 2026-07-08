import { makeD20Roll, makeDamageRoll, makeDescription, makeEmote, makeWeaponAttack } from "./commands";

import { intentKinds } from "./state";

/**
 * The Roll20 "sink": turns a {@link RollIntent} (see `./state`) into the
 * Roll20 chat command string(s) it represents. This is the only place that
 * knows about Roll20 chat syntax; a future second VTT would get its own
 * sink module implementing the same `renderIntents` shape.
 *
 * @param {import("./state").RollIntent} intent
 * @returns {string[]}
 */
const renderIntent = (intent) => {
  // Only the fields relevant to `kind` are ever populated (see RollIntent);
  // cast the rest to non-optional so each switch case below can use them
  // directly, exactly as `parseState` guarantees for that `kind`.
  const { kind, character, name, mod, damage, attack, description, advantage, disadvantage, visible } =
    /** @type {Required<import("./state").RollIntent>} */ (intent);
  const options = { hasAdvantage: advantage, hasDisadvantage: disadvantage, visible };

  switch (kind) {
    case intentKinds.attack:
      return [makeEmote(`${character} attacks with ${name}`, options), makeWeaponAttack(attack, options)];
    case intentKinds.castSpell:
      return [makeEmote(`${character} casts ${name}`, options), makeDescription(description, options)];
    case intentKinds.check:
      return [makeEmote(`${character} rolls ${name} check`, options), makeD20Roll(mod, options)];
    case intentKinds.initiative:
      return [
        makeEmote(`${character} rolls ${name}`, options),
        // Add turn tracker support to initiative rolls.
        makeD20Roll(mod, options) + " &{tracker}",
      ];
    case intentKinds.proficiency:
      return [makeEmote(`${character} rolls ${name}`, options), makeD20Roll(mod, options)];
    case intentKinds.savingThrow:
      return [makeEmote(`${character} rolls ${name} save`, options), makeD20Roll(mod, options)];
    case intentKinds.damage:
      return [makeEmote(`${character} rolls ${name} damage`, options), makeDamageRoll(damage, options)];
    case intentKinds.useFeature:
      return [makeEmote(`${character} uses ${name}`, options), makeDescription(description, options)];
    default:
      throw `Unknown intent kind: ${kind}`;
  }
};

/**
 * Render a list of intents (in delivery order) into the flat list of Roll20
 * chat command strings they produce.
 *
 * @param {import("./state").RollIntent[]} intents
 * @returns {string[]}
 */
export const renderIntents = (intents) => intents.flatMap(renderIntent);
