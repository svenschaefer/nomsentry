import fs from "node:fs";
import path from "node:path";
import { buildLdnoobwSource, parseLdnoobwWordList } from "../src/importers/ldnoobw.js";
import { writeSourceFile } from "../src/schema/source-io.js";

const REPO_API_URL = "https://api.github.com/repos/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/contents";
const RAW_BASE_URL = "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master";
const IGNORED_FILES = new Set(["LICENSE", "README.md", "USERS.md"]);

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

async function fetchAvailableLanguages() {
  const response = await fetch(REPO_API_URL, {
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

async function fetchWordList(language) {
  const sourceUrl = `${RAW_BASE_URL}/${language}`;
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceUrl}: ${response.status} ${response.statusText}`);
  }

  return {
    language,
    sourceUrl,
    terms: parseLdnoobwWordList(await response.text())
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
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

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
