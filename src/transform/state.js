import { classes } from "../common";
import { makeToast } from "./toasts";

/**
 * Discriminators for {@link RollIntent.kind}. One per distinct rendering
 * shape produced by `parseState`'s switch on click `className` (some click
 * kinds, e.g. ability score vs. skill checks, share a rendering shape and
 * therefore a single intent kind).
 */
export const intentKinds = {
  attack: "attack",
  castSpell: "castSpell",
  check: "check",
  damage: "damage",
  initiative: "initiative",
  proficiency: "proficiency",
  savingThrow: "savingThrow",
  useFeature: "useFeature",
};

/**
 * @typedef {Object} RollIntent
 *
 * A plain-JSON description of a roll or action a player triggered on the DMV
 * side. It carries no VTT-specific text or syntax -- a "sink" module (e.g.
 * `./renderRoll20`) turns it into chat commands for a particular VTT at
 * delivery time. Because it crosses `runtime.sendMessage` and
 * `storage.session`, it must be structured-clone/JSON-safe: plain strings,
 * booleans, and no `undefined` fields (only the fields relevant to `kind`
 * are present).
 *
 * @property {string} kind - one of {@link intentKinds}.
 * @property {string} character - the acting character's name.
 * @property {string} [name] - the skill/ability/weapon/spell/feature name.
 * @property {string} [mod] - signed modifier string (e.g. "+1", "-1", "0") for d20 rolls.
 * @property {string} [damage] - damage dice expression (e.g. "1d8+2").
 * @property {string} [attack] - attack roll dice expression (e.g. "1d20+5").
 * @property {string} [description] - free-text description/effect text.
 * @property {boolean} advantage - roll with advantage (ctrl-click).
 * @property {boolean} disadvantage - roll with disadvantage (shift-click).
 * @property {boolean} visible - whether the roll should be shown to all players.
 */

/**
 * @typedef {Object} ClickData
 * @property {string} [name]
 * @property {string} [mod]
 * @property {string} [description]
 * @property {string} [attack]
 * @property {string} [damage]
 */

/**
 * @typedef {Object} Click
 * @property {string} className - one of {@link import("../common").classes}.
 * @property {{ ctrlKey?: boolean, shiftKey?: boolean }} [event]
 * @property {ClickData} data
 */

/**
 * @typedef {Object} DmvState
 * @property {Click} click
 * @property {boolean} visible
 * @property {string} character
 */

/**
 * Turn the DMV-side store state (produced by a roll-button click) into a
 * user-facing toast string and a VTT-agnostic {@link RollIntent}.
 *
 * @param {DmvState} state
 * @returns {{ toast: string, intent: RollIntent }}
 */
export const parseState = (state) => {
  const { click, visible, character } = state;
  const { className, event, data } = click;
  const { name, mod, description, attack, damage } = data;
  const options = {
    hasAdvantage: event && event.ctrlKey,
    hasDisadvantage: event && event.shiftKey,
    visible,
  };
  const context = {
    character,
    advantage: !!options.hasAdvantage,
    disadvantage: !!options.hasDisadvantage,
    visible,
  };

  switch (className) {
    case classes.attackWithSpell:
    case classes.attackWithWeapon:
      return {
        toast: makeToast(`${character} attacked with ${name}`, options),
        intent: { kind: intentKinds.attack, name, attack, ...context },
      };
    case classes.castSpell:
      return {
        toast: makeToast(`${character} cast ${name}`, options),
        intent: { kind: intentKinds.castSpell, name, description, ...context },
      };
    case classes.rollAbilityScore:
    case classes.rollSkill:
      return {
        toast: makeToast(`${character} rolled ${name} check`, options),
        intent: { kind: intentKinds.check, name, mod, ...context },
      };
    case classes.rollInitiative:
      return {
        toast: makeToast(`${character} rolled ${name}`, options),
        intent: { kind: intentKinds.initiative, name, mod, ...context },
      };
    case classes.rollProficiency:
      return {
        toast: makeToast(`${character} rolled ${name}`, options),
        intent: { kind: intentKinds.proficiency, name, mod, ...context },
      };
    case classes.rollSavingThrow:
      return {
        toast: makeToast(`${character} rolled ${name} save`, options),
        intent: { kind: intentKinds.savingThrow, name, mod, ...context },
      };
    case classes.rollWeaponDamage:
      return {
        toast: makeToast(`${character} rolled ${name} damage`, options),
        intent: { kind: intentKinds.damage, name, damage, ...context },
      };
    case classes.useFeature:
      return {
        toast: makeToast(`${character} used ${name}`, options),
        intent: { kind: intentKinds.useFeature, name, description, ...context },
      };
    default:
      throw `Unknown class name: ${className}`;
  }
};
