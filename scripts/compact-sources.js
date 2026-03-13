import fs from "node:fs";
import path from "node:path";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";
import { writeSourceFile } from "../src/schema/source-io.js";

const outputDir = path.resolve(process.cwd(), "custom", "sources");
const sources = loadSourcesFromDirectory(new URL("../custom/sources/", import.meta.url));

for (const file of fs.readdirSync(outputDir)) {
  if (file.endsWith(".json")) {
    fs.unlinkSync(path.join(outputDir, file));
  }
}

for (const source of sources) {
  const normalizedId = source.id
    .replace(/^imported-/, "")
    .replace(/^derived-/, "derived-")
    .replace(/^[^/]+$/, source.id);
  let filename = `${normalizedId}.json`;

  if (source.id.startsWith("imported-ldnoobw-")) filename = `${source.id.replace("imported-", "")}.json`;
  else if (source.id.startsWith("imported-2toad-profanity-")) filename = `${source.id.replace("imported-", "")}.json`;
  else if (source.id.startsWith("imported-cuss-")) filename = `${source.id.replace("imported-", "")}.json`;
  else if (source.id.startsWith("imported-dsojevic-en")) filename = "dsojevic-profanity-en.json";
  else if (source.id === "imported-obscenity-en") filename = "obscenity-en.json";
  else if (source.id.startsWith("derived-uspto-brand-risk-")) filename = `${source.id}.json`;
  else if (source.id === "imported-rfc2142-role-mailboxes") filename = "rfc2142-role-mailboxes.json";
  else if (source.id === "imported-windows-reserved-device-names") filename = "windows-reserved-device-names.json";

  writeSourceFile(path.join(outputDir, filename), source);
  console.log(`Wrote ${filename} (${source.rules?.length ?? 0} rules)`);
}
