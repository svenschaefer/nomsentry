import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildDsojevicSource } from "../src/importers/dsojevic-profanity.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export const BASE_URL =
  "https://raw.githubusercontent.com/dsojevic/profanity-list/main";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    languages: ["en"],
    outputDir: path.resolve(process.cwd(), "custom", "sources"),
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
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  if (options.languages.length === 0) {
    throw new Error(
      "Invalid option: --languages must include at least one language",
    );
  }

  return options;
}

export async function fetchLanguage(language, fetchImpl = fetch) {
  const url = `${BASE_URL}/${language}.json`;
  const response = await fetchImpl(url, {
    headers: { "User-Agent": "nomsentry" },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

async function main(argv) {
  const options = parseArgs(argv);
  fs.mkdirSync(options.outputDir, { recursive: true });

  for (const language of options.languages) {
    const entries = await fetchLanguage(language);
    const source = buildDsojevicSource({ language, entries });
    const targetFile = path.join(
      options.outputDir,
      `dsojevic-profanity-${language}.json`,
    );
    writeSourceFile(targetFile, source);
    console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
