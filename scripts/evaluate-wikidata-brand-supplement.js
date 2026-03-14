import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  deriveFilterTerm,
  evaluateSearchResults,
  evaluateTerms,
  scoreCandidate,
} from "../src/importers/wikidata-brand-risk.js";

export {
  deriveFilterTerm,
  evaluateSearchResults,
  evaluateTerms,
  scoreCandidate,
};

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
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

export function loadTermsFromFixture(fixtureFile) {
  const fixture = JSON.parse(fs.readFileSync(fixtureFile, "utf8"));
  const uncoveredBrands =
    fixture.find((group) => group.label.includes("uncovered-brand"))?.values ??
    [];
  return uncoveredBrands.map((value) => String(value).trim().toLowerCase());
}

export function writeReport(outputFile, report) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main(argv) {
  const options = parseArgs(argv);
  const terms =
    options.terms.length > 0
      ? options.terms
      : loadTermsFromFixture(options.fixtureFile);
  const report = await evaluateTerms(terms);
  writeReport(options.outputFile, report);
  console.log(`Wrote ${options.outputFile} (${report.terms.length} terms)`);
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
