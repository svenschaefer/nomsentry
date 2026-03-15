import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildIntegrityTargets,
  DEFAULT_SOURCE_INTEGRITY_LOCK_FILE,
  DEFAULT_SOURCE_REFRESH_POLICY_FILE,
  validateSourceIntegrityLock,
} from "./source-integrity.js";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    inputDir: path.resolve(process.cwd(), "custom", "sources"),
    policyFile: DEFAULT_SOURCE_REFRESH_POLICY_FILE,
    lockFile: DEFAULT_SOURCE_INTEGRITY_LOCK_FILE,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--input-dir") {
      options.inputDir = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--policy-file") {
      options.policyFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--lock-file") {
      options.lockFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

export function evaluateSourceIntegrity({ targets, lock }) {
  const entriesByFile = new Map(
    lock.entries.map((entry) => [entry.file, entry]),
  );

  for (const target of targets) {
    const entry = entriesByFile.get(target.file);
    if (!entry) {
      throw new Error(`Missing source integrity entry for ${target.file}`);
    }
    for (const key of ["id", "source", "fetchUrl", "sourceArtifactSha256"]) {
      if (entry[key] !== target[key]) {
        throw new Error(
          `Source integrity mismatch for ${target.file}: expected ${key}=${target[key]}, received ${entry[key]}`,
        );
      }
    }
  }

  if (entriesByFile.size !== targets.length) {
    throw new Error(
      `Source integrity lock contains ${entriesByFile.size} entries, expected ${targets.length}`,
    );
  }

  return targets.length;
}

function main(argv) {
  const options = parseArgs(argv);
  const policy = readJson(options.policyFile);
  const lock = validateSourceIntegrityLock(readJson(options.lockFile));
  const targets = buildIntegrityTargets(options.inputDir, policy);
  const count = evaluateSourceIntegrity({ targets, lock });
  console.log(`Source integrity check passed (${count} artifacts)`);
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
