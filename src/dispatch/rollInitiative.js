import { STORE_CLICK, STORE_ERROR } from "../store";
import { classes, onElementLoad } from "../common";
import { DMV } from "@/selectors";

import { isValidMod } from "../transform/validate";

export const addRollInitiativeListeners = (store) => onElementLoad(DMV.initiative, () => ready(store));

const ready = (store) => {
  const className = classes.rollInitiative;
  const name = "initiative";

  const parent = /** @type {HTMLElement} */ (document.querySelector(DMV.initiative));
  const button = /** @type {HTMLElement} */ (parent.querySelector(DMV.rollButton));

  const mod = button.innerText;
  if (!isValidMod(mod)) {
    store.dispatch(STORE_ERROR, { name, property: "modifier", value: mod });
    return;
  }

  button.classList.add(className);
  button.addEventListener("click", function (event) {
    store.dispatch(STORE_CLICK, { className, event, data: { name, mod } });
  });

  console.debug("Added roll initiative listener");
};
