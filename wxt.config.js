import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  publicDir: "src/public",
  manifestVersion: 3, // Manifest V3 for every target browser, including Firefox.
  manifest: ({ browser }) => ({
    name: "VTT Bridge",
    description: "Connect Dungeon Master's Vault to Roll20.",
    permissions: ["storage"],
    // Firefox-only: required for MV3 and used to track the extension across updates.
    // The gecko id is provisional pending the store-ownership decision in ROADMAP.md §4.1.
    browser_specific_settings:
      browser === "firefox"
        ? {
            gecko: {
              id: "vtt-bridge@dungeonmastersvault.com",
              // Firefox 140 (ESR, mid-2025) is the oldest version that understands
              // data_collection_permissions below; storage.session needs only 115.
              strict_min_version: "140.0",
              // AMO requires this declaration for new submissions since Nov 2025.
              // VTT Bridge does not collect, store, or transmit any data.
              data_collection_permissions: { required: ["none"] },
            },
            // Firefox for Android gained data_collection_permissions support in 142.
            gecko_android: {
              strict_min_version: "142.0",
            },
          }
        : undefined,
  }),
  webExt: {
    startUrls: ["https://www.dungeonmastersvault.com/pages/dnd/5e/characters", "https://app.roll20.net"],
  },
});
