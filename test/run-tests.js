import assert from "node:assert/strict";
import fs from "node:fs";
import { createEngine } from "../src/core/evaluate.js";
import { applyAllowOverrides } from "../src/core/overrides.js";
import { username, tenantSlug, tenantName } from "../src/policies/index.js";
import { loadSourceFromFile, loadSourcesFromDirectory } from "../src/loaders/source-loader.js";
import { normalizeValue } from "../src/core/normalize.js";
import { validateSource } from "../src/schema/validate-source.js";
import { buildLdnoobwSource, parseLdnoobwWordList } from "../src/importers/ldnoobw.js";
import { build2ToadSource, get2ToadLanguages } from "../src/importers/toad-profanity.js";
import { buildObscenityEnglishSource } from "../src/importers/obscenity.js";
import { buildUsptoTrademarkSource, parseUsptoCaseFileCsv } from "../src/importers/uspto.js";
import { detectScriptRisk } from "../src/core/script-risk.js";

const syntheticPolicySource = {
  id: "synthetic-policy-source",
  rules: [
    {
      id: "synthetic/reserved-admin",
      term: "admin",
      category: "reservedTechnical",
      scopes: ["username", "tenantSlug"],
      match: "token",
      normalizationField: "confusableSkeleton"
    },
    {
      id: "synthetic/impersonation-support",
      term: "support",
      category: "impersonation",
      scopes: ["username", "tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton"
    },
    {
      id: "synthetic/impersonation-security",
      term: "security",
      category: "impersonation",
      scopes: ["username", "tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton"
    },
    {
      id: "synthetic/brand-openai",
      term: "openai",
      category: "protectedBrand",
      scopes: ["username", "tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton"
    },
    {
      id: "synthetic/brand-seven",
      term: "seven",
      category: "protectedBrand",
      scopes: ["tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton"
    }
  ],
  compositeRules: [
    {
      id: "synthetic/composite-security-support",
      term: "security+support",
      category: "compositeRisk",
      scopes: ["username", "tenantSlug", "tenantName"],
      allOf: ["security", "support"]
    }
  ]
};

const engine = createEngine({
  sources: [
    syntheticPolicySource,
    ...loadSourcesFromDirectory(new URL("../custom/sources/", import.meta.url))
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

assert.equal(
  loadSourceFromFile(new URL("../custom/sources/ldnoobw-en.json", import.meta.url)).metadata.source,
  "LDNOOBW",
  "ldnoobw source metadata should load from JSON"
);

assert.equal(
  loadSourceFromFile(new URL("../custom/sources/2toad-profanity-en.json", import.meta.url)).metadata.source,
  "@2toad/profanity",
  "2toad source metadata should load from JSON"
);

assert.equal(
  loadSourceFromFile(new URL("../custom/sources/obscenity-en.json", import.meta.url)).metadata.source,
  "obscenity",
  "obscenity source metadata should load from JSON"
);

{
  const records = parseUsptoCaseFileCsv(
    fs.readFileSync(new URL("./fixtures/uspto-case-file-sample.csv", import.meta.url), "utf8")
  );
  const source = buildUsptoTrademarkSource(records);
  assert.equal(source.metadata.source, "USPTO", "uspto importer should stamp source metadata");
  assert.deepEqual(
    source.rules.map((rule) => rule.term).sort(),
    ["azure", "openai"],
    "uspto importer should keep only live standard-character trademarks"
  );
}

assert.deepEqual(
  get2ToadLanguages(),
  ["ar", "de", "en", "es", "fr", "hi", "it", "ja", "ko", "pt", "ru", "zh"],
  "2Toad language inventory should be discoverable from the installed package"
);

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
  { value: "0penai", kind: "tenantSlug", expected: "review", label: "leet brand" },
  { value: "n!gga", kind: "tenantName", expected: "reject", label: "ldnoobw slur" },
  { value: "b!tch", kind: "tenantName", expected: "reject", label: "2toad leet term" },
  { value: "sh!t", kind: "tenantName", expected: "reject", label: "imported leet term" },
  { value: "sh/i/t", kind: "tenantName", expected: "reject", label: "slash-obfuscated profanity" },
  { value: "scheisse", kind: "tenantName", expected: "reject", label: "german ss variant should match scheiße" },
  { value: "schéisse", kind: "tenantName", expected: "reject", label: "accented german variant should match scheiße" },
  { value: "mérde", kind: "tenantName", expected: "reject", label: "accented french variant should match merde" },
  { value: "ad\u200Bmin", kind: "tenantSlug", expected: "reject", label: "zero width admin" },
  { value: "sup\u2060port", kind: "tenantSlug", expected: "reject", label: "word joiner support" },
  { value: "sup\u200Bport", kind: "tenantSlug", expected: "reject", label: "zero width support" },
  { value: "ad-min", kind: "tenantSlug", expected: "reject", label: "separator folded admin" },
  { value: "s_e_c_u_r_i_t_y-support", kind: "tenantSlug", expected: "reject", label: "separator obfuscated security support" },
  { value: "ѕupport", kind: "tenantSlug", expected: "reject", label: "cyrillic support homoglyph" },
  { value: "оpenai", kind: "tenantSlug", expected: "review", label: "cyrillic brand homoglyph" },
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
  const result = engine.evaluate({
    value: "s.h.i.t",
    kind: "tenantName"
  });

  assert.deepEqual(
    result.reasons.map((reason) => `${reason.category}:${reason.term}`),
    ["profanity:shit"],
    "equivalent terms imported from multiple sources should collapse to one reason"
  );
}

{
  const terms = parseLdnoobwWordList("\nshit\nSHIT\n#comment\nbitch \n");
  assert.deepEqual(terms, ["bitch", "shit"], "ldnoobw parser should normalize, dedupe and skip comments");

  const source = buildLdnoobwSource({
    id: "imported-ldnoobw-test",
    language: "en",
    terms
  });

  assert.equal(source.rules.length, 2, "ldnoobw importer should emit one rule per normalized term");
  assert.equal(source.rules[0].metadata.source, "LDNOOBW", "ldnoobw importer should stamp source metadata");
}

{
  const source = build2ToadSource({ language: "en" });
  assert.equal(source.metadata.source, "@2toad/profanity", "2toad importer should stamp source metadata");
  assert.equal(source.rules.some((rule) => rule.term === "bitch"), true, "2toad importer should expose canonicalized library terms");
}

{
  const source = buildObscenityEnglishSource();
  assert.equal(source.metadata.source, "obscenity", "obscenity importer should stamp source metadata");
  assert.equal(source.rules.some((rule) => rule.term === "anal"), true, "obscenity importer should expose original words");
}

{
  const variants = [
    ["admin", "adm1n", "tenantSlug", "reject"],
    ["admin", "ad-min", "tenantSlug", "reject"],
    ["admin", "ad\u200Bmin", "tenantSlug", "reject"],
    ["admin", "αdmin", "tenantSlug", "reject"],
    ["support", "supp0rt", "tenantSlug", "reject"],
    ["support", "sup\u2060port", "tenantSlug", "reject"],
    ["support", "ѕupport", "tenantSlug", "reject"],
    ["openai", "0penai", "tenantSlug", "review"],
    ["openai", "оpenai", "tenantSlug", "review"],
    ["scheiße", "scheisse", "tenantName", "reject"],
    ["merde", "mérde", "tenantName", "reject"],
    ["shit", "sh!t", "tenantName", "reject"],
    ["shit", "sh/i/t", "tenantName", "reject"],
    ["nigga", "n!gga", "tenantName", "reject"]
  ];

  for (const [canonical, candidate, kind, expected] of variants) {
    const result = engine.evaluate({ value: candidate, kind });
    assert.equal(result.decision, expected, `variant ${candidate} should normalize like ${canonical}`);
  }
}

{
  const normalized = normalizeValue("schéisse");
  assert.equal(normalized.latinFolded, "scheisse", "latin folding should remove accents");
  assert.equal(normalized.slug, "scheisse", "slug should track the hardened latin folding");
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
  const result = detectScriptRisk("abcمرحبا");
  assert.equal(result.mixed, true, "latin and arabic should trigger mixed-script risk");
}

console.log("All fixture tests passed");
