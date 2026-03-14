import fs from "node:fs";
import path from "node:path";
import { buildObscenityEnglishSource } from "../src/importers/obscenity.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    outputDir: path.resolve(process.cwd(), "custom", "sources")
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--output-dir") {
      options.outputDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

function main(argv) {
  const options = parseArgs(argv);
  fs.mkdirSync(options.outputDir, { recursive: true });
  const source = buildObscenityEnglishSource();
  const targetFile = path.join(options.outputDir, "obscenity-en.json");
  writeSourceFile(targetFile, source);
  console.log(`Wrote ${targetFile} (${source.rules.length} terms)`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
