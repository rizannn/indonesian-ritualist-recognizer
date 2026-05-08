import { build } from "esbuild";
import { dirname, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entrySource = await readFile(resolve(repoRoot, "scripts", "metamask-sdk-entry.js"), "utf8");

await build({
  absWorkingDir: repoRoot,
  bundle: true,
  format: "iife",
  globalName: "RIRMetaMaskSDKBundle",
  logLevel: "warning",
  minify: true,
  outfile: resolve(repoRoot, "app", "vendor", "metamask-sdk.bundle.js"),
  platform: "browser",
  stdin: {
    contents: entrySource,
    loader: "js",
    resolveDir: repoRoot,
    sourcefile: "metamask-sdk-entry.js"
  }
});
