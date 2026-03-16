import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { benchmarkRuntime } from "./benchmark-runtime.js";

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function loadBenchmarkBudget(filePath) {
  const budget = loadJson(filePath);
  const limits = budget?.max;

  if (!limits || typeof limits !== "object") {
    throw new Error("Benchmark budget must define a max object");
  }

  for (const metric of [
    "bundleLoadMs",
    "engineCreateMs",
    "avgEvalMs",
    "p95EvalMs",
    "p99EvalMs",
  ]) {
    if (typeof limits[metric] !== "number" || limits[metric] <= 0) {
      throw new Error(
        `Benchmark budget is missing a positive max for ${metric}`,
      );
    }
  }

  return budget;
}

export function evaluateBenchmarkBudget(result, budget) {
  const failures = [];

  for (const [metric, max] of Object.entries(budget.max)) {
    if (result[metric] > max) {
      failures.push({
        metric,
        actual: result[metric],
        max,
      });
    }
  }

  return failures;
}

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    budgetFile: path.resolve(process.cwd(), "benchmark-budget.json"),
    bundleFile: path.resolve(process.cwd(), "dist", "runtime-sources.json.br"),
    iterations: 2000,
    warmupIterations: 200,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--budget-file") {
      options.budgetFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--bundle-file") {
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

export function checkRuntimeBenchmarkBudget(options) {
  const budget = loadBenchmarkBudget(options.budgetFile);
  const result = benchmarkRuntime(options);
  const failures = evaluateBenchmarkBudget(result, budget);

  if (failures.length > 0) {
    const detail = failures
      .map(
        ({ metric, actual, max }) =>
          `${metric} exceeded budget: actual=${actual} max=${max}`,
      )
      .join("\n");
    throw new Error(`Runtime benchmark budget check failed\n${detail}`);
  }

  console.log("Runtime benchmark budget check passed");
  console.log(JSON.stringify(result, null, 2));
}

function main(argv) {
  const options = parseArgs(argv);
  checkRuntimeBenchmarkBudget(options);
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
