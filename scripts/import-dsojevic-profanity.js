import fs from "node:fs";
import path from "node:path";
import { buildDsojevicSource } from "../src/importers/dsojevic-profanity.js";
import { writeSourceFile } from "../src/schema/source-io.js";

const BASE_URL = "https://raw.githubusercontent.com/dsojevic/profanity-list/main";

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    languages: ["en"],
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

async function fetchLanguage(language) {
  const url = `${BASE_URL}/${language}.json`;
  const response = await fetch(url, { headers: { "User-Agent": "nomsentry" } });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(options.outputDir, { recursive: true });

for (const language of options.languages) {
  const entries = await fetchLanguage(language);
  const source = buildDsojevicSource({ language, entries });
  const targetFile = path.join(options.outputDir, `dsojevic-profanity-${language}.json`);
  writeSourceFile(targetFile, source);
  console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
}
