import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function loadCoverageThresholds(filePath) {
  const thresholds = loadJson(filePath);

  if (!thresholds?.minimums || typeof thresholds.minimums !== "object") {
    throw new Error("Coverage thresholds file must define a minimums object");
  }

  return thresholds;
}

export function loadCoverageSummary(filePath) {
  const summary = loadJson(filePath);

  if (!summary?.total || typeof summary.total !== "object") {
    throw new Error("Coverage summary file must contain a total section");
  }

  return summary;
}

export function evaluateCoverageThresholds(summary, thresholds, repoRoot) {
  const failures = [];

  for (const [relativeFile, minimums] of Object.entries(thresholds.minimums)) {
    const absoluteFile = path.resolve(repoRoot, relativeFile);
    const coverage = summary[absoluteFile];

    if (!coverage) {
      failures.push({
        file: relativeFile,
        metric: "file",
        actual: "missing",
        minimum: "present",
      });
      continue;
    }

    for (const [metric, minimum] of Object.entries(minimums)) {
      const actual = coverage?.[metric]?.pct;
      if (typeof actual !== "number") {
        failures.push({
          file: relativeFile,
          metric,
          actual: "missing",
          minimum,
        });
        continue;
      }

      if (actual < minimum) {
        failures.push({
          file: relativeFile,
          metric,
          actual,
          minimum,
        });
      }
    }
  }

  return failures;
}

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    summaryFile: path.resolve(
      process.cwd(),
      "coverage",
      "coverage-summary.json",
    ),
    thresholdsFile: path.resolve(process.cwd(), "coverage-thresholds.json"),
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--summary-file") {
      options.summaryFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--thresholds-file") {
      options.thresholdsFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

export function checkCoverageThresholds(options) {
  const summary = loadCoverageSummary(options.summaryFile);
  const thresholds = loadCoverageThresholds(options.thresholdsFile);
  const failures = evaluateCoverageThresholds(
    summary,
    thresholds,
    process.cwd(),
  );

  if (failures.length > 0) {
    const detail = failures
      .map(
        ({ file, metric, actual, minimum }) =>
          `${file} ${metric} below threshold: actual=${actual} minimum=${minimum}`,
      )
      .join("\n");
    throw new Error(`Coverage threshold check failed\n${detail}`);
  }

  console.log("Coverage threshold check passed");
}

function main(argv) {
  const options = parseArgs(argv);
  checkCoverageThresholds(options);
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
