import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadRuntimeBundleBinaryFromFile } from "./runtime-bundle-binary.js";
import { loadRuntimeBundleBrotliFromFile } from "./runtime-bundle-brotli.js";
import { loadRuntimeBundleGzipFromFile } from "./runtime-bundle-gzip.js";
import { loadRuntimeBundleFromFile } from "./runtime-bundle.js";

export function loadRuntimeBundleAutoFromFile(bundlePath) {
  const filePath = String(bundlePath);
  const fileUrl = pathToFileURL(path.resolve(filePath));

  if (filePath.endsWith(".json.br"))
    return loadRuntimeBundleBrotliFromFile(fileUrl);
  if (filePath.endsWith(".json.gz"))
    return loadRuntimeBundleGzipFromFile(fileUrl);
  if (filePath.endsWith(".bin"))
    return loadRuntimeBundleBinaryFromFile(fileUrl);
  return loadRuntimeBundleFromFile(fileUrl);
}

export function loadDefaultRuntimeBundle({
  baseDir = path.resolve(process.cwd(), "dist"),
} = {}) {
  const resolvedBaseDir =
    baseDir instanceof URL
      ? fileURLToPath(new URL(".", baseDir))
      : String(baseDir);
  const preferredFiles = [
    "runtime-sources.json.br",
    "runtime-sources.json",
    "runtime-sources.json.gz",
    "runtime-sources.bin",
  ];
  for (const filename of preferredFiles) {
    const candidate = path.resolve(resolvedBaseDir, filename);
    if (!fs.existsSync(candidate)) continue;
    return loadRuntimeBundleAutoFromFile(candidate);
  }

  throw new Error(
    `No runtime bundle found in ${resolvedBaseDir}. Expected one of: ${preferredFiles.join(", ")}`,
  );
}
