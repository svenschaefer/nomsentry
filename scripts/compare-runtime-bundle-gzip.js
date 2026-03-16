import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { loadRuntimeBundleGzipFromFile } from "../src/loaders/runtime-bundle-gzip.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    jsonFile: path.resolve(process.cwd(), "dist", "runtime-sources.json"),
    gzipFile: path.resolve(process.cwd(), "dist", "runtime-sources.json.gz"),
    iterations: 3,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--json-file") {
      options.jsonFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--gzip-file") {
      options.gzipFile = path.resolve(
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
  if (!fs.existsSync(options.gzipFile)) {
    throw new Error(
      `Missing gzip bundle: ${options.gzipFile}. Run npm run build:runtime-sources:gzip first.`,
    );
  }

  const jsonSize = fs.statSync(options.jsonFile).size;
  const gzipSize = fs.statSync(options.gzipFile).size;

  const jsonLoad = measure(
    () => loadRuntimeBundleFromFile(pathToFileURL(options.jsonFile)),
    options.iterations,
  );
  const gzipLoad = measure(
    () => loadRuntimeBundleGzipFromFile(pathToFileURL(options.gzipFile)),
    options.iterations,
  );

  const jsonRules = jsonLoad.result.rules.length;
  const gzipRules = gzipLoad.result.rules.length;
  const jsonComposite = jsonLoad.result.compositeRules.length;
  const gzipComposite = gzipLoad.result.compositeRules.length;

  const sameShape = jsonRules === gzipRules && jsonComposite === gzipComposite;

  console.log(
    JSON.stringify(
      {
        id: "runtime-bundle-gzip-compare",
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
        gzip: {
          file: path
            .relative(process.cwd(), options.gzipFile)
            .replace(/\\/g, "/"),
          bytes: gzipSize,
          avgLoadMs: Number(gzipLoad.avgMs.toFixed(3)),
          rules: gzipRules,
          compositeRules: gzipComposite,
        },
        delta: {
          bytes: gzipSize - jsonSize,
          bytesPct: Number(
            (((gzipSize - jsonSize) / jsonSize) * 100).toFixed(3),
          ),
          avgLoadMs: Number((gzipLoad.avgMs - jsonLoad.avgMs).toFixed(3)),
        },
        compatible: sameShape,
      },
      null,
      2,
    ),
  );

  if (!sameShape) {
    throw new Error(
      "Format compare failed: JSON and gzip runtime bundles differ",
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
