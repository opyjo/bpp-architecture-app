// Copies PGlite's browser runtime into public/pglite/ so the SQL playground
// can import it at runtime, bypassing the bundler. Turbopack's production
// build mangles PGlite's Emscripten loader ("instantiateWasm is not a
// function"), so the package must not be bundled. Runs via predev/prebuild.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "node_modules", "@electric-sql", "pglite", "dist");
const dest = join(root, "public", "pglite");

mkdirSync(join(dest, "fs"), { recursive: true });

const wanted = (name) =>
  name === "index.js" ||
  name.startsWith("chunk-") && name.endsWith(".js") ||
  name === "pglite.wasm" ||
  name === "pglite.data" ||
  name === "initdb.wasm";

let count = 0;
for (const name of readdirSync(src)) {
  if (wanted(name)) {
    copyFileSync(join(src, name), join(dest, name));
    count++;
  }
}
for (const name of readdirSync(join(src, "fs"))) {
  if (name.endsWith(".js")) {
    copyFileSync(join(src, "fs", name), join(dest, "fs", name));
    count++;
  }
}
console.log(`copy-pglite: copied ${count} files to public/pglite/`);
