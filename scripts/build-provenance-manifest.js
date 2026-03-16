import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadRuntimeBundleBrotliFromFile } from "../src/loaders/runtime-bundle-brotli.js";
import { loadRuntimeBundleBinaryFromFile } from "../src/loaders/runtime-bundle-binary.js";
import { loadRuntimeBundleGzipFromFile } from "../src/loaders/runtime-bundle-gzip.js";
import { loadSourceFromFile } from "../src/loaders/source-loader.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";
import { writeTextFileAtomic } from "../src/schema/source-io.js";
import {
  DEFAULT_SOURCE_INTEGRITY_LOCK_FILE,
  validateSourceIntegrityLock,
} from "./source-integrity.js";

const DEFAULT_REFRESH_POLICY_FILE = path.resolve(
  process.cwd(),
  "source-refresh-policy.json",
);
const DEFAULT_PACKAGE_LOCK_FILE = path.resolve(
  process.cwd(),
  "package-lock.json",
);

const PACKAGE_SOURCE_NAMES = new Set(["@2toad/profanity", "cuss", "obscenity"]);

const TRANSFORM_VERSION_BY_PREFIX = [
  ["imported-2toad-profanity-", "import-2toad-profanity@1"],
  ["imported-cuss-", "import-cuss@1"],
  ["imported-dsojevic-", "import-dsojevic-profanity@1"],
  ["imported-github-reserved-usernames", "import-github-reserved-usernames@1"],
  ["imported-gitlab-reserved-names", "import-gitlab-reserved-names@1"],
  ["imported-icann-reserved-names", "import-icann-reserved-names@1"],
  ["imported-insult-wiki-", "import-insult-wiki@1"],
  ["imported-ldnoobw-", "import-ldnoobw@1"],
  ["imported-obscenity-", "import-obscenity@1"],
  [
    "imported-reserved-usernames-impersonation",
    "import-reserved-usernames-impersonation@1",
  ],
  ["imported-rfc2142-role-mailboxes", "extract-rfc2142-role-mailboxes@1"],
  ["imported-uspto-trademarks-", "import-uspto-trademarks@1"],
  ["derived-wikidata-brand-risk", "derive-wikidata-brand-risk@2"],
  ["derived-impersonation", "derive-impersonation@1"],
  ["derived-composite-risk", "derive-composite-risk@1"],
  [
    "imported-windows-reserved-device-names",
    "extract-windows-reserved-device-names@1",
  ],
  [
    "imported-windows-reserved-uri-schemes",
    "import-windows-reserved-uri-schemes@1",
  ],
  ["derived-uspto-brand-risk", "derive-uspto-brand-risk@4"],
];

function normalizeRelativePath(value) {
  return value.replace(/\\/g, "/");
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function hashBytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readOptionalJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(readText(filePath));
}

function readPackageVersions(packageLockFile = DEFAULT_PACKAGE_LOCK_FILE) {
  const packageLock = readOptionalJson(packageLockFile);
  const versions = new Map();

  if (!packageLock?.packages || typeof packageLock.packages !== "object") {
    return versions;
  }

  for (const [packagePath, details] of Object.entries(packageLock.packages)) {
    if (!packagePath.startsWith("node_modules/")) continue;
    const packageName = packagePath.slice("node_modules/".length);
    if (!PACKAGE_SOURCE_NAMES.has(packageName)) continue;
    if (typeof details?.version === "string" && details.version.length > 0) {
      versions.set(packageName, details.version);
    }
  }

  return versions;
}

function readRefreshPolicy(refreshPolicyFile = DEFAULT_REFRESH_POLICY_FILE) {
  const refreshPolicy = readOptionalJson(refreshPolicyFile);
  if (
    !refreshPolicy ||
    refreshPolicy.id !== "source-refresh-policy" ||
    !Array.isArray(refreshPolicy.policies)
  ) {
    return null;
  }
  return refreshPolicy;
}

function readSourceIntegrityLock(
  sourceIntegrityLockFile = DEFAULT_SOURCE_INTEGRITY_LOCK_FILE,
) {
  const lock = readOptionalJson(sourceIntegrityLockFile);
  if (!lock) return null;
  return validateSourceIntegrityLock(lock);
}

function findRefreshPolicyEntry(refreshPolicy, sourceName) {
  if (!refreshPolicy || !sourceName) return null;
  return (
    refreshPolicy.policies.find(
      (entry) => entry?.match?.source === sourceName,
    ) ?? null
  );
}

function inferArtifactType(sourceId) {
  if (sourceId.startsWith("derived-")) return "derived";
  if (sourceId.startsWith("imported-")) return "imported";
  return "maintained";
}

function inferTransformVersion(sourceId) {
  for (const [prefix, transformVersion] of TRANSFORM_VERSION_BY_PREFIX) {
    if (sourceId.startsWith(prefix)) {
      return transformVersion;
    }
  }
  return "unknown@1";
}

function buildRefreshPolicyMetadata(refreshPolicy, sourceName) {
  const matchedPolicy = findRefreshPolicyEntry(refreshPolicy, sourceName);
  if (!matchedPolicy) return null;
  return {
    source: refreshPolicy.id,
    version: refreshPolicy.version,
    maxAgeDays: matchedPolicy.maxAgeDays,
    notes: matchedPolicy.notes ?? null,
  };
}

function inferUpstreamVersion(sourceName, packageVersions) {
  if (!sourceName || !packageVersions.has(sourceName)) return null;
  return {
    source: "package-lock.json",
    value: packageVersions.get(sourceName),
  };
}

export function buildSourceArtifactEntries(
  inputDir,
  {
    refreshPolicy = readRefreshPolicy(),
    packageVersions = readPackageVersions(),
    sourceIntegrityLock = readSourceIntegrityLock(),
  } = {},
) {
  const integrityEntries = new Map(
    (sourceIntegrityLock?.entries ?? []).map((entry) => [entry.file, entry]),
  );
  return fs
    .readdirSync(inputDir)
    .filter((entry) => entry.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => {
      const filePath = path.join(inputDir, entry);
      const serialized = readText(filePath);
      const source = loadSourceFromFile(pathToFileURL(filePath));
      const sourceName = source.metadata?.source ?? null;
      const relativeFile = normalizeRelativePath(
        path.relative(process.cwd(), filePath),
      );
      return {
        file: relativeFile,
        id: source.id,
        source: sourceName,
        artifactType: inferArtifactType(source.id),
        transformVersion: inferTransformVersion(source.id),
        upstreamVersion: inferUpstreamVersion(sourceName, packageVersions),
        refreshPolicy: buildRefreshPolicyMetadata(refreshPolicy, sourceName),
        upstreamIntegrity: integrityEntries.get(relativeFile)
          ? {
              fetchUrl: integrityEntries.get(relativeFile).fetchUrl,
              responseSha256: integrityEntries.get(relativeFile).responseSha256,
              etag: integrityEntries.get(relativeFile).etag,
              lastModified: integrityEntries.get(relativeFile).lastModified,
              contentType: integrityEntries.get(relativeFile).contentType,
            }
          : null,
        license: source.metadata?.license ?? null,
        sourceUrl: source.metadata?.sourceUrl ?? null,
        ruleCount: source.rules?.length ?? 0,
        compositeRuleCount: source.compositeRules?.length ?? 0,
        sha256: hashText(serialized),
      };
    });
}

export function buildSourceArtifactSetHash(entries) {
  return hashText(
    JSON.stringify(entries.map((entry) => [entry.file, entry.sha256])),
  );
}

export function buildRuntimeArtifactEntry(
  outputFile,
  runtimeFileLabel = outputFile,
) {
  const bytes = fs.readFileSync(outputFile);
  const bundleUrl = pathToFileURL(outputFile);
  const bundle = outputFile.endsWith(".json.br")
    ? loadRuntimeBundleBrotliFromFile(bundleUrl)
    : outputFile.endsWith(".json.gz")
      ? loadRuntimeBundleGzipFromFile(bundleUrl)
      : outputFile.endsWith(".bin")
        ? loadRuntimeBundleBinaryFromFile(bundleUrl)
        : loadRuntimeBundleFromFile(bundleUrl);
  return {
    file: normalizeRelativePath(path.relative(process.cwd(), runtimeFileLabel)),
    artifactType: "compiled-runtime",
    transformVersion: "build-runtime-sources@1",
    ruleCount: bundle.rules.length,
    compositeRuleCount: bundle.compositeRules.length,
    sha256: hashBytes(bytes),
  };
}

export function buildProvenanceManifest({
  inputDir,
  outputFile,
  runtimeFileLabel = outputFile,
  refreshPolicyFile = DEFAULT_REFRESH_POLICY_FILE,
  packageLockFile = DEFAULT_PACKAGE_LOCK_FILE,
  sourceIntegrityLockFile = DEFAULT_SOURCE_INTEGRITY_LOCK_FILE,
}) {
  const refreshPolicy = readRefreshPolicy(refreshPolicyFile);
  const packageVersions = readPackageVersions(packageLockFile);
  const sourceIntegrityLock = readSourceIntegrityLock(sourceIntegrityLockFile);
  const sourceArtifacts = buildSourceArtifactEntries(inputDir, {
    refreshPolicy,
    packageVersions,
    sourceIntegrityLock,
  });
  const sourceArtifactSetSha256 = buildSourceArtifactSetHash(sourceArtifacts);
  const runtimeArtifact = buildRuntimeArtifactEntry(
    outputFile,
    runtimeFileLabel,
  );
  const refreshPolicyFileRelative = normalizeRelativePath(
    path.relative(process.cwd(), refreshPolicyFile),
  );
  const packageLockFileRelative = normalizeRelativePath(
    path.relative(process.cwd(), packageLockFile),
  );
  const sourceIntegrityLockFileRelative = normalizeRelativePath(
    path.relative(process.cwd(), sourceIntegrityLockFile),
  );

  return {
    id: "build-provenance-manifest",
    version: 3,
    provenanceInputs: {
      refreshPolicyFile: fs.existsSync(refreshPolicyFile)
        ? refreshPolicyFileRelative
        : null,
      refreshPolicySha256: fs.existsSync(refreshPolicyFile)
        ? hashText(readText(refreshPolicyFile))
        : null,
      refreshPolicyVersion: refreshPolicy?.version ?? null,
      packageLockFile: fs.existsSync(packageLockFile)
        ? packageLockFileRelative
        : null,
      packageLockSha256: fs.existsSync(packageLockFile)
        ? hashText(readText(packageLockFile))
        : null,
      sourceIntegrityLockFile: fs.existsSync(sourceIntegrityLockFile)
        ? sourceIntegrityLockFileRelative
        : null,
      sourceIntegrityLockSha256: fs.existsSync(sourceIntegrityLockFile)
        ? hashText(readText(sourceIntegrityLockFile))
        : null,
      sourceIntegrityLockVersion: sourceIntegrityLock?.version ?? null,
    },
    sourceArtifacts,
    sourceArtifactSetSha256,
    runtimeArtifact: {
      ...runtimeArtifact,
      sourceArtifactSetSha256,
    },
  };
}

export function writeProvenanceManifest(manifestFile, manifest) {
  fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
  writeTextFileAtomic(manifestFile, `${JSON.stringify(manifest)}\n`);
}
