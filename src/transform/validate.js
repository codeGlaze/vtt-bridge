/**
 * @param {unknown} s
 * @returns {s is string}
 */
const isNonEmptyString = (s) => typeof s === "string" && s.length > 0;

/** @param {string} attack @returns {boolean} */
export const isValidAttack = (attack) => isNonEmptyString(attack) && /^[0-9]+d[0-9]+([+|-][0-9]+)?$/.test(attack);
/** @param {string} damage @returns {boolean} */
export const isValidDamage = (damage) => isValidAttack(damage);
/** @param {string} description @returns {boolean} */
export const isValidDescription = (description) => isNonEmptyString(description);
/** @param {string} mod @returns {boolean} */
export const isValidMod = (mod) => isNonEmptyString(mod) && /^[+|-]?[0-9]+$/.test(mod);
/** @param {string} name @returns {boolean} */
export const isValidName = (name) => isNonEmptyString(name);
