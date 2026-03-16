import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { encodeRuntimeBundleBinary } from "../src/loaders/runtime-bundle-binary.js";
import { buildRuntimeBundleFromDirectory } from "./build-runtime-sources.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputDir: path.resolve(process.cwd(), "custom", "sources"),
    outputFile: path.resolve(process.cwd(), "dist", "runtime-sources.bin"),
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

function writeBinaryAtomic(outputFile, data) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  const tempFile = `${outputFile}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempFile, data);
  fs.renameSync(tempFile, outputFile);
}

function main(argv) {
  const options = parseArgs(argv);
  const bundle = buildRuntimeBundleFromDirectory(options.inputDir);
  const encoded = encodeRuntimeBundleBinary(bundle);
  writeBinaryAtomic(options.outputFile, encoded);
  console.log(
    `Wrote ${options.outputFile} (${bundle.rules.length} rules, ${bundle.compositeRules.length} composite rules, ${encoded.length} bytes)`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
