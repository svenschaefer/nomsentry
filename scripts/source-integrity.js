import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadSourceFromFile } from "../src/loaders/source-loader.js";
import { GITLAB_RESERVED_NAMES_RAW_URL } from "../src/importers/gitlab-reserved-names.js";
import { BASE_URL as DSOJEVIC_BASE_URL } from "./import-dsojevic-profanity.js";

export const DEFAULT_SOURCE_INTEGRITY_LOCK_FILE = path.resolve(
  process.cwd(),
  "source-integrity-lock.json",
);
export const DEFAULT_SOURCE_REFRESH_POLICY_FILE = path.resolve(
  process.cwd(),
  "source-refresh-policy.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeRelativePath(value) {
  return value.replace(/\\/g, "/");
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function trimHeader(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseContentType(value) {
  const trimmed = trimHeader(value);
  if (!trimmed) return null;
  return trimmed.split(";")[0].trim().toLowerCase() || null;
}

export function validateSourceIntegrityLock(lock) {
  if (lock?.id !== "source-integrity-lock") {
    throw new Error(
      "source integrity lock must have id 'source-integrity-lock'",
    );
  }
  if (lock?.version !== 1) {
    throw new Error(
      `Unsupported source integrity lock version: ${lock?.version}`,
    );
  }
  if (!Array.isArray(lock.entries)) {
    throw new Error("source integrity lock entries must be an array");
  }

  const seenFiles = new Set();
  for (const [index, entry] of lock.entries.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(
        `source integrity lock entries[${index}] must be an object`,
      );
    }
    for (const field of [
      "file",
      "id",
      "source",
      "fetchUrl",
      "sourceArtifactSha256",
      "responseSha256",
    ]) {
      if (typeof entry[field] !== "string" || entry[field].length === 0) {
        throw new Error(
          `source integrity lock entries[${index}].${field} must be a non-empty string`,
        );
      }
    }
    if (
      !/^[a-f0-9]{64}$/i.test(entry.sourceArtifactSha256) ||
      !/^[a-f0-9]{64}$/i.test(entry.responseSha256)
    ) {
      throw new Error(
        `source integrity lock entries[${index}] must contain sha256 hex digests`,
      );
    }
    for (const optionalField of ["etag", "lastModified", "contentType"]) {
      if (
        entry[optionalField] !== null &&
        entry[optionalField] !== undefined &&
        typeof entry[optionalField] !== "string"
      ) {
        throw new Error(
          `source integrity lock entries[${index}].${optionalField} must be a string or null`,
        );
      }
    }
    if (seenFiles.has(entry.file)) {
      throw new Error(
        `source integrity lock contains duplicate entry for ${entry.file}`,
      );
    }
    seenFiles.add(entry.file);
  }

  return lock;
}

export function findRefreshPolicyEntry(policy, sourceName) {
  return (
    policy?.policies?.find((entry) => entry?.match?.source === sourceName) ??
    null
  );
}

export function loadSourceIntegrityPolicy(
  policyFile = DEFAULT_SOURCE_REFRESH_POLICY_FILE,
) {
  return readJson(policyFile);
}

export function resolveIntegrityFetchUrl(source, file) {
  if (source.id === "imported-gitlab-reserved-names") {
    return GITLAB_RESERVED_NAMES_RAW_URL;
  }
  if (
    source.id.startsWith("imported-dsojevic-") &&
    typeof source.metadata?.language === "string"
  ) {
    return `${DSOJEVIC_BASE_URL}/${source.metadata.language}.json`;
  }
  if (typeof source.metadata?.sourceUrl === "string") {
    return source.metadata.sourceUrl;
  }

  throw new Error(
    `Could not resolve integrity fetch URL for ${file} (${source.id})`,
  );
}

export function buildIntegrityTargets(
  inputDir,
  policy = loadSourceIntegrityPolicy(),
) {
  const targets = [];
  for (const entry of fs
    .readdirSync(inputDir)
    .sort((a, b) => a.localeCompare(b))) {
    if (!entry.endsWith(".json")) continue;
    const filePath = path.join(inputDir, entry);
    const source = loadSourceFromFile(pathToFileURL(filePath));
    const policyEntry = findRefreshPolicyEntry(policy, source.metadata?.source);
    if (!policyEntry?.requiresUpstreamIntegrity) continue;

    targets.push({
      file: normalizeRelativePath(path.relative(process.cwd(), filePath)),
      id: source.id,
      source: source.metadata?.source ?? null,
      fetchUrl: resolveIntegrityFetchUrl(source, entry),
      sourceArtifactSha256: hashText(fs.readFileSync(filePath, "utf8")),
    });
  }

  return targets;
}

export async function captureUrlIntegrity(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: { "user-agent": "nomsentry/0.3.0" },
  });
  if (!response.ok) {
    throw new Error(
      `Source integrity fetch failed for ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const body = await response.text();
  return {
    responseSha256: hashText(body),
    etag: trimHeader(response.headers.get("etag")),
    lastModified: trimHeader(response.headers.get("last-modified")),
    contentType: parseContentType(response.headers.get("content-type")),
  };
}

export async function buildSourceIntegrityLock(
  inputDir,
  { policy = loadSourceIntegrityPolicy(), fetchImpl = fetch } = {},
) {
  const targets = buildIntegrityTargets(inputDir, policy);
  const entries = [];

  for (const target of targets) {
    entries.push({
      ...target,
      ...(await captureUrlIntegrity(target.fetchUrl, fetchImpl)),
    });
  }

  return {
    id: "source-integrity-lock",
    version: 1,
    entries,
  };
}
