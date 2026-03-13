import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLdnoobwSource, parseLdnoobwWordList } from "../src/importers/ldnoobw.js";

const DEFAULT_LANGUAGES = ["en"];
const RAW_BASE_URL = "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master";

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    languages: DEFAULT_LANGUAGES,
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

  for (const language of options.languages) {
    const { terms, sourceUrl } = await fetchWordList(language);
    const source = buildLdnoobwSource({
      id: `imported-ldnoobw-${language}`,
      language,
      terms,
      sourceUrl
    });
    const targetFile = path.join(options.outputDir, `ldnoobw-${language}.json`);
    fs.writeFileSync(targetFile, `${JSON.stringify(source, null, 2)}\n`, "utf8");
    console.log(`Wrote ${targetFile} (${terms.length} terms)`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
