import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";
import { buildDerivedCompositeRiskSource } from "../src/importers/derived-composite-risk.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputDir: path.resolve(process.cwd(), "custom", "sources"),
    outputFile: path.resolve(
      process.cwd(),
      "custom",
      "sources",
      "derived-composite-risk.json",
    ),
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-dir") {
      options.inputDir = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--output-file") {
      options.outputFile = path.resolve(
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
  const sources = loadSourcesFromDirectory(
    pathToFileURL(`${options.inputDir}/`),
  );
  const source = buildDerivedCompositeRiskSource({ sources });
  writeSourceFile(options.outputFile, source);
  console.log(
    `Wrote ${options.outputFile} (${source.compositeRules.length} composite rules)`,
  );
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
