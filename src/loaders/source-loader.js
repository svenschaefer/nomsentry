import fs from "node:fs";
import { validateSource } from "../schema/validate-source.js";

export function loadSourceFromFile(path) {
  const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
  return validateSource(parsed);
}
