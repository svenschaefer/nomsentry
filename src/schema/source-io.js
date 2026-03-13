import fs from "node:fs";
import { compactSource } from "./source-format.js";

export function serializeSource(source) {
  return `${JSON.stringify(compactSource(source))}\n`;
}

export function writeSourceFile(path, source) {
  fs.writeFileSync(path, serializeSource(source), "utf8");
}
