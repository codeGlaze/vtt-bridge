/**
 * The DMV content script's whole reactive state, held by the store returned
 * from {@link createStore} and pushed to every `subscribe`r on change.
 *
 * @typedef {Object} StoreState
 * @property {string} character - the active character's name.
 * @property {import("./transform/state").Click | null} click - the most recent roll-button click, if any.
 * @property {import("./transform/error").ValidationError | null} error - the most recent validation error, if any.
 * @property {boolean} visible - whether rolls should be shown to all players.
 */

/**
 * @typedef {(state: StoreState, payload: any) => StoreState} Mutation
 */

/**
 * @typedef {Object} StoreContext
 * @property {(mutationName: keyof typeof mutations, payload: any) => void} commit
 */

/**
 * @returns {{
 *   dispatch: (actionName: keyof typeof actions, payload: any) => void,
 *   subscribe: (callback: (state: StoreState) => void) => void,
 * }}
 */
export const createStore = () => {
  /** @type {StoreState} */
  let state = { ...initialState };
  /** @type {Array<(state: StoreState) => void>} */
  const subscribers = [];

  /** @type {StoreContext} */
  const context = {
    commit(mutationName, payload) {
      state = mutations[mutationName](state, payload);
      subscribers.forEach((subscriber) => subscriber(state));
    },
  };

  return {
    dispatch(actionName, payload) {
      actions[actionName](context, payload);
    },
    subscribe(callback) {
      subscribers.push(callback);
    },
  };
};

export const STORE_CHARACTER = "character";
export const STORE_CLICK = "click";
export const STORE_ERROR = "error";
export const STORE_VISIBILITY = "visibility";

/** @type {Record<string, (context: StoreContext, payload: any) => void>} */
const actions = {
  character(context, payload) {
    context.commit("setCharacter", payload);
  },
  click(context, payload) {
    context.commit("setClick", payload);
  },
  error(context, payload) {
    context.commit("setError", payload);
  },
  visibility(context, payload) {
    context.commit("setVisibility", payload);
  },
};

/** @type {Record<string, Mutation>} */
const mutations = {
  setCharacter(state, payload) {
    state.click = null;
    state.character = payload;
    return state;
  },
  setClick(state, payload) {
    state.click = payload;
    return state;
  },
  setError(state, payload) {
    state.click = null;
    state.error = payload;
    return state;
  },
  setVisibility(state, payload) {
    state.click = null;
    state.visible = payload;
    return state;
  },
};

/** @type {StoreState} */
const initialState = { character: "Player", click: null, error: null, visible: true };
