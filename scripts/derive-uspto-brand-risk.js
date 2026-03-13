import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  deriveUsptoBrandRiskSource,
  splitUsptoTrademarkSource
} from "../src/importers/uspto.js";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputDir: path.resolve(process.cwd(), "data", "uspto", "full-sources"),
    outputDir: path.resolve(process.cwd(), "custom", "sources"),
    chunkSize: 5000,
    singleWordMinLength: 12,
    multiWordMinTokenLength: 6,
    maxWords: 2,
    allowDigits: false
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-dir") {
      options.inputDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else if (token === "--output-dir") {
      options.outputDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else if (token === "--chunk-size") {
      options.chunkSize = Number.parseInt(String(args.shift() || ""), 10);
    } else if (token === "--single-word-min-length") {
      options.singleWordMinLength = Number.parseInt(String(args.shift() || ""), 10);
    } else if (token === "--multi-word-min-token-length") {
      options.multiWordMinTokenLength = Number.parseInt(String(args.shift() || ""), 10);
    } else if (token === "--max-words") {
      options.maxWords = Number.parseInt(String(args.shift() || ""), 10);
    } else if (token === "--allow-digits") {
      options.allowDigits = true;
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

function mergeSources(sources, id) {
  const merged = sources.flatMap((source) => source.rules);
  if (sources.length === 0) {
    throw new Error("No USPTO full-source JSON files found in input directory");
  }

  return {
    ...sources[0],
    id,
    description: "Merged USPTO live standard-character trademarks and service marks",
    rules: merged
  };
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(options.outputDir, { recursive: true });

const fullSources = loadSourcesFromDirectory(pathToFileURL(`${options.inputDir}${path.sep}`)).filter(
  (source) => source.id.startsWith("imported-uspto-trademarks-")
);
const mergedFullSource = mergeSources(fullSources, "imported-uspto-trademarks-full");
const derived = deriveUsptoBrandRiskSource(mergedFullSource, {
  singleWordMinLength: options.singleWordMinLength,
  multiWordMinTokenLength: options.multiWordMinTokenLength,
  maxWords: options.maxWords,
  allowDigits: options.allowDigits
});
const chunks = splitUsptoTrademarkSource(derived, { chunkSize: options.chunkSize });

for (const file of fs.readdirSync(options.outputDir)) {
  if (file.startsWith("derived-uspto-brand-risk-") && file.endsWith(".json")) {
    fs.unlinkSync(path.join(options.outputDir, file));
  }
}

for (const chunk of chunks) {
  const targetFile = path.join(options.outputDir, `${chunk.id}.json`);
  fs.writeFileSync(targetFile, `${JSON.stringify(chunk, null, 2)}\n`, "utf8");
}

console.log(`Wrote ${chunks.length} files (${derived.rules.length} terms total)`);
