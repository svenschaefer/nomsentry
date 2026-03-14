import fs from "node:fs";
import path from "node:path";
import {
  buildInsultWikiSource,
  fetchInsultWikiTerms,
  getInsultWikiLanguages
} from "../src/importers/insult-wiki.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export function parseArgs(argv) {
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

  if (options.languages.length === 0) {
    throw new Error("Invalid option: --languages must include at least one language or 'all'");
  }

  return options;
}

async function main(argv) {
  const options = parseArgs(argv);
  fs.mkdirSync(options.outputDir, { recursive: true });
  const languages = options.languages.includes("all") ? getInsultWikiLanguages() : options.languages;

  for (const language of languages) {
    const terms = await fetchInsultWikiTerms(language);
    const source = buildInsultWikiSource({ language, terms });
    const targetFile = path.join(options.outputDir, `insult-wiki-${language}.json`);
    writeSourceFile(targetFile, source);
    console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
  }
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
