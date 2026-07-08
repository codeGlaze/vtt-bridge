import { addRollAbilityScoreListeners } from "./rollAbilityScore";
import { addRollSavingThrowListeners } from "./rollSavingThrow";
import { addRollSkillListeners } from "./rollSkill";
import { addSelectTabListeners } from "./selectTab";
import { addToggleVisibilityListeners } from "./toggleVisibility";
import { DMV } from "@/selectors";
import { onElementLoad } from "../common";
import { setCharacter } from "./setCharacter";

export const addDispatchers = (store, callback) =>
  // Brittle: use class name as a proxy for the app loading.
  onElementLoad(DMV.appReady, () => {
    setCharacter(store);
    addToggleVisibilityListeners(store);

    addSelectTabListeners(store);

    addRollAbilityScoreListeners(store);
    addRollSkillListeners(store);
    addRollSavingThrowListeners(store);

    callback();
  });
