// Self-contained build script for the Owlbear Rodeo room extension.
// Bundles src/background.js with esbuild and copies the static public/
// assets (manifest.json, background.html, icon.png) into dist/, which is
// what gets published to GitHub Pages by .github/workflows/pages.yml.
//
// Deliberately dependency-free beyond esbuild and Node's own builtins so
// this can run in isolation from the root project's tooling.
import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDir = path.join(root, "dist");
const publicDir = path.join(root, "public");
const entryPoint = path.join(root, "src", "background.js");

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // Copy manifest.json, background.html, and icon.png as-is -- they need
  // no transformation, just to end up alongside the built bundle.
  await cp(publicDir, outDir, { recursive: true });

  await build({
    entryPoints: [entryPoint],
    outfile: path.join(outDir, "background.js"),
    bundle: true,
    format: "esm",
    target: "es2020",
    sourcemap: true,
    logLevel: "info",
  });

  console.log(`Built owlbear-extension into ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  throw error;
});
