import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputDir: path.resolve(process.cwd(), "custom", "sources"),
    outputFile: path.resolve(process.cwd(), "dist", "runtime-sources.json")
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-dir") {
      options.inputDir = path.resolve(process.cwd(), String(args.shift() || ""));
    } else if (token === "--output-file") {
      options.outputFile = path.resolve(process.cwd(), String(args.shift() || ""));
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

function intern(values, value) {
  const key = JSON.stringify(value);
  let index = values.indexByKey.get(key);
  if (index !== undefined) return index;
  index = values.items.length;
  values.indexByKey.set(key, index);
  values.items.push(value);
  return index;
}

export function buildRuntimeBundle(sources) {
  const scopeTable = { items: [], indexByKey: new Map() };
  const matchTable = { items: [], indexByKey: new Map() };
  const categoryTable = { items: [], indexByKey: new Map() };
  const severityTable = { items: [], indexByKey: new Map() };
  const normalizationFieldTable = { items: [], indexByKey: new Map() };
  const profileTable = { items: [], indexByKey: new Map() };

  const rules = [];
  const compositeRules = [];

  for (const source of sources) {
    for (const rule of source.rules ?? []) {
      const suffix = String(rule.id).slice(String(rule.id).lastIndexOf("/") + 1);
      const profile = [
        intern(categoryTable, rule.category),
        intern(matchTable, rule.match),
        intern(scopeTable, rule.scopes),
        intern(normalizationFieldTable, rule.normalizationField ?? "separatorFolded"),
        ...(rule.severity ? [intern(severityTable, rule.severity)] : [])
      ];
      const entry = [
        suffix,
        intern(profileTable, profile),
        ...(suffix === rule.term ? [] : [rule.term])
      ];
      rules.push(entry);
    }

    for (const rule of source.compositeRules ?? []) {
      compositeRules.push([
        rule.term,
        rule.category,
        intern(scopeTable, rule.scopes),
        rule.allOf
      ]);
    }
  }

  return {
    id: "runtime-sources",
    version: 1,
    scopeTable: scopeTable.items,
    matchTable: matchTable.items,
    categoryTable: categoryTable.items,
    severityTable: severityTable.items,
    normalizationFieldTable: normalizationFieldTable.items,
    profileTable: profileTable.items,
    rules,
    compositeRules
  };
}

export function buildRuntimeBundleFromDirectory(inputDir) {
  return buildRuntimeBundle(loadSourcesFromDirectory(pathToFileURL(`${inputDir}${path.sep}`)));
}

export function writeRuntimeBundle(outputFile, bundle) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(bundle)}\n`, "utf8");
}

function main(argv) {
  const options = parseArgs(argv);
  const bundle = buildRuntimeBundleFromDirectory(options.inputDir);
  writeRuntimeBundle(options.outputFile, bundle);
  console.log(`Wrote ${options.outputFile} (${bundle.rules.length} rules, ${bundle.compositeRules.length} composite rules)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
