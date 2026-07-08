import { STORE_CLICK, STORE_ERROR } from "../store";
import { classes, onElementLoad } from "../common";
import { DMV } from "@/selectors";
import { isValidMod, isValidName } from "../transform/validate";

// Brittle: wait for any roll button to load.
/** @param {import("../store").Store} store */
export const addRollProficiencyListeners = (store) =>
  onElementLoad(DMV.proficiencyRollButtonAnchor, () => ready(store));

/** @param {import("../store").Store} store */
const ready = (store) => {
  const className = classes.rollProficiency;
  const tables = /** @type {HTMLElement} */ (document.querySelector(DMV.detailsColumns)).querySelectorAll(DMV.table);

  for (const table of tables) {
    const rows = table.querySelectorAll(DMV.tableRow);

    for (const row of rows) {
      // Skip table headers.
      if (row.querySelectorAll(DMV.tableHeaderCell).length > 0) {
        continue;
      }

      const cells = /** @type {HTMLElement[]} */ (Array.from(row.querySelectorAll(DMV.tableCell)));
      const name = cells[0].innerText;
      if (!isValidName(name)) {
        store.dispatch(STORE_ERROR, { name: "proficiency", property: "name", value: name });
        continue;
      }

      const button = /** @type {HTMLElement} */ (row.querySelector(DMV.rollButton));

      // Temporary workaround: tool buttons are not compact.
      const mod = button.innerText === "Roll" ? cells[cells.length - 2].innerText : button.innerText;
      if (!isValidMod(mod)) {
        store.dispatch(STORE_ERROR, { name, property: "modifier", value: mod });
        continue;
      }

      button.classList.add(className);
      button.addEventListener("click", function (event) {
        store.dispatch(STORE_CLICK, { className, event, data: { name, mod } });
      });

      console.debug(`Added roll proficiency listener: ${name}`);
    }
  }
};
