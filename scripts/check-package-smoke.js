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

export function parsePackOutput(stdout) {
  const parsed = JSON.parse(stdout);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("npm pack --json returned no package entries");
  }

  const filename = parsed[0]?.filename;
  if (typeof filename !== "string" || filename.length === 0) {
    throw new Error("npm pack --json did not return a tarball filename");
  }

  return filename;
}

export function buildPackageSmokeScript() {
  return `
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createEngine,
  builtinPolicies,
  defaultPolicies,
  loadRuntimeBundle,
  validateSource,
} from "nomsentry";

const policyNames = Object.keys(builtinPolicies).sort();
assert.deepEqual(policyNames, ["tenantName", "tenantSlug", "username"]);
const defaultPolicyNames = Object.keys(defaultPolicies).sort();
assert.deepEqual(defaultPolicyNames, ["tenantName", "tenantSlug", "username"]);
assert.equal(typeof createEngine, "function");
assert.equal(typeof loadRuntimeBundle, "function");
assert.equal(typeof validateSource, "function");

const runtimeBundle = loadRuntimeBundle();
const engine = createEngine({
  sources: [runtimeBundle],
  policies: [
    defaultPolicies.username,
    defaultPolicies.tenantSlug,
    defaultPolicies.tenantName,
  ],
});

const result = engine.evaluate({ kind: "tenantName", value: "depp" });
assert.equal(result.decision, "reject");
console.log("Package smoke check passed");
`.trim();
}

export function runPackageSmokeCheck() {
  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "nomsentry-package-smoke-"),
  );
  const installDir = path.join(tempRoot, "install");
  const packDir = path.join(tempRoot, "pack");
  fs.mkdirSync(installDir, { recursive: true });
  fs.mkdirSync(packDir, { recursive: true });

  try {
    fs.writeFileSync(
      path.join(installDir, "package.json"),
      JSON.stringify({ name: "nomsentry-smoke", private: true }),
    );

    const packResult = runNpm(
      ["pack", "--json", "--pack-destination", packDir],
      { cwd: process.cwd() },
    );
    const tarball = path.join(packDir, parsePackOutput(packResult.stdout));

    runNpm(["install", "--ignore-scripts", "--no-package-lock", tarball], {
      cwd: installDir,
    });

    const packageCheck = runCommand(
      process.execPath,
      ["--input-type=module", "--eval", buildPackageSmokeScript()],
      { cwd: installDir },
    );

    const cliPath = path.join(
      installDir,
      "node_modules",
      "nomsentry",
      "bin",
      "nomsentry.js",
    );
    const cliCheck = runCommand(
      process.execPath,
      [cliPath, "check", "tenantName", "depp"],
      { cwd: installDir },
    );

    if (cliCheck.stdout.trim() !== "reject") {
      throw new Error(
        `Installed CLI smoke check returned unexpected output: ${cliCheck.stdout.trim()}`,
      );
    }

    console.log(packageCheck.stdout.trim());
    console.log("Installed CLI smoke check passed");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runPackageSmokeCheck();
}
