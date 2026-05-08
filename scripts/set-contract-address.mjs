import { readFile, writeFile } from "node:fs/promises";

const mainPath = new URL("../app/src/main.js", import.meta.url);
const address = process.argv[2];

if (!/^0x[a-fA-F0-9]{40}$/.test(address || "")) {
  throw new Error("Usage: npm run set:contract -- 0xYOUR_DEPLOYED_CONTRACT_ADDRESS");
}

const source = await readFile(mainPath, "utf8");
const updated = source.replace(/const contractAddress = "0x[a-fA-F0-9]*"|const contractAddress = ""/, `const contractAddress = "${address}"`);

if (updated === source) {
  throw new Error("Could not find contractAddress in app/src/main.js");
}

await writeFile(mainPath, updated);
console.log(`frontend contract address set to ${address}`);
