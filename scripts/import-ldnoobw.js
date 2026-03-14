import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildLdnoobwSource, parseLdnoobwWordList } from "../src/importers/ldnoobw.js";
import { writeSourceFile } from "../src/schema/source-io.js";

const REPO_API_URL = "https://api.github.com/repos/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/contents";
const RAW_BASE_URL = "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master";
const IGNORED_FILES = new Set(["LICENSE", "README.md", "USERS.md"]);

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

  if (options.languages.length === 0) {
    throw new Error("Invalid option: --languages must include at least one language or 'all'");
  }

  return options;
}

export async function fetchAvailableLanguages(fetchImpl = fetch) {
  const response = await fetchImpl(REPO_API_URL, {
    headers: { "User-Agent": "nomsentry" }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${REPO_API_URL}: ${response.status} ${response.statusText}`);
  }

  const entries = await response.json();
  return entries
    .filter((entry) => entry.type === "file" && !IGNORED_FILES.has(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

export async function fetchWordList(language, fetchImpl = fetch) {
  const sourceUrl = `${RAW_BASE_URL}/${language}`;
  const response = await fetchImpl(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceUrl}: ${response.status} ${response.statusText}`);
  }

  return {
    language,
    sourceUrl,
    terms: parseLdnoobwWordList(await response.text())
  };
}

async function main(argv) {
  const options = parseArgs(argv);
  fs.mkdirSync(options.outputDir, { recursive: true });
  const languages = options.languages.includes("all")
    ? await fetchAvailableLanguages()
    : options.languages;

  for (const language of languages) {
    const { terms, sourceUrl } = await fetchWordList(language);
    const source = buildLdnoobwSource({
      id: `imported-ldnoobw-${language}`,
      language,
      terms,
      sourceUrl
    });
    const targetFile = path.join(options.outputDir, `ldnoobw-${language}.json`);
    writeSourceFile(targetFile, source);
    console.log(`Wrote ${targetFile} (${terms.length} terms)`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
