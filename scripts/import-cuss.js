import fs from "node:fs";
import path from "node:path";
import { buildCussSource, getCussLanguages } from "../src/importers/cuss.js";

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    languages: ["all"],
    outputDir: path.resolve(process.cwd(), "custom", "sources"),
    minRating: 1
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
    } else if (token === "--min-rating") {
      options.minRating = Number(args.shift() || "1");
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(options.outputDir, { recursive: true });
const languages = options.languages.includes("all") ? getCussLanguages() : options.languages;

for (const language of languages) {
  const source = buildCussSource({ language, minRating: options.minRating });
  const targetFile = path.join(options.outputDir, `cuss-${language}.json`);
  fs.writeFileSync(targetFile, `${JSON.stringify(source, null, 2)}\n`, "utf8");
  console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
}
