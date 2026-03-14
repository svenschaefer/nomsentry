import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadSourceFromFile } from "../src/loaders/source-loader.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";
import { writeTextFileAtomic } from "../src/schema/source-io.js";

function normalizeRelativePath(value) {
  return value.replace(/\\/g, "/");
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function buildSourceArtifactEntries(inputDir) {
  return fs.readdirSync(inputDir)
    .filter((entry) => entry.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => {
      const filePath = path.join(inputDir, entry);
      const serialized = readText(filePath);
      const source = loadSourceFromFile(pathToFileURL(filePath));
      return {
        file: normalizeRelativePath(path.relative(process.cwd(), filePath)),
        id: source.id,
        source: source.metadata?.source ?? null,
        license: source.metadata?.license ?? null,
        sourceUrl: source.metadata?.sourceUrl ?? null,
        ruleCount: source.rules?.length ?? 0,
        compositeRuleCount: source.compositeRules?.length ?? 0,
        sha256: hashText(serialized)
      };
    });
}

export function buildSourceArtifactSetHash(entries) {
  return hashText(JSON.stringify(entries.map((entry) => [entry.file, entry.sha256])));
}

export function buildRuntimeArtifactEntry(outputFile, runtimeFileLabel = outputFile) {
  const serialized = readText(outputFile);
  const bundle = loadRuntimeBundleFromFile(pathToFileURL(outputFile));
  return {
    file: normalizeRelativePath(path.relative(process.cwd(), runtimeFileLabel)),
    ruleCount: bundle.rules.length,
    compositeRuleCount: bundle.compositeRules.length,
    sha256: hashText(serialized)
  };
}

export function buildProvenanceManifest({ inputDir, outputFile, runtimeFileLabel = outputFile }) {
  const sourceArtifacts = buildSourceArtifactEntries(inputDir);
  const sourceArtifactSetSha256 = buildSourceArtifactSetHash(sourceArtifacts);
  const runtimeArtifact = buildRuntimeArtifactEntry(outputFile, runtimeFileLabel);

  return {
    id: "build-provenance-manifest",
    version: 1,
    sourceArtifacts,
    sourceArtifactSetSha256,
    runtimeArtifact: {
      ...runtimeArtifact,
      sourceArtifactSetSha256
    }
  };
}

export function writeProvenanceManifest(manifestFile, manifest) {
  fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
  writeTextFileAtomic(manifestFile, `${JSON.stringify(manifest)}\n`);
}
