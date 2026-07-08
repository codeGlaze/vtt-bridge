import { STORE_CLICK, STORE_ERROR } from "../store";
import { classes, onElementLoad } from "../common";
import { DMV } from "@/selectors";
import { isValidDescription, isValidName } from "../transform/validate";

export const addUseFeatureListeners = (store) => {
  onElementLoad(`${DMV.actionsSection} ${DMV.paragraph} ${DMV.featureEntrySpans}`, () =>
    ready(store, DMV.actionsSection),
  );
  onElementLoad(`${DMV.bonusActionsSection} ${DMV.paragraph} ${DMV.featureEntrySpans}`, () =>
    ready(store, DMV.bonusActionsSection),
  );
  onElementLoad(`${DMV.featuresTraitsAndFeatsSection} ${DMV.paragraph} ${DMV.featureEntrySpans}`, () =>
    ready(store, DMV.featuresTraitsAndFeatsSection),
  );
  onElementLoad(`${DMV.reactionsSection} ${DMV.paragraph} ${DMV.featureEntrySpans}`, () =>
    ready(store, DMV.reactionsSection),
  );
};

/**
 * @param {*} store
 * @param {string} selector
 */
const ready = (store, selector) => {
  const className = classes.useFeature;
  const children = /** @type {HTMLElement} */ (document.querySelector(selector)).querySelectorAll(DMV.paragraph);

  for (const child of children) {
    // There may be more spans, but we don't care about them.
    const [featureSpan, detailsSpan, ,] = /** @type {NodeListOf<HTMLElement>} */ (
      child.querySelectorAll(DMV.featureEntrySpans)
    );

    const name = featureSpan.innerText;
    if (!isValidName(name)) {
      store.dispatch(STORE_ERROR, { name: "feature", property: "name", value: name });
      continue;
    }

    const description = detailsSpan.innerText;
    if (!isValidDescription(description)) {
      store.dispatch(STORE_ERROR, { name, property: "description", value: description });
      continue;
    }

    // These buttons don't normally exist, so we need to create them.
    const button = document.createElement("button");
    button.innerText = "USE";
    button.classList.add("roll-button", "m-t-10", "m-l-10", className);
    button.onclick = function (event) {
      store.dispatch(STORE_CLICK, { className, event, data: { name, description } });
    };
    child.appendChild(button);

    console.debug(`Added use feature listener: ${name}`);
  }
};
