import fs from "node:fs";
import path from "node:path";
import { buildUsptoTrademarkSource, loadUsptoCaseFileCsv } from "../src/importers/uspto.js";

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputFile: "",
    outputDir: path.resolve(process.cwd(), "custom", "sources")
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-file") {
      options.inputFile = path.resolve(process.cwd(), String(args.shift() || ""));
    } else if (token === "--output-dir") {
      options.outputDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  if (!options.inputFile) {
    throw new Error("Missing required option: --input-file <path-to-uspto-case-file-csv>");
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(options.outputDir, { recursive: true });
const records = loadUsptoCaseFileCsv(options.inputFile);
const source = buildUsptoTrademarkSource(records);
const targetFile = path.join(options.outputDir, "uspto-trademarks.json");
fs.writeFileSync(targetFile, `${JSON.stringify(source, null, 2)}\n`, "utf8");
console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
