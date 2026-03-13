import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSource } from "../schema/validate-source.js";

export function loadSourceFromFile(path) {
  const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
  return validateSource(parsed);
}

export function loadSourcesFromDirectory(dirPath) {
  const directoryUrl = dirPath instanceof URL ? dirPath : new URL(dirPath, import.meta.url);
  const directoryPath = directoryUrl.protocol === "file:" ? fileURLToPath(directoryUrl) : dirPath;
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json")
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => loadSourceFromFile(new URL(entry.name, directoryUrl)));
}
