import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildSourceArtifactEntries } from "./build-provenance-manifest.js";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputDir: path.resolve(process.cwd(), "custom", "sources"),
    manifestFile: null,
    policyFile: path.resolve(process.cwd(), "source-refresh-policy.json"),
    asOf: null,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-dir") {
      options.inputDir = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--manifest-file") {
      options.manifestFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--policy-file") {
      options.policyFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--as-of") {
      options.asOf = String(args.shift() || "");
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

export function validateRefreshPolicy(policy) {
  if (policy?.id !== "source-refresh-policy") {
    throw new Error(
      "source refresh policy must have id 'source-refresh-policy'",
    );
  }
  if (policy?.version !== 1) {
    throw new Error(
      `Unsupported source refresh policy version: ${policy?.version}`,
    );
  }
  if (!Array.isArray(policy.policies) || policy.policies.length === 0) {
    throw new Error("source refresh policy must contain at least one policy");
  }

  for (const [index, entry] of policy.policies.entries()) {
    if (
      !entry.match ||
      typeof entry.match !== "object" ||
      Array.isArray(entry.match)
    ) {
      throw new Error(
        `source refresh policy policies[${index}].match must be an object`,
      );
    }
    if (
      typeof entry.match.source !== "string" ||
      entry.match.source.length === 0
    ) {
      throw new Error(
        `source refresh policy policies[${index}].match.source must be a non-empty string`,
      );
    }
    if (!Number.isInteger(entry.maxAgeDays) || entry.maxAgeDays <= 0) {
      throw new Error(
        `source refresh policy policies[${index}].maxAgeDays must be a positive integer`,
      );
    }
    if (
      entry.requiresUpstreamIntegrity !== undefined &&
      typeof entry.requiresUpstreamIntegrity !== "boolean"
    ) {
      throw new Error(
        `source refresh policy policies[${index}].requiresUpstreamIntegrity must be a boolean`,
      );
    }
  }

  return policy;
}

export function resolveAsOfDate(asOf) {
  const value = asOf ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid --as-of date: ${value}`);
  }
  return value;
}

export function findRefreshPolicy(policy, artifact) {
  return (
    policy.policies.find((entry) => entry.match.source === artifact.source) ??
    null
  );
}

export function getLastCommitDate(filePath) {
  try {
    const output = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", filePath],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
    if (output) {
      return output;
    }
  } catch {
    const stats = fs.statSync(path.resolve(process.cwd(), filePath));
    return stats.mtime.toISOString().slice(0, 10);
  }

  const stats = fs.statSync(path.resolve(process.cwd(), filePath));
  return stats.mtime.toISOString().slice(0, 10);
}

export function calculateAgeDays(lastDate, asOfDate) {
  const start = new Date(`${lastDate}T00:00:00Z`);
  const end = new Date(`${asOfDate}T00:00:00Z`);
  return Math.floor((end - start) / 86400000);
}

export function assessFreshness({
  manifest,
  policy,
  asOfDate,
  getCommitDate = getLastCommitDate,
}) {
  const results = [];

  for (const artifact of manifest.sourceArtifacts ?? []) {
    const matchedPolicy = findRefreshPolicy(policy, artifact);
    if (!matchedPolicy) {
      throw new Error(
        `No refresh policy found for source artifact ${artifact.file} (${artifact.source ?? "unknown source"})`,
      );
    }

    const refreshedOn = getCommitDate(artifact.file);
    const ageDays = calculateAgeDays(refreshedOn, asOfDate);

    results.push({
      file: artifact.file,
      id: artifact.id,
      source: artifact.source,
      refreshedOn,
      ageDays,
      maxAgeDays: matchedPolicy.maxAgeDays,
      stale: ageDays > matchedPolicy.maxAgeDays,
    });
  }

  return results.sort((left, right) => left.file.localeCompare(right.file));
}

function main(argv) {
  const options = parseArgs(argv);
  const manifest = options.manifestFile
    ? readJson(options.manifestFile)
    : { sourceArtifacts: buildSourceArtifactEntries(options.inputDir) };
  const policy = validateRefreshPolicy(readJson(options.policyFile));
  const results = assessFreshness({
    manifest,
    policy,
    asOfDate: resolveAsOfDate(options.asOf),
  });

  const stale = results.filter((entry) => entry.stale);
  if (stale.length > 0) {
    for (const entry of stale) {
      console.error(
        `STALE ${entry.file}: ${entry.ageDays}d old (limit ${entry.maxAgeDays}d, source ${entry.source}, refreshed ${entry.refreshedOn})`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Source freshness check passed (${results.length} artifacts)`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
