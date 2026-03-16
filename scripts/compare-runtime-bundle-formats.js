import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { loadRuntimeBundleBinaryFromFile } from "../src/loaders/runtime-bundle-binary.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    jsonFile: path.resolve(process.cwd(), "dist", "runtime-sources.json"),
    binaryFile: path.resolve(process.cwd(), "dist", "runtime-sources.bin"),
    iterations: 3,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--json-file") {
      options.jsonFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--binary-file") {
      options.binaryFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--iterations") {
      options.iterations = Number.parseInt(String(args.shift() || ""), 10);
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  if (!Number.isInteger(options.iterations) || options.iterations <= 0) {
    throw new Error("Invalid --iterations: must be a positive integer");
  }

  return options;
}

function measure(fn, iterations) {
  const samples = [];
  let result = null;
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    result = fn();
    samples.push(performance.now() - start);
  }
  const avg = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  return { avgMs: avg, result };
}

function main(argv) {
  const options = parseArgs(argv);
  if (!fs.existsSync(options.jsonFile)) {
    throw new Error(`Missing JSON bundle: ${options.jsonFile}`);
  }
  if (!fs.existsSync(options.binaryFile)) {
    throw new Error(
      `Missing binary bundle: ${options.binaryFile}. Run npm run build:runtime-sources:binary first.`,
    );
  }

  const jsonSize = fs.statSync(options.jsonFile).size;
  const binarySize = fs.statSync(options.binaryFile).size;

  const jsonLoad = measure(
    () => loadRuntimeBundleFromFile(pathToFileURL(options.jsonFile)),
    options.iterations,
  );
  const binaryLoad = measure(
    () => loadRuntimeBundleBinaryFromFile(pathToFileURL(options.binaryFile)),
    options.iterations,
  );

  const jsonRules = jsonLoad.result.rules.length;
  const binaryRules = binaryLoad.result.rules.length;
  const jsonComposite = jsonLoad.result.compositeRules.length;
  const binaryComposite = binaryLoad.result.compositeRules.length;

  const sameShape =
    jsonRules === binaryRules && jsonComposite === binaryComposite;

  console.log(
    JSON.stringify(
      {
        id: "runtime-bundle-format-compare",
        version: 1,
        json: {
          file: path
            .relative(process.cwd(), options.jsonFile)
            .replace(/\\/g, "/"),
          bytes: jsonSize,
          avgLoadMs: Number(jsonLoad.avgMs.toFixed(3)),
          rules: jsonRules,
          compositeRules: jsonComposite,
        },
        binary: {
          file: path
            .relative(process.cwd(), options.binaryFile)
            .replace(/\\/g, "/"),
          bytes: binarySize,
          avgLoadMs: Number(binaryLoad.avgMs.toFixed(3)),
          rules: binaryRules,
          compositeRules: binaryComposite,
        },
        delta: {
          bytes: binarySize - jsonSize,
          bytesPct: Number(
            (((binarySize - jsonSize) / jsonSize) * 100).toFixed(3),
          ),
          avgLoadMs: Number((binaryLoad.avgMs - jsonLoad.avgMs).toFixed(3)),
        },
        compatible: sameShape,
      },
      null,
      2,
    ),
  );

  if (!sameShape) {
    throw new Error(
      "Format compare failed: JSON and binary runtime bundles differ",
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
