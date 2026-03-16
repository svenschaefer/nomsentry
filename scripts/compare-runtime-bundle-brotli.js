import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { loadRuntimeBundleBrotliFromFile } from "../src/loaders/runtime-bundle-brotli.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    jsonFile: path.resolve(process.cwd(), "dist", "runtime-sources.json"),
    brotliFile: path.resolve(process.cwd(), "dist", "runtime-sources.json.br"),
    iterations: 3,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--json-file") {
      options.jsonFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--brotli-file") {
      options.brotliFile = path.resolve(
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
  if (!fs.existsSync(options.brotliFile)) {
    throw new Error(
      `Missing brotli bundle: ${options.brotliFile}. Run npm run build:runtime-sources:brotli first.`,
    );
  }

  const jsonSize = fs.statSync(options.jsonFile).size;
  const brotliSize = fs.statSync(options.brotliFile).size;

  const jsonLoad = measure(
    () => loadRuntimeBundleFromFile(pathToFileURL(options.jsonFile)),
    options.iterations,
  );
  const brotliLoad = measure(
    () => loadRuntimeBundleBrotliFromFile(pathToFileURL(options.brotliFile)),
    options.iterations,
  );

  const jsonRules = jsonLoad.result.rules.length;
  const brotliRules = brotliLoad.result.rules.length;
  const jsonComposite = jsonLoad.result.compositeRules.length;
  const brotliComposite = brotliLoad.result.compositeRules.length;

  const sameShape =
    jsonRules === brotliRules && jsonComposite === brotliComposite;

  console.log(
    JSON.stringify(
      {
        id: "runtime-bundle-brotli-compare",
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
        brotli: {
          file: path
            .relative(process.cwd(), options.brotliFile)
            .replace(/\\/g, "/"),
          bytes: brotliSize,
          avgLoadMs: Number(brotliLoad.avgMs.toFixed(3)),
          rules: brotliRules,
          compositeRules: brotliComposite,
        },
        delta: {
          bytes: brotliSize - jsonSize,
          bytesPct: Number(
            (((brotliSize - jsonSize) / jsonSize) * 100).toFixed(3),
          ),
          avgLoadMs: Number((brotliLoad.avgMs - jsonLoad.avgMs).toFixed(3)),
        },
        compatible: sameShape,
      },
      null,
      2,
    ),
  );

  if (!sameShape) {
    throw new Error(
      "Format compare failed: JSON and brotli runtime bundles differ",
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
