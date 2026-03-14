import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildIcannReservedNamesSource,
  fetchIcannReservedNames,
} from "../src/importers/icann-reserved-names.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    outputDir: path.resolve(process.cwd(), "custom", "sources"),
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--output-dir") {
      options.outputDir = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

async function main(argv) {
  const options = parseArgs(argv);
  fs.mkdirSync(options.outputDir, { recursive: true });
  const source = buildIcannReservedNamesSource({
    terms: await fetchIcannReservedNames(),
  });
  const targetFile = path.join(options.outputDir, "icann-reserved-names.json");
  writeSourceFile(targetFile, source);
  console.log(`Wrote ${targetFile} (${source.rules.length} rules)`);
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
