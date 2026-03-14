import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildRuntimeBundleFromDirectory, writeRuntimeBundle } from "./build-runtime-sources.js";

const inputDir = path.resolve(process.cwd(), "custom", "sources");
const expectedFile = path.resolve(process.cwd(), "dist", "runtime-sources.json");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-runtime-"));
const candidateFile = path.join(tempDir, "runtime-sources.json");

try {
  const bundle = buildRuntimeBundleFromDirectory(inputDir);
  writeRuntimeBundle(candidateFile, bundle);

  const expected = fs.readFileSync(expectedFile, "utf8");
  const actual = fs.readFileSync(candidateFile, "utf8");

  if (expected !== actual) {
    throw new Error("Runtime bundle determinism check failed: rebuilt bundle differs from dist/runtime-sources.json");
  }

  console.log("Runtime bundle determinism check passed");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
