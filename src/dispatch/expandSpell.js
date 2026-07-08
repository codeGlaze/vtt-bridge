import { STORE_CLICK, STORE_ERROR } from "../store";
import { classes, onElementLoad } from "../common";
import { DMV } from "@/selectors";
import { isValidDescription, isValidName } from "../transform/validate";

// Brittle: wait for any spell row to load.
/** @param {import("../store").Store} store */
export const addExpandSpellListeners = (store) => onElementLoad(DMV.spellRowAnchor, () => ready(store));

/** @param {import("../store").Store} store */
const ready = (store) => {
  const className = classes.castSpell;
  let pointers = /** @type {HTMLElement} */ (document.querySelector(DMV.detailsColumns)).querySelectorAll(
    DMV.spellPointer,
  );

  for (const pointer of pointers) {
    pointer.addEventListener("click", function () {
      // Brittle: wait for any form button in a cell to load.
      onElementLoad(DMV.spellFormButton, () => {
        const button = /** @type {HTMLElement} */ (document.querySelector(DMV.spellFormButton));
        button.classList.remove("form-button"); // Avoid matching this button again.
        button.classList.add("roll-button", className);
        button.innerText = "CAST SPELL";

        // Brittle: search backwards to find the spell name.
        const prevRow = /** @type {HTMLElement} */ (
          /** @type {HTMLElement} */ (button.closest(DMV.tableRow)).previousSibling
        );
        const name = /** @type {HTMLElement} */ (prevRow.firstChild).innerText;
        if (!isValidName(name)) {
          store.dispatch(STORE_ERROR, { name: "spell", property: "name", value: name });
          return;
        }

        const cell = /** @type {HTMLElement} */ (button.closest(DMV.tableCell));
        const paragraphs = /** @type {HTMLElement[]} */ (Array.from(cell.querySelectorAll(DMV.paragraph)));
        const description = paragraphs.map((p) => p.innerText).join("\n");
        if (!isValidDescription(description)) {
          store.dispatch(STORE_ERROR, { name, property: "description", value: description });
          return;
        }

        button.addEventListener("click", function (event) {
          store.dispatch(STORE_CLICK, { className, event, data: { name, description } });
        });

        console.debug(`Added expand spell listener: ${name}`);
      });
    });
  }
};
