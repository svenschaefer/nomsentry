import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createEngine } from "../src/core/evaluate.js";
import { loadRuntimeBundleAutoFromFile } from "../src/loaders/runtime-bundle-auto.js";
import { tenantName, tenantSlug, username } from "../src/policies/index.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    bundleFile: path.resolve(process.cwd(), "dist", "runtime-sources.json.br"),
    fixtureFile: path.resolve(
      process.cwd(),
      "test",
      "fixtures",
      "brand-profile-calibration.json",
    ),
    outputFile: path.resolve(
      process.cwd(),
      "docs",
      "generated",
      "brand-profile-calibration-report.json",
    ),
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--bundle-file") {
      options.bundleFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--fixture-file") {
      options.fixtureFile = path.resolve(
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

export function loadCalibrationFixture(fixtureFile) {
  return JSON.parse(fs.readFileSync(fixtureFile, "utf8"));
}

export function evaluateBrandProfile({ bundleFile, fixtureFile }) {
  const bundle = loadRuntimeBundleAutoFromFile(bundleFile);
  const engine = createEngine({
    sources: [bundle],
    policies: [username(), tenantSlug(), tenantName()],
  });
  const groups = loadCalibrationFixture(fixtureFile);
  const cases = groups.flatMap((group) =>
    group.values.map((value) => ({
      label: group.label,
      kind: group.kind,
      expected: group.expected,
      value,
    })),
  );

  const evaluations = cases.map((entry) => {
    const result = engine.evaluate({ kind: entry.kind, value: entry.value });
    return {
      ...entry,
      actual: result.decision,
      matchedCategories: result.reasons.map((reason) => reason.category),
      matchedTerms: result.reasons.map((reason) => reason.term),
      matchesExpectation: result.decision === entry.expected,
    };
  });

  const mismatches = evaluations.filter((entry) => !entry.matchesExpectation);
  const totalsByExpected = Object.fromEntries(
    ["allow", "review", "reject"].map((expected) => [
      expected,
      evaluations.filter((entry) => entry.expected === expected).length,
    ]),
  );
  const mismatchesByExpected = Object.fromEntries(
    ["allow", "review", "reject"].map((expected) => [
      expected,
      mismatches.filter((entry) => entry.expected === expected).length,
    ]),
  );

  return {
    id: "brand-profile-calibration-report",
    version: 1,
    bundleFile: path.basename(bundleFile),
    fixtureFile: path.basename(fixtureFile),
    summary: {
      totalCases: evaluations.length,
      mismatchCount: mismatches.length,
      totalsByExpected,
      mismatchesByExpected,
    },
    evaluations,
  };
}

export function writeReport(outputFile, report) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function main(argv) {
  const options = parseArgs(argv);
  const report = evaluateBrandProfile(options);
  writeReport(options.outputFile, report);
  console.log(
    `Wrote ${options.outputFile} (${report.summary.totalCases} cases, ${report.summary.mismatchCount} mismatches)`,
  );
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
