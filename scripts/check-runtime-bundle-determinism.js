import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildRuntimeBundleFromDirectory,
  writeRuntimeBundle,
} from "./build-runtime-sources.js";
import {
  buildProvenanceManifest,
  writeProvenanceManifest,
} from "./build-provenance-manifest.js";

const inputDir = path.resolve(process.cwd(), "custom", "sources");
const expectedFile = path.resolve(
  process.cwd(),
  "dist",
  "runtime-sources.json",
);
const expectedManifestFile = path.resolve(
  process.cwd(),
  "dist",
  "build-manifest.json",
);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-runtime-"));
const candidateFile = path.join(tempDir, "runtime-sources.json");
const candidateManifestFile = path.join(tempDir, "build-manifest.json");

try {
  const bundle = buildRuntimeBundleFromDirectory(inputDir);
  writeRuntimeBundle(candidateFile, bundle);
  writeProvenanceManifest(
    candidateManifestFile,
    buildProvenanceManifest({
      inputDir,
      outputFile: candidateFile,
      runtimeFileLabel: expectedFile,
    }),
  );

  const expected = fs.readFileSync(expectedFile, "utf8");
  const actual = fs.readFileSync(candidateFile, "utf8");
  const expectedManifest = fs.readFileSync(expectedManifestFile, "utf8");
  const actualManifest = fs.readFileSync(candidateManifestFile, "utf8");

  if (expected !== actual) {
    throw new Error(
      "Runtime bundle determinism check failed: rebuilt bundle differs from dist/runtime-sources.json",
    );
  }
  if (expectedManifest !== actualManifest) {
    throw new Error(
      "Runtime bundle determinism check failed: rebuilt manifest differs from dist/build-manifest.json",
    );
  }

  console.log("Runtime bundle determinism check passed");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
