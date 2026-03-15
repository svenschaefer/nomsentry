import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { createEngine } from "../src/core/evaluate.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";
import { tenantName, tenantSlug, username } from "../src/policies/index.js";

function loadJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8"),
  );
}

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    bundleFile: path.resolve(process.cwd(), "dist", "runtime-sources.json"),
    iterations: 2000,
    warmupIterations: 200,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--bundle-file") {
      options.bundleFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--iterations") {
      options.iterations = Number(args.shift() || "0");
    } else if (token === "--warmup-iterations") {
      options.warmupIterations = Number(args.shift() || "0");
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  if (!Number.isInteger(options.iterations) || options.iterations <= 0) {
    throw new Error("Invalid option: --iterations must be a positive integer");
  }
  if (
    !Number.isInteger(options.warmupIterations) ||
    options.warmupIterations < 0
  ) {
    throw new Error(
      "Invalid option: --warmup-iterations must be a non-negative integer",
    );
  }

  return options;
}

function collectBenchmarkCases() {
  const fromBasicFixtures = ["allow", "reject", "review"]
    .flatMap((name) => loadJson(`test/fixtures/${name}.json`))
    .map((entry) => ({ kind: entry.kind, value: entry.value }));

  const fromCatalogFixtures = [
    "catalog-maintained-positives",
    "catalog-maintained-false-positives",
    "catalog-maintained-obfuscated-positives",
    "catalog-maintained-mixed-script",
    "catalog-documented-non-goals-and-future-gaps",
  ]
    .flatMap((name) => loadJson(`test/fixtures/${name}.json`))
    .flatMap((group) =>
      group.values.map((value) => ({ kind: group.kind, value })),
    );

  const deduped = new Map();
  for (const entry of [...fromBasicFixtures, ...fromCatalogFixtures]) {
    const key = `${entry.kind}:${entry.value}`;
    if (!deduped.has(key)) deduped.set(key, entry);
  }

  return Array.from(deduped.values());
}

function percentile(sorted, ratio) {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(sorted.length * ratio)),
  );
  return sorted[index];
}

export function benchmarkRuntime({ bundleFile, iterations, warmupIterations }) {
  const bundleLoadStart = performance.now();
  const bundle = loadRuntimeBundleFromFile(pathToFileURL(bundleFile));
  const bundleLoadMs = performance.now() - bundleLoadStart;

  const engineCreateStart = performance.now();
  const engine = createEngine({
    sources: [bundle],
    policies: [username(), tenantSlug(), tenantName()],
  });
  const engineCreateMs = performance.now() - engineCreateStart;

  const cases = collectBenchmarkCases();

  for (let index = 0; index < warmupIterations; index += 1) {
    const current = cases[index % cases.length];
    engine.evaluate(current);
  }

  const timings = [];
  const evalStart = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    const current = cases[index % cases.length];
    const start = performance.now();
    engine.evaluate(current);
    timings.push(performance.now() - start);
  }
  const totalEvalMs = performance.now() - evalStart;
  timings.sort((left, right) => left - right);

  return {
    id: "runtime-benchmark",
    version: 1,
    benchmarkCases: cases.length,
    iterations,
    warmupIterations,
    bundleLoadMs,
    engineCreateMs,
    totalEvalMs,
    avgEvalMs: totalEvalMs / iterations,
    p50EvalMs: percentile(timings, 0.5),
    p95EvalMs: percentile(timings, 0.95),
    p99EvalMs: percentile(timings, 0.99),
  };
}

function main(argv) {
  const options = parseArgs(argv);
  const result = benchmarkRuntime(options);
  console.log(JSON.stringify(result, null, 2));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
