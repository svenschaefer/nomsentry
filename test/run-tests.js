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
      { category: "scriptRisk" }
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
    ["scriptRisk"],
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

for (const testCase of [
  { value: "adm1n", kind: "tenantSlug", expected: "reject", label: "leet admin" },
  { value: "supp0rt", kind: "tenantSlug", expected: "reject", label: "leet support" },
  { value: "s3curity", kind: "tenantSlug", expected: "reject", label: "leet security" },
  { value: "0penai", kind: "tenantSlug", expected: "reject", label: "leet brand" },
  { value: "H!Tler", kind: "tenantName", expected: "reject", label: "leet hate term" },
  { value: "n!gga", kind: "tenantName", expected: "reject", label: "leet slur" },
  { value: "ad\u200Bmin", kind: "tenantSlug", expected: "reject", label: "zero width admin" },
  { value: "sup\u200Bport", kind: "tenantSlug", expected: "reject", label: "zero width support" },
  { value: "ad-min", kind: "tenantSlug", expected: "reject", label: "separator folded admin" },
  { value: "s_e_c_u_r_i_t_y-support", kind: "tenantSlug", expected: "reject", label: "separator obfuscated security support" },
  { value: "ѕupport", kind: "tenantSlug", expected: "reject", label: "cyrillic support homoglyph" },
  { value: "оpenai", kind: "tenantSlug", expected: "reject", label: "cyrillic brand homoglyph" },
  { value: "αdmin", kind: "tenantSlug", expected: "reject", label: "greek mixed script admin homoglyph" },
  { value: "раypal", kind: "tenantName", expected: "review", label: "mixed script tenant name" },
  { value: "Ａdmin", kind: "tenantSlug", expected: "reject", label: "nfkc fullwidth admin" },
  { value: "normal-company", kind: "tenantSlug", expected: "allow", label: "normal slug" },
  { value: "cybersecurity-support", kind: "tenantSlug", expected: "reject", label: "no composite false positive regression" },
  { value: "securite", kind: "tenantName", expected: "allow", label: "foreign language lookalike should not match" },
  { value: "müller", kind: "tenantName", expected: "allow", label: "latin diacritics should remain allowed" },
  { value: "sécurité", kind: "tenantName", expected: "allow", label: "foreign language with accent should remain allowed" }
]) {
  const result = engine.evaluate({
    value: testCase.value,
    kind: testCase.kind
  });

  assert.equal(result.decision, testCase.expected, testCase.label);
}

{
  const variants = [
    ["admin", "adm1n", "tenantSlug", "reject"],
    ["admin", "ad-min", "tenantSlug", "reject"],
    ["admin", "ad\u200Bmin", "tenantSlug", "reject"],
    ["admin", "αdmin", "tenantSlug", "reject"],
    ["support", "supp0rt", "tenantSlug", "reject"],
    ["support", "ѕupport", "tenantSlug", "reject"],
    ["openai", "0penai", "tenantSlug", "reject"],
    ["openai", "оpenai", "tenantSlug", "reject"],
    ["hitler", "H!Tler", "tenantName", "reject"],
    ["nigga", "n!gga", "tenantName", "reject"]
  ];

  for (const [canonical, candidate, kind, expected] of variants) {
    const result = engine.evaluate({ value: candidate, kind });
    assert.equal(result.decision, expected, `variant ${candidate} should normalize like ${canonical}`);
  }
}

{
  for (const testCase of [
    { value: "αdmin", kind: "tenantSlug" },
    { value: "раypal", kind: "tenantName" },
    { value: "оpenai", kind: "tenantSlug" }
  ]) {
    const result = engine.evaluate(testCase);
    assert.equal(
      result.reasons.some((reason) => reason.category === "scriptRisk"),
      true,
      `${testCase.value} should surface scriptRisk`
    );
  }
}

{
  const result = engine.evaluate({
    value: "cybersecurity-support",
    kind: "tenantSlug"
  });

  assert.equal(
    result.reasons.some((reason) => reason.category === "compositeRisk"),
    false,
    "substring-only security should not trigger compositeRisk"
  );
}

console.log("All fixture tests passed");
