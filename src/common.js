export const classes = {
  attackWithSpell: "vtt-attack-with-spell",
  attackWithWeapon: "vtt-attack-with-weapon",
  castSpell: "vtt-cast-spell",
  rollAbilityScore: "vtt-roll-ability-score",
  rollInitiative: "vtt-roll-initiative",
  rollProficiency: "vtt-roll-proficiency",
  rollSavingThrow: "vtt-roll-saving-throw",
  rollSkill: "vtt-roll-skill",
  rollWeaponDamage: "vtt-roll-weapon-damage",
  toggleVisibility: "vtt-toggle-visibility",
  useFeature: "vtt-use-feature",
};

export const messageType = { enqueue: 0, clear: 1, ready: 2, run: 3 };

/**
 * @typedef {(typeof messageType)[keyof typeof messageType]} MessageType
 */

/**
 * Run a callback after an element loads.
 *
 * @param {string} selector
 * @param {() => void} callback
 */
export const onElementLoad = (selector, callback) => onPredicate(() => !!document.querySelector(selector), callback);

/**
 * Run a callback after an element's child loads.
 *
 * @param {Element} element
 * @param {string} selector
 * @param {() => void} callback
 */
export const onChildLoad = (element, selector, callback) =>
  onPredicate(() => !!element.querySelector(selector), callback);

/**
 * Run a callback after a predicate is satisfied.
 *
 * Uses exponential backoff with limited attempts.
 *
 * @param {() => boolean} predicate
 * @param {() => void} callback
 * @param {number} [attempts]
 * @param {number} [timeout]
 */
const onPredicate = (predicate, callback, attempts = 10, timeout = 100) => {
  if (predicate()) {
    callback();
  } else if (attempts <= 0) {
    console.warn("Maximum number of attempts exceeded");
  } else {
    setTimeout(function () {
      onPredicate(predicate, callback, attempts - 1, timeout * 2);
    }, timeout);
  }
};
