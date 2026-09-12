import { readFile, writeFile } from "node:fs/promises";

const appearanceFile = new URL("../lib/site-section-appearance.ts", import.meta.url);
const parchmentSwatch = '  { label: "Parchment", value: "#e1cca3" },';
const insertAfter = '  { label: "Cream", value: "#f9f4eb" },';

const source = await readFile(appearanceFile, "utf8");

if (!source.includes(parchmentSwatch)) {
  if (!source.includes(insertAfter)) {
    throw new Error("Could not locate the section editor brand swatch palette.");
  }

  await writeFile(
    appearanceFile,
    source.replace(insertAfter, `${insertAfter}\n${parchmentSwatch}`),
    "utf8",
  );
}
