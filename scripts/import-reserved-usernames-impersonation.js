import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildReservedUsernamesImpersonationSource } from "../src/importers/reserved-usernames-impersonation.js";
import { loadReservedUsernamesTerms } from "../src/importers/reserved-usernames.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    baseDir: process.cwd(),
    outputDir: path.resolve(process.cwd(), "custom", "sources"),
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--base-dir") {
      options.baseDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else if (token === "--output-dir") {
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
  const source = buildReservedUsernamesImpersonationSource({
    terms: loadReservedUsernamesTerms(options.baseDir),
  });
  const targetFile = path.join(
    options.outputDir,
    "reserved-usernames-impersonation.json",
  );
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
