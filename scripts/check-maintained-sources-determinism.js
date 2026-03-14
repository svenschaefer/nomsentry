import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";
import { compactSourcesDirectory } from "./compact-sources.js";

const expectedDir = path.resolve(process.cwd(), "custom", "sources");
const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "nomsentry-maintained-sources-"),
);
const candidateDir = path.join(tempRoot, "sources");

try {
  const sources = loadSourcesFromDirectory(
    new URL("../custom/sources/", import.meta.url),
  );
  compactSourcesDirectory(sources, candidateDir, {
    stageDir: path.join(tempRoot, "stage"),
    backupDir: path.join(tempRoot, "backup"),
    logger: null,
  });

  const expectedFiles = fs
    .readdirSync(expectedDir)
    .filter((entry) => entry.endsWith(".json"))
    .sort();
  const candidateFiles = fs
    .readdirSync(candidateDir)
    .filter((entry) => entry.endsWith(".json"))
    .sort();

  if (JSON.stringify(expectedFiles) !== JSON.stringify(candidateFiles)) {
    throw new Error(
      "Maintained source determinism check failed: rebuilt file set differs from custom/sources",
    );
  }

  for (const file of expectedFiles) {
    const expected = fs.readFileSync(path.join(expectedDir, file), "utf8");
    const actual = fs.readFileSync(path.join(candidateDir, file), "utf8");
    if (expected !== actual) {
      throw new Error(
        `Maintained source determinism check failed: rebuilt ${file} differs from custom/sources/${file}`,
      );
    }
  }

  console.log("Maintained source determinism check passed");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
