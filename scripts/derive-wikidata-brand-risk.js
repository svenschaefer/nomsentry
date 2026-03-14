import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildWikidataBrandRiskSource,
  evaluateTerms,
} from "../src/importers/wikidata-brand-risk.js";
import {
  writeSourceFile,
  writeTextFileAtomic,
} from "../src/schema/source-io.js";
import { loadTermsFromFixture } from "./evaluate-wikidata-brand-supplement.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    terms: [],
    fixtureFile: path.resolve(
      process.cwd(),
      "test",
      "fixtures",
      "wikidata-brand-seed-terms.json",
    ),
    outputFile: path.resolve(
      process.cwd(),
      "custom",
      "sources",
      "derived-wikidata-brand-risk.json",
    ),
    reportFile: path.resolve(
      process.cwd(),
      "docs",
      "generated",
      "wikidata-brand-gap-report.json",
    ),
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--terms") {
      options.terms = String(args.shift() || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
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
    } else if (token === "--report-file") {
      options.reportFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

export function writeReport(reportFile, report) {
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  writeTextFileAtomic(reportFile, `${JSON.stringify(report, null, 2)}\n`);
}

async function main(argv) {
  const options = parseArgs(argv);
  const terms =
    options.terms.length > 0
      ? options.terms
      : loadTermsFromFixture(options.fixtureFile);
  const report = await evaluateTerms(terms);
  const source = buildWikidataBrandRiskSource(report);
  writeReport(options.reportFile, report);
  writeSourceFile(options.outputFile, source);
  console.log(`Wrote ${options.reportFile} (${report.terms.length} terms)`);
  console.log(`Wrote ${options.outputFile} (${source.rules.length} rules)`);
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
