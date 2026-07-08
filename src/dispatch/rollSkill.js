import { STORE_CLICK, STORE_ERROR } from "../store";
import { classes, onElementLoad } from "../common";
import { DMV } from "@/selectors";
import { isValidMod, isValidName } from "../transform/validate";

/** @param {import("../store").Store} store */
export const addRollSkillListeners = (store) => onElementLoad(DMV.skills, () => ready(store));

/** @param {import("../store").Store} store */
const ready = (store) => {
  const rows = /** @type {HTMLElement} */ (document.querySelector(DMV.skills)).querySelectorAll(DMV.tableRow);

  for (const row of rows) {
    const className = classes.rollSkill;

    const name = /** @type {HTMLElement} */ (row.querySelector(DMV.skillName)).innerText;
    if (!isValidName(name)) {
      store.dispatch(STORE_ERROR, { name: "skill", property: "name", value: name });
      continue;
    }

    const button = /** @type {HTMLElement} */ (row.querySelector(DMV.rollButton));

    const mod = button.innerText;
    if (!isValidMod(mod)) {
      store.dispatch(STORE_ERROR, { name, property: "modifier", value: mod });
      continue;
    }

    button.classList.add(className);
    button.addEventListener("click", function (event) {
      store.dispatch(STORE_CLICK, { className, event, data: { name, mod } });
    });

    console.debug(`Added roll skill listener: ${name}`);
  }
};
