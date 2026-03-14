#!/usr/bin/env node

import { createEngine } from "../src/core/evaluate.js";
import { username, tenantSlug, tenantName } from "../src/policies/index.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";

const COMMANDS = new Set(["check", "explain"]);
const POLICIES = [username(), tenantSlug(), tenantName()];
const KINDS = new Set(POLICIES.flatMap((policy) => policy.appliesTo || []));
const EXIT_USAGE = 64;
const EXIT_VALIDATION = 65;
const EXIT_RUNTIME = 70;

function parseArgs(argv) {
  const args = [...argv];
  const options = {};
  const positional = [];

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--namespace") {
      options.namespace = args.shift();
    } else {
      positional.push(token);
    }
  }

  return { positional, options };
}

function printUsage() {
  console.log("Usage:");
  console.log("  nomsentry check <kind> <value> [--namespace <ns>]");
  console.log("  nomsentry explain <kind> <value> [--namespace <ns>]");
}

function createCliEngine() {
  return createEngine({
    sources: [loadRuntimeBundleFromFile(new URL("../dist/runtime-sources.json", import.meta.url))],
    policies: POLICIES,
    allowOverrides: [
      {
        id: "allow/internal-support",
        term: "support",
        scopes: ["tenantSlug"],
        match: "exact",
        conditions: { namespace: ["internal"] },
        override: {
          action: "allow",
          suppressCategories: ["impersonation"]
        }
      }
    ]
  });
}

function main(argv) {
  const { positional, options } = parseArgs(argv);
  const [command, kind, value] = positional;

  if (!command || !kind || !value) {
    printUsage();
    return EXIT_USAGE;
  }

  if (!COMMANDS.has(command)) {
    console.error(`Unknown command: ${command}`);
    return EXIT_VALIDATION;
  }

  if (!KINDS.has(kind)) {
    console.error(`Unknown kind: ${kind}`);
    return EXIT_VALIDATION;
  }

  const engine = createCliEngine();
  const result = engine.evaluate({
    kind,
    value,
    context: {
      namespace: options.namespace
    }
  });

  if (command === "check") {
    console.log(result.decision);
    return 0;
  }

  console.log(JSON.stringify(result, null, 2));
  return 0;
}

try {
  process.exit(main(process.argv.slice(2)));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(EXIT_RUNTIME);
}
