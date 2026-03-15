import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { writeTextFileAtomic } from "../src/schema/source-io.js";
import {
  buildSourceIntegrityLock,
  DEFAULT_SOURCE_INTEGRITY_LOCK_FILE,
  DEFAULT_SOURCE_REFRESH_POLICY_FILE,
} from "./source-integrity.js";

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

export function writeSourceIntegrityLock(lockFile, lock) {
  writeTextFileAtomic(lockFile, `${JSON.stringify(lock, null, 2)}\n`);
}

async function main(argv) {
  const options = parseArgs(argv);
  const policy = JSON.parse(fs.readFileSync(options.policyFile, "utf8"));
  const lock = await buildSourceIntegrityLock(options.inputDir, { policy });
  writeSourceIntegrityLock(options.lockFile, lock);
  console.log(`Wrote ${options.lockFile} (${lock.entries.length} entries)`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
