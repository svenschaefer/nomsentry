#!/usr/bin/env node

import { createEngine } from "../src/core/evaluate.js";
import { username, tenantSlug, tenantName } from "../src/policies/index.js";
import { loadSourcesFromDirectory } from "../src/loaders/source-loader.js";

const engine = createEngine({
  sources: [...loadSourcesFromDirectory(new URL("../custom/sources/", import.meta.url))],
  policies: [username(), tenantSlug(), tenantName()],
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

const { positional, options } = parseArgs(process.argv.slice(2));
const [command, kind, value] = positional;

if (!command || !kind || !value) {
  console.log("Usage:");
  console.log("  nomsentry check <kind> <value> [--namespace <ns>]");
  console.log("  nomsentry explain <kind> <value> [--namespace <ns>]");
  process.exit(1);
}

const result = engine.evaluate({
  kind,
  value,
  context: {
    namespace: options.namespace
  }
});

if (command === "check") {
  console.log(result.decision);
  process.exit(0);
}

if (command === "explain") {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log(`Unknown command: ${command}`);
process.exit(1);
