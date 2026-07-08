import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    // owlbear-extension/ is a separate sub-package (its own package.json,
    // node_modules, and esbuild bundle output) owned by a different agent,
    // with its own tooling -- not this project's lint surface.
    ignores: [".output/**", ".wxt/**", "node_modules/**", "owlbear-extension/**"],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      },
    },
  },
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
  {
    // Playwright config and the e2e suite run under Node, not a browser --
    // except for the odd callback (see stale-queue.spec.js) evaluated
    // in-page/in-worker, which needs the webextension globals too.
    files: ["playwright.config.js", "tests/e2e/**/*.js", "scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.webextensions,
      },
    },
  },
  prettier,
];
