import { STORE_CLICK, STORE_ERROR } from "../store";
import { classes, onElementLoad } from "../common";
import { DMV } from "@/selectors";
import { isValidAttack, isValidName } from "../transform/validate";

// Brittle: wait for any spell row to load.
export const addRollSpellListeners = (store) => onElementLoad(DMV.spellRowAnchor, () => ready(store));

const ready = (store) => {
  const className = classes.attackWithSpell;
  const rows = /** @type {HTMLElement} */ (document.querySelector(DMV.detailsColumns)).querySelectorAll(DMV.spellRow);

  for (const row of rows) {
    const cells = /** @type {HTMLElement[]} */ (Array.from(row.querySelectorAll(DMV.tableCell)));
    const name = cells[0].innerText;
    if (!isValidName(name)) {
      store.dispatch(STORE_ERROR, { name: "spell", property: "name", value: name });
      continue;
    }

    const button = /** @type {HTMLElement} */ (row.querySelector(DMV.rollButton));

    const attack = button.innerText;
    if (!isValidAttack(attack)) {
      store.dispatch(STORE_ERROR, { name, property: "attack", value: attack });
      continue;
    }

    button.classList.add(className);
    button.addEventListener("click", function (event) {
      store.dispatch(STORE_CLICK, { className, event, data: { name, attack } });
    });

    console.debug(`Added roll spell listener: ${name}`);
  }
};
