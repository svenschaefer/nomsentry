import assert from "node:assert/strict";
import fs from "node:fs";
import { createEngine } from "../src/core/evaluate.js";
import { applyAllowOverrides } from "../src/core/overrides.js";
import { reserved, impersonation, profanity, product } from "../src/sources/index.js";
import { username, tenantSlug, tenantName } from "../src/policies/index.js";
import { loadSourceFromFile } from "../src/loaders/source-loader.js";
import { normalizeValue } from "../src/core/normalize.js";
import { validateSource } from "../src/schema/validate-source.js";

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

{
  const result = applyAllowOverrides({
    normalized: normalizeValue("support"),
    kind: "tenantSlug",
    provisional: "reject",
    reasons: [
      { category: "impersonation" },
      { category: "profanity" }
    ],
    policy: tenantSlug(),
    overrides: [
      {
        id: "allow/internal-support",
        term: "support",
        scopes: ["tenantSlug"],
        match: "exact",
        override: {
          action: "allow",
          suppressCategories: ["impersonation"]
        }
      }
    ],
    context: {}
  });

  assert.equal(result.decision, "review", "override suppression should recompute the final outcome");
  assert.deepEqual(
    result.reasons.map((reason) => reason.category),
    ["profanity"],
    "override suppression should remove only the suppressed categories"
  );
}

{
  const result = engine.evaluate({
    value: "cybersecurity-support",
    kind: "tenantSlug"
  });

  assert.equal(result.decision, "reject", "support token should still be rejected");
  assert.equal(
    result.reasons.some((reason) => reason.category === "compositeRisk"),
    false,
    "composite risk should not trigger on substring-only matches"
  );
}

assert.throws(
  () => validateSource({ id: "invalid-source", compositeRules: [{}] }),
  /source\.compositeRules\[0\]\.id must be a non-empty string/,
  "composite rules should be fully schema-validated"
);

console.log("All fixture tests passed");
