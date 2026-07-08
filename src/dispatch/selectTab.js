import { onChildLoad, onElementLoad } from "../common";
import { DMV } from "@/selectors";

import { addExpandSpellListeners } from "./expandSpell";
import { addRollInitiativeListeners } from "./rollInitiative";
import { addRollProficiencyListeners } from "./rollProficiency";
import { addRollSpellListeners } from "./rollSpell";
import { addUseFeatureListeners } from "./useFeature";
import { addWeaponListeners } from "./weapon";

// Which tab is currently selected?
let activeTab = -1;

// Brittle: wait for any tab to load.
// We need the ".w-50-p" to exclude banner ads.
export const addSelectTabListeners = (store) => onElementLoad(DMV.tabs, () => ready(store));

const ready = (store) => {
  // Find all 5 tabs. A tab is not done loading until it has an orange bar as its child.
  const [combatTab, proficienciesTab, spellsTab, featuresTab, equipmentTab] = document.querySelectorAll(DMV.tabs);

  combatTab.addEventListener("click", () => {
    console.debug("Selected combat tab");
    if (activeTab !== 0) {
      onChildLoad(combatTab, DMV.tabActiveIndicator, () => {
        addRollInitiativeListeners(store);
        addWeaponListeners(store);
      });
    }
    activeTab = 0;
  });

  // Load combat tab by default.
  combatTab.click();

  proficienciesTab.addEventListener("click", () => {
    console.debug("Selected proficiencies tab");
    if (activeTab !== 1) {
      onChildLoad(proficienciesTab, DMV.tabActiveIndicator, () => addRollProficiencyListeners(store));
    }
    activeTab = 1;
  });

  spellsTab.addEventListener("click", () => {
    console.debug("Selected spells tab");
    if (activeTab !== 2) {
      onChildLoad(spellsTab, DMV.tabActiveIndicator, () => {
        addRollSpellListeners(store);
        addExpandSpellListeners(store);
      });
    }
    activeTab = 2;
  });

  featuresTab.addEventListener("click", () => {
    console.debug("Selected features tab");
    if (activeTab !== 3) {
      onChildLoad(featuresTab, DMV.tabActiveIndicator, () => addUseFeatureListeners(store));
    }
    activeTab = 3;
  });

  equipmentTab.addEventListener("click", () => {
    console.debug("Selected equipment tab");
    if (activeTab !== 4) {
      onChildLoad(equipmentTab, DMV.tabActiveIndicator, () => addWeaponListeners(store));
    }
    activeTab = 4;
  });

  console.debug("Added select tab listeners");
};
