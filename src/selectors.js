// Every CSS selector used to locate elements on the two host pages (as
// opposed to elements the extension itself injects; see the `classes`
// object in `common.js` for those). Centralized so that a DMV or Roll20
// frontend change only requires editing this one file.

// Shared table fragments, reused by several DMV selectors below.
const table = "table";
const tableRow = "tr";
const tableHeaderCell = "th";
const tableCell = "td";
const paragraph = "p";

// Rendered by DMV on every roll-able row (ability score, skill, saving
// throw, proficiency, weapon, spell attack, initiative, ...).
const rollButton = ".roll-button";

// Wrapping container for the currently active tab's detail tables
// (proficiencies, spells).
const detailsColumns = ".details-columns";

// A spell's row within the details columns table.
const spellRow = "tr.spell";

// Label cell for a saving throw row.
const savingThrowName = ".saving-throw-name";

// Container for the weapons table.
const weapons = ".weapons";

export const DMV = {
  table,
  tableRow,
  tableHeaderCell,
  tableCell,
  paragraph,
  rollButton,
  detailsColumns,

  // dispatch/index.js: brittle proxy element indicating the character
  // sheet app has finished loading.
  appReady: ".class-name",

  // setCharacter.js: displays the character's name.
  characterName: ".character-name",

  // toggleVisibility.js: header area where the visibility toggle button is
  // injected.
  characterSummary: ".character-summary",

  // rollAbilityScore.js: container for the six ability score blocks.
  abilityScores: ".ability-scores",
  // rollAbilityScore.js: the six ability score roll buttons, in STR/DEX/
  // CON/INT/WIS/CHA order.
  abilityScoreRollButtons: `.ability-scores ${rollButton}`,

  // rollInitiative.js: container for the initiative block.
  initiative: ".initiative",

  // rollProficiency.js: wait for any proficiency roll button to render.
  proficiencyRollButtonAnchor: `${detailsColumns} ${table} ${tableRow} ${rollButton}`,

  savingThrowName,
  // rollSavingThrow.js: wait for any saving throw name to render.
  savingThrowNameAnchor: `${table} ${tableRow} ${savingThrowName}`,

  // rollSkill.js: container for the skills table.
  skills: ".skills",
  // rollSkill.js: label cell for a skill row.
  skillName: ".skill-name",

  spellRow,
  // rollSpell.js/expandSpell.js: wait for any spell row to render.
  spellRowAnchor: `${detailsColumns} ${spellRow}`,
  // expandSpell.js: clickable spell name area that expands a spell's
  // description.
  spellPointer: ".spell.pointer",
  // expandSpell.js: the "roll" button rendered inside an expanded spell's
  // cell once it finishes loading.
  spellFormButton: ".spells td .form-button",

  // selectTab.js: the 5 top-level tab buttons (combat/proficiencies/
  // spells/features/equipment); ".w-50-p" excludes banner ads.
  tabs: ".w-50-p .flex-grow-1.t-a-c",
  // selectTab.js: orange bar rendered as a tab's child once its content
  // has finished loading.
  tabActiveIndicator: ".b-orange",

  // useFeature.js: "Actions" tab-section container.
  actionsSection: ".actions",
  // useFeature.js: "Bonus Actions" tab-section container.
  bonusActionsSection: ".bonusActions",
  // useFeature.js: "Features, Traits & Feats" tab-section container
  // (commas in the class name must be escaped for use as a CSS selector).
  featuresTraitsAndFeatsSection: ".features\\,Traits\\,AndFeats",
  // useFeature.js: "Reactions" tab-section container.
  reactionsSection: ".reactions",
  // useFeature.js: name/description spans within a feature entry.
  featureEntrySpans: "span",

  weapons,
  // weapon.js: wait for any weapon roll button to render.
  weaponRollButtonAnchor: `${weapons} .weapon ${rollButton}`,
};

export const ROLL20 = {
  // roll20.content.js: wrapper around Roll20's chat textarea and send
  // button; also used as the "chat ready" anchor. Roll20's Jumpgate engine
  // recreates this DOM, so it must always be re-queried, never cached.
  chatInput: "#textchat-input",
  // roll20.content.js: the chat message textarea, scoped within chatInput.
  chatTextarea: "textarea",
  // roll20.content.js: primary send button, scoped within chatInput.
  chatSendButton: "button",
  // roll20.content.js: fallback send button selector for older Roll20 UI,
  // scoped within chatInput.
  chatSendButtonFallback: ".btn",
};
