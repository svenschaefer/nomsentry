import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";

function parseArgs(argv) {
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

function buildRuntimeBundle(sources) {
  const idPrefixTable = { items: [], indexByKey: new Map() };
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
      const lastSlash = String(rule.id).lastIndexOf("/");
      const prefix = lastSlash >= 0 ? String(rule.id).slice(0, lastSlash + 1) : "";
      const suffix = lastSlash >= 0 ? String(rule.id).slice(lastSlash + 1) : String(rule.id);
      const profile = [
        intern(categoryTable, rule.category),
        intern(matchTable, rule.match),
        intern(scopeTable, rule.scopes),
        intern(normalizationFieldTable, rule.normalizationField ?? "separatorFolded"),
        ...(rule.severity ? [intern(severityTable, rule.severity)] : [])
      ];
      const entry = [
        intern(idPrefixTable, prefix),
        suffix,
        intern(profileTable, profile),
        ...(suffix === rule.term ? [] : [rule.term])
      ];
      rules.push(entry);
    }

    for (const rule of source.compositeRules ?? []) {
      compositeRules.push([
        rule.id,
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
    idPrefixTable: idPrefixTable.items,
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

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(path.dirname(options.outputFile), { recursive: true });
const sources = loadSourcesFromDirectory(pathToFileURL(`${options.inputDir}${path.sep}`));
const bundle = buildRuntimeBundle(sources);
fs.writeFileSync(options.outputFile, `${JSON.stringify(bundle)}\n`, "utf8");
console.log(`Wrote ${options.outputFile} (${bundle.rules.length} rules, ${bundle.compositeRules.length} composite rules)`);
