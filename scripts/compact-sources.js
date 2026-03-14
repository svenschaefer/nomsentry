import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";
import { writeSourceFile } from "../src/schema/source-io.js";

export function resolveCompactFilename(source) {
  const normalizedId = source.id
    .replace(/^imported-/, "")
    .replace(/^derived-/, "derived-")
    .replace(/^[^/]+$/, source.id);
  let filename = `${normalizedId}.json`;

  if (source.id.startsWith("imported-ldnoobw-"))
    filename = `${source.id.replace("imported-", "")}.json`;
  else if (source.id.startsWith("imported-2toad-profanity-"))
    filename = `${source.id.replace("imported-", "")}.json`;
  else if (source.id.startsWith("imported-cuss-"))
    filename = `${source.id.replace("imported-", "")}.json`;
  else if (source.id.startsWith("imported-dsojevic-en"))
    filename = "dsojevic-profanity-en.json";
  else if (source.id.startsWith("imported-insult-wiki-"))
    filename = `${source.id.replace("imported-", "")}.json`;
  else if (source.id === "imported-gitlab-reserved-names")
    filename = "gitlab-reserved-names.json";
  else if (source.id === "imported-github-reserved-usernames")
    filename = "github-reserved-usernames.json";
  else if (source.id === "imported-icann-reserved-names")
    filename = "icann-reserved-names.json";
  else if (source.id === "imported-reserved-usernames")
    filename = "reserved-usernames.json";
  else if (source.id === "imported-obscenity-en")
    filename = "obscenity-en.json";
  else if (source.id === "imported-windows-reserved-uri-schemes")
    filename = "windows-reserved-uri-schemes.json";
  else if (source.id.startsWith("derived-uspto-brand-risk-"))
    filename = `${source.id}.json`;
  else if (source.id === "imported-rfc2142-role-mailboxes")
    filename = "rfc2142-role-mailboxes.json";
  else if (source.id === "imported-windows-reserved-device-names")
    filename = "windows-reserved-device-names.json";

  return filename;
}

export function compactSourcesDirectory(sources, outputDir, options = {}) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error("Refusing to compact sources: source set is empty");
  }

  const fsImpl = options.fsImpl ?? fs;
  const parentDir = path.dirname(outputDir);
  const nonce = `${process.pid}-${Date.now()}`;
  const stageDir =
    options.stageDir ?? path.join(parentDir, `.sources-stage-${nonce}`);
  const backupDir =
    options.backupDir ?? path.join(parentDir, `.sources-backup-${nonce}`);
  const logger = Object.prototype.hasOwnProperty.call(options, "logger")
    ? options.logger
    : console.log;

  if (fsImpl.existsSync(outputDir)) {
    const unexpectedEntries = fsImpl
      .readdirSync(outputDir, { withFileTypes: true })
      .filter(
        (entry) =>
          !entry.isFile() || path.extname(entry.name).toLowerCase() !== ".json",
      )
      .map((entry) => entry.name);
    if (unexpectedEntries.length > 0) {
      throw new Error(
        `Refusing to compact sources into ${outputDir}: unexpected existing entries ${unexpectedEntries.join(", ")}`,
      );
    }
  }

  fsImpl.mkdirSync(stageDir, { recursive: true });

  for (const source of sources) {
    const filename = resolveCompactFilename(source);
    writeSourceFile(path.join(stageDir, filename), source);
    if (logger) {
      logger(`Wrote ${filename} (${source.rules?.length ?? 0} rules)`);
    }
  }

  let swapped = false;
  try {
    if (fsImpl.existsSync(outputDir)) {
      fsImpl.renameSync(outputDir, backupDir);
    }
    fsImpl.renameSync(stageDir, outputDir);
    swapped = true;
    if (fsImpl.existsSync(backupDir)) {
      fsImpl.rmSync(backupDir, { recursive: true, force: true });
    }
  } catch (error) {
    if (
      !swapped &&
      fsImpl.existsSync(backupDir) &&
      !fsImpl.existsSync(outputDir)
    ) {
      fsImpl.renameSync(backupDir, outputDir);
    }
    throw error;
  } finally {
    if (fsImpl.existsSync(stageDir)) {
      fsImpl.rmSync(stageDir, { recursive: true, force: true });
    }
    if (swapped && fsImpl.existsSync(backupDir)) {
      fsImpl.rmSync(backupDir, { recursive: true, force: true });
    }
  }
}

function main() {
  const outputDir = path.resolve(process.cwd(), "custom", "sources");
  const sources = loadSourcesFromDirectory(
    new URL("../custom/sources/", import.meta.url),
  );
  compactSourcesDirectory(sources, outputDir);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
