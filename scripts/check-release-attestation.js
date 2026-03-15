import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_WORKFLOW_FILE = path.resolve(
  process.cwd(),
  ".github",
  "workflows",
  "release-publish.yml",
);

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    workflowFile: DEFAULT_WORKFLOW_FILE,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--workflow-file") {
      options.workflowFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

export function evaluateReleaseWorkflow(workflowText) {
  const errors = [];
  const text = String(workflowText ?? "");

  if (!/id-token:\s*write\b/i.test(text)) {
    errors.push("release workflow must request id-token: write permissions");
  }
  if (!/npm\s+publish\b[^\n]*--provenance\b/i.test(text)) {
    errors.push("release workflow must publish with npm --provenance");
  }
  if (!/NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN\s*\}\}/i.test(text)) {
    errors.push("release workflow must read npm auth from secrets.NPM_TOKEN");
  }

  return errors;
}

function main(argv) {
  const options = parseArgs(argv);
  if (!fs.existsSync(options.workflowFile)) {
    throw new Error(`Missing release workflow file: ${options.workflowFile}`);
  }

  const text = fs.readFileSync(options.workflowFile, "utf8");
  const errors = evaluateReleaseWorkflow(text);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Release attestation check passed (${path.relative(process.cwd(), options.workflowFile).replace(/\\/g, "/")})`,
  );
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
