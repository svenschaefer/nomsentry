import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { encodeRuntimeBundleBrotli } from "../src/loaders/runtime-bundle-brotli.js";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";
import { writeTextFileAtomic } from "../src/schema/source-io.js";
import {
  buildProvenanceManifest,
  writeProvenanceManifest,
} from "./build-provenance-manifest.js";

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputDir: path.resolve(process.cwd(), "custom", "sources"),
    outputFile: path.resolve(process.cwd(), "dist", "runtime-sources.json.br"),
    manifestFile: path.resolve(process.cwd(), "dist", "build-manifest.json"),
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-dir") {
      options.inputDir = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--output-file") {
      options.outputFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--manifest-file") {
      options.manifestFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
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
  const profileUsage = new Map();
  const seenRules = new Set();

  for (const source of sources) {
    for (const rule of source.rules ?? []) {
      const profile = [
        intern(categoryTable, rule.category),
        intern(matchTable, rule.match),
        intern(scopeTable, rule.scopes),
        intern(
          normalizationFieldTable,
          rule.normalizationField ?? "separatorFolded",
        ),
        ...(rule.severity ? [intern(severityTable, rule.severity)] : []),
      ];
      const profileIndex = intern(profileTable, profile);
      profileUsage.set(profileIndex, (profileUsage.get(profileIndex) ?? 0) + 1);
      const dedupeKey = `${profileIndex}\u0000${rule.term}`;
      if (seenRules.has(dedupeKey)) continue;
      seenRules.add(dedupeKey);
      rules.push([rule.term, profileIndex]);
    }

    for (const rule of source.compositeRules ?? []) {
      compositeRules.push([
        rule.term,
        rule.category,
        intern(scopeTable, rule.scopes),
        rule.allOf,
      ]);
    }
  }

  let defaultProfileIndex = 0;
  let defaultProfileCount = -1;
  for (const [profileIndex, count] of profileUsage.entries()) {
    if (count > defaultProfileCount) {
      defaultProfileCount = count;
      defaultProfileIndex = profileIndex;
    }
  }

  rules.sort((left, right) => {
    if (left[1] !== right[1]) return left[1] - right[1];
    return String(left[0]).localeCompare(String(right[0]));
  });

  const compactRules = rules.map(([term, profileIndex]) =>
    profileIndex === defaultProfileIndex ? term : [term, profileIndex],
  );

  return {
    id: "runtime-sources",
    version: 1,
    defaultProfileIndex,
    scopeTable: scopeTable.items,
    matchTable: matchTable.items,
    categoryTable: categoryTable.items,
    severityTable: severityTable.items,
    normalizationFieldTable: normalizationFieldTable.items,
    profileTable: profileTable.items,
    rules: compactRules,
    compositeRules,
  };
}

export function buildRuntimeBundleFromDirectory(inputDir) {
  const absoluteInputDir = path.resolve(inputDir);
  const directoryUrl = new URL(
    "./",
    `${pathToFileURL(absoluteInputDir).href}/`,
  );
  return buildRuntimeBundle(loadSourcesFromDirectory(directoryUrl));
}

export function writeRuntimeBundle(outputFile, bundle) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  writeTextFileAtomic(outputFile, `${JSON.stringify(bundle)}\n`);
}

export function writeRuntimeBundleBrotli(outputFile, bundle) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  const tmpFile = `${outputFile}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpFile, encodeRuntimeBundleBrotli(bundle));
  fs.renameSync(tmpFile, outputFile);
}

function writeRuntimeBundleByExtension(outputFile, bundle) {
  if (outputFile.endsWith(".json.br")) {
    writeRuntimeBundleBrotli(outputFile, bundle);
    return;
  }
  writeRuntimeBundle(outputFile, bundle);
}

function main(argv) {
  const options = parseArgs(argv);
  const bundle = buildRuntimeBundleFromDirectory(options.inputDir);
  writeRuntimeBundleByExtension(options.outputFile, bundle);
  const manifest = buildProvenanceManifest({
    inputDir: options.inputDir,
    outputFile: options.outputFile,
  });
  writeProvenanceManifest(options.manifestFile, manifest);
  console.log(
    `Wrote ${options.outputFile} (${bundle.rules.length} rules, ${bundle.compositeRules.length} composite rules)`,
  );
  console.log(`Wrote ${options.manifestFile}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
