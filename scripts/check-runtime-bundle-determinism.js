import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildRuntimeBundleFromDirectory,
  writeRuntimeBundleBrotli,
} from "./build-runtime-sources.js";
import {
  buildProvenanceManifest,
  writeProvenanceManifest,
} from "./build-provenance-manifest.js";

const inputDir = path.resolve(process.cwd(), "custom", "sources");
const expectedFile = path.resolve(
  process.cwd(),
  "dist",
  "runtime-sources.json.br",
);
const expectedManifestFile = path.resolve(
  process.cwd(),
  "dist",
  "build-manifest.json",
);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-runtime-"));
const candidateFile = path.join(tempDir, "runtime-sources.json.br");
const candidateManifestFile = path.join(tempDir, "build-manifest.json");

try {
  const bundle = buildRuntimeBundleFromDirectory(inputDir);
  writeRuntimeBundleBrotli(candidateFile, bundle);
  writeProvenanceManifest(
    candidateManifestFile,
    buildProvenanceManifest({
      inputDir,
      outputFile: candidateFile,
      runtimeFileLabel: expectedFile,
    }),
  );

  const expected = fs.readFileSync(expectedFile);
  const actual = fs.readFileSync(candidateFile);
  const expectedManifest = fs.readFileSync(expectedManifestFile, "utf8");
  const actualManifest = fs.readFileSync(candidateManifestFile, "utf8");

  if (!expected.equals(actual)) {
    throw new Error(
      "Runtime bundle determinism check failed: rebuilt bundle differs from dist/runtime-sources.json.br",
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
