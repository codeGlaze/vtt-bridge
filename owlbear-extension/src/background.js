// VTT Bridge -- Owlbear Rodeo room extension background script.
//
// This is the "receiving end" of the postMessage protocol described in
// docs/OWLBEAR.md. The VTT Bridge browser extension injects a content
// script into owlbear.rodeo pages; that content script relays dice-roll
// records into the page via window.postMessage. This background page
// (loaded in a hidden iframe by Owlbear Rodeo, per manifest.json's
// "background_url") listens for those messages, and uses the Owlbear
// Rodeo SDK to broadcast the roll to the rest of the room and to show a
// local notification.
//
// Protocol v1 (fixed contract, mirrors the browser-extension side):
//   -> window.parent: { source: "vtt-bridge-tap", v: 1, type: "hello" }
//   <- from page:      { source: "vtt-bridge", v: 1, type: "hello-ack" }
//   <- from page:      { source: "vtt-bridge", v: 1, type: "roll", roll: RollRecord }
//
// RollRecord = {
//   character: string, summary: string,
//   formula: string | null, rolls: number[], total: number | null,
//   description: string | null, visible: boolean
// }
import OBR from "@owlbear-rodeo/sdk";

const PROTOCOL_VERSION = 1;
const SOURCE_SELF = "vtt-bridge-tap";
const SOURCE_PEER = "vtt-bridge";

// Reverse-DNS-ish broadcast channel id, following the convention used by
// Owlbear Rodeo's own first-party extensions (e.g. the "Dice" extension
// uses "rodeo.owlbear.dice/..." ids, the reverse of its own domain). Ours
// is the reverse of the project's domain, "vtt-bridge.com".
const ROLL_CHANNEL = "com.vtt-bridge/roll";

// How often to re-announce "hello" until the content script acks it, to
// survive load-order races between the room extension iframe and the
// content script's own setup.
const HELLO_INTERVAL_MS = 2000;

const MAX_DESCRIPTION_LENGTH = 140;

let helloAcked = false;
let helloTimer = null;
let resolveReady;
const whenReady = new Promise((resolve) => {
  resolveReady = resolve;
});

/** Post the hello handshake message to the hosting page. */
function postHello() {
  const target = window.parent;
  if (!target || target === window) {
    // Not embedded in an iframe -- nothing to announce to.
    return;
  }
  // The hello carries no data, so a wildcard targetOrigin is acceptable
  // per the protocol spec. If the parent's origin were known ahead of
  // time we would prefer it, but Owlbear Rodeo's own origin can vary
  // between environments (self-hosted deployments, staging, etc.).
  target.postMessage({ source: SOURCE_SELF, v: PROTOCOL_VERSION, type: "hello" }, "*");
}

/** Start (or restart) the periodic hello announcement. */
function startHelloAnnouncements() {
  postHello();
  helloTimer = setInterval(() => {
    if (helloAcked) {
      stopHelloAnnouncements();
      return;
    }
    postHello();
  }, HELLO_INTERVAL_MS);
}

function stopHelloAnnouncements() {
  if (helloTimer !== null) {
    clearInterval(helloTimer);
    helloTimer = null;
  }
}

function isProtocolMessage(data) {
  return Boolean(data) && data.source === SOURCE_PEER && data.v === PROTOCOL_VERSION;
}

/** Build the compact single-line summary shown in the OBR notification. */
function formatRoll(roll) {
  const { character, summary, formula, rolls, total, description } = roll;
  let line = `${character} rolls ${summary}`;

  if (formula) {
    line += `: ${formula}`;
  }

  const hasRolls = Array.isArray(rolls) && rolls.length > 0;
  const hasTotal = typeof total === "number";

  if (hasRolls) {
    line += ` → [${rolls.join(", ")}]`;
    if (hasTotal) {
      const modifier = total - rolls.reduce((sum, value) => sum + value, 0);
      if (modifier !== 0) {
        line += ` ${modifier > 0 ? "+" : "-"}${Math.abs(modifier)}`;
      }
      line += ` = ${total}`;
    }
  } else if (hasTotal) {
    line += ` = ${total}`;
  }

  if (description) {
    const truncated =
      description.length > MAX_DESCRIPTION_LENGTH
        ? `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`
        : description;
    line += ` — ${truncated}`;
  }

  return line;
}

/** Show a roll as a local OBR notification. Assumes the caller has
 * already decided the roll is visible to this player. */
function displayRoll(roll) {
  if (!roll) {
    return;
  }
  OBR.notification.show(formatRoll(roll)).catch((error) => {
    console.error("[vtt-bridge] failed to show notification", error);
  });
}

/**
 * Handle a roll that originated from *this* browser (relayed by the VTT
 * Bridge content script running in this same tab). Because the content
 * script only ever sees rolls made by the local Dungeon Master's Vault
 * user, this client is by definition "the roller" for these messages --
 * so it always displays them locally, regardless of the `visible` flag,
 * and then broadcasts them to the rest of the room so other clients can
 * apply their own visibility rules.
 */
async function handleLocalRoll(roll) {
  await whenReady;
  displayRoll(roll);
  try {
    // "REMOTE" sends only to other room members, not back to this
    // client -- we already displayed it locally above, so echoing it
    // back through the broadcast channel would show it twice.
    await OBR.broadcast.sendMessage(ROLL_CHANNEL, roll, { destination: "REMOTE" });
  } catch (error) {
    console.error("[vtt-bridge] failed to broadcast roll", error);
  }
}

/**
 * Handle a roll broadcast by another room member's client. Hidden rolls
 * (`visible === false`) are only shown here if the local player is the
 * GM; the roller's own client already displayed the roll via
 * handleLocalRoll and does not receive its own broadcast (see
 * "REMOTE" above).
 */
async function handleRemoteRoll(roll) {
  await whenReady;
  if (roll && roll.visible === false) {
    try {
      const role = await OBR.player.getRole();
      if (role !== "GM") {
        return;
      }
    } catch (error) {
      console.error("[vtt-bridge] failed to read player role", error);
      return;
    }
  }
  displayRoll(roll);
}

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!isProtocolMessage(data)) {
    return;
  }
  if (data.type === "hello-ack") {
    helloAcked = true;
    stopHelloAnnouncements();
    return;
  }
  if (data.type === "roll" && data.roll) {
    handleLocalRoll(data.roll);
  }
});

OBR.onReady(() => {
  OBR.broadcast.onMessage(ROLL_CHANNEL, (event) => {
    handleRemoteRoll(event.data);
  });
  resolveReady();
});

startHelloAnnouncements();
