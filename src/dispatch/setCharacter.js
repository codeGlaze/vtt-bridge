import { STORE_CHARACTER } from "../store";
import { DMV } from "@/selectors";
import { onElementLoad } from "../common";

export const setCharacter = (store) => onElementLoad(DMV.characterName, () => ready(store));

const ready = (store) => {
  const character = document.querySelector(DMV.characterName).innerText;
  store.dispatch(STORE_CHARACTER, character);
  console.debug(`Set character to: ${character}`);
};
