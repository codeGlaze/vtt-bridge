import { STORE_CLICK, STORE_ERROR } from "../store";
import { classes, onElementLoad } from "../common";
import { DMV } from "@/selectors";
import { isValidDescription, isValidName } from "../transform/validate";

// Brittle: wait for any spell row to load.
export const addExpandSpellListeners = (store) => onElementLoad(DMV.spellRowAnchor, () => ready(store));

const ready = (store) => {
  const className = classes.castSpell;
  let pointers = document.querySelector(DMV.detailsColumns).querySelectorAll(DMV.spellPointer);

  for (const pointer of pointers) {
    pointer.addEventListener("click", function () {
      // Brittle: wait for any form button in a cell to load.
      onElementLoad(DMV.spellFormButton, () => {
        const button = document.querySelector(DMV.spellFormButton);
        button.classList.remove("form-button"); // Avoid matching this button again.
        button.classList.add("roll-button", className);
        button.innerText = "CAST SPELL";

        // Brittle: search backwards to find the spell name.
        const prevRow = button.closest(DMV.tableRow).previousSibling;
        const name = prevRow.firstChild.innerText;
        if (!isValidName(name)) {
          store.dispatch(STORE_ERROR, { name: "spell", property: "name", value: name });
          return;
        }

        const cell = button.closest(DMV.tableCell);
        const paragraphs = Array.from(cell.querySelectorAll(DMV.paragraph));
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
