import fs from "node:fs";
import path from "node:path";
import { buildObscenityEnglishSource } from "../src/importers/obscenity.js";

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    outputDir: path.resolve(process.cwd(), "custom", "sources")
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--output-dir") {
      options.outputDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(options.outputDir, { recursive: true });
const source = buildObscenityEnglishSource();
const targetFile = path.join(options.outputDir, "obscenity-en.json");
fs.writeFileSync(targetFile, `${JSON.stringify(source, null, 2)}\n`, "utf8");
console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
