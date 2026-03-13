import assert from "node:assert/strict";
import fs from "node:fs";
import { createEngine } from "../src/core/evaluate.js";
import { reserved, impersonation, profanity, product } from "../src/sources/index.js";
import { username, tenantSlug, tenantName } from "../src/policies/index.js";
import { loadSourceFromFile } from "../src/loaders/source-loader.js";

const engine = createEngine({
  sources: [
    reserved(),
    impersonation(),
    profanity(),
    product(),
    loadSourceFromFile(new URL("../custom/sources/example-custom.json", import.meta.url))
  ],
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

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));
}

for (const name of ["allow", "reject", "review"]) {
  for (const testCase of loadFixture(name)) {
    const result = engine.evaluate({
      value: testCase.value,
      kind: testCase.kind,
      context: testCase.context || {}
    });
    assert.equal(result.decision, testCase.expected, `${name}: ${testCase.value}`);
  }
}

console.log("All fixture tests passed");
