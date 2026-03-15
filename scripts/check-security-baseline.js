import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`.trim(),
        result.error ? String(result.error) : "",
        result.stdout?.trim(),
        result.stderr?.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result;
}

function runNpm(args, options = {}) {
  if (process.env.npm_execpath) {
    return runCommand(process.execPath, [process.env.npm_execpath, ...args], {
      ...options,
    });
  }

  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  return runCommand(command, args, {
    shell: process.platform === "win32",
    ...options,
  });
}

export function parseAuditReport(stdout) {
  const report = JSON.parse(stdout);
  const vulnerabilitySummary = report?.metadata?.vulnerabilities;

  if (
    !vulnerabilitySummary ||
    typeof vulnerabilitySummary.total !== "number" ||
    vulnerabilitySummary.total < 0
  ) {
    throw new Error("npm audit --json did not return vulnerability totals");
  }

  return vulnerabilitySummary;
}

export function parseSbom(stdout) {
  const sbom = JSON.parse(stdout);

  if (
    sbom?.bomFormat !== "CycloneDX" ||
    typeof sbom?.specVersion !== "string"
  ) {
    throw new Error("npm sbom did not return a valid CycloneDX document");
  }

  if (sbom?.metadata?.component?.name !== "nomsentry") {
    throw new Error("npm sbom did not describe the nomsentry package");
  }

  if (!Array.isArray(sbom?.components)) {
    throw new Error("npm sbom did not return a component list");
  }

  return sbom;
}

export function runSecurityBaselineCheck() {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "nomsentry-security-check-"),
  );
  const sbomPath = path.join(tempRoot, "sbom.cdx.json");

  try {
    const auditResult = runNpm(["audit", "--json", "--omit=dev"], {
      cwd: process.cwd(),
    });
    const vulnerabilities = parseAuditReport(auditResult.stdout);

    if (vulnerabilities.total !== 0) {
      throw new Error(
        `npm audit reported ${vulnerabilities.total} production vulnerabilities`,
      );
    }

    const sbomResult = runNpm(
      [
        "sbom",
        "--omit=dev",
        "--package-lock-only",
        "--sbom-format",
        "cyclonedx",
      ],
      {
        cwd: process.cwd(),
      },
    );
    const sbom = parseSbom(sbomResult.stdout);
    fs.writeFileSync(sbomPath, JSON.stringify(sbom, null, 2));

    if (fs.statSync(sbomPath).size <= 0) {
      throw new Error("Generated SBOM file was empty");
    }

    console.log("Dependency security audit passed");
    console.log("SBOM generation check passed");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runSecurityBaselineCheck();
}
