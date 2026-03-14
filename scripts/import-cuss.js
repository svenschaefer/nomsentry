import fs from "node:fs";
import path from "node:path";
import { buildCussSource, getCussLanguages } from "../src/importers/cuss.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    languages: ["all"],
    outputDir: path.resolve(process.cwd(), "custom", "sources"),
    minRating: 1,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--languages") {
      options.languages = String(args.shift() || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (token === "--output-dir") {
      options.outputDir = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--min-rating") {
      options.minRating = Number(args.shift() || "1");
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  if (options.languages.length === 0) {
    throw new Error(
      "Invalid option: --languages must include at least one language or 'all'",
    );
  }
  if (!Number.isFinite(options.minRating)) {
    throw new Error("Invalid option: --min-rating must be a finite number");
  }

  return options;
}

function main(argv) {
  const options = parseArgs(argv);
  fs.mkdirSync(options.outputDir, { recursive: true });
  const languages = options.languages.includes("all")
    ? getCussLanguages()
    : options.languages;

  for (const language of languages) {
    const source = buildCussSource({ language, minRating: options.minRating });
    const targetFile = path.join(options.outputDir, `cuss-${language}.json`);
    writeSourceFile(targetFile, source);
    console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
