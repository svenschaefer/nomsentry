import fs from "node:fs";
import path from "node:path";
import {
  buildUsptoTrademarkSourceFromCsvFile,
  splitUsptoTrademarkSource
} from "../src/importers/uspto.js";
import { writeSourceFile } from "../src/schema/source-io.js";

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputFile: "",
    outputDir: path.resolve(process.cwd(), "data", "uspto", "full-sources"),
    chunkSize: 5000
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-file") {
      options.inputFile = path.resolve(process.cwd(), String(args.shift() || ""));
    } else if (token === "--output-dir") {
      options.outputDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else if (token === "--chunk-size") {
      options.chunkSize = Number.parseInt(String(args.shift() || ""), 10);
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  if (!options.inputFile) {
    throw new Error("Missing required option: --input-file <path-to-uspto-case-file-csv>");
  }
  if (!Number.isInteger(options.chunkSize) || options.chunkSize < 1) {
    throw new Error("Invalid option: --chunk-size must be a positive integer");
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(options.outputDir, { recursive: true });
const source = await buildUsptoTrademarkSourceFromCsvFile(options.inputFile);
const chunkFiles = splitUsptoTrademarkSource(source, { chunkSize: options.chunkSize });

for (const file of fs.readdirSync(options.outputDir)) {
  if (file.startsWith("uspto-trademarks-") && file.endsWith(".json")) {
    fs.unlinkSync(path.join(options.outputDir, file));
  }
}

for (const chunk of chunkFiles) {
  const targetFile = path.join(options.outputDir, `${chunk.id}.json`);
  writeSourceFile(targetFile, chunk);
}

console.log(`Wrote ${chunkFiles.length} files (${source.rules.length} terms total)`);
