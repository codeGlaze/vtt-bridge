/**
 * @typedef {Object} ValidationError
 * @property {string} name
 * @property {string} property
 * @property {string} value
 */

/**
 * @param {ValidationError} error
 * @returns {string}
 */
export const formatError = ({ name, property, value }) => `Error: invalid ${name} ${property}: ${value}`;
