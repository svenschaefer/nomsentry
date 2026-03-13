import fs from "node:fs";
import path from "node:path";
import { build2ToadSource, get2ToadLanguages } from "../src/importers/toad-profanity.js";

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    languages: ["all"],
    outputDir: path.resolve(process.cwd(), "custom", "sources")
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--languages") {
      options.languages = String(args.shift() || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (token === "--output-dir") {
      options.outputDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(options.outputDir, { recursive: true });
const languages = options.languages.includes("all") ? get2ToadLanguages() : options.languages;

for (const language of languages) {
  const source = build2ToadSource({ language });
  const targetFile = path.join(options.outputDir, `2toad-profanity-${language}.json`);
  fs.writeFileSync(targetFile, `${JSON.stringify(source, null, 2)}\n`, "utf8");
  console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
}
