export const createStore = () => {
  let state = { ...initialState };
  const subscribers = [];

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

const initialState = { character: "Player", click: null, error: null, visible: true };
