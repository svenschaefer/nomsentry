import assert from "node:assert/strict";
import fs from "node:fs";
import { createEngine } from "../src/core/evaluate.js";
import { applyAllowOverrides } from "../src/core/overrides.js";
import { username, tenantSlug, tenantName } from "../src/policies/index.js";
import { loadSourceFromFile, loadSourcesFromDirectory } from "../src/loaders/source-loader.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";
import { normalizeValue } from "../src/core/normalize.js";
import { validateSource } from "../src/schema/validate-source.js";
import { buildLdnoobwSource, parseLdnoobwWordList } from "../src/importers/ldnoobw.js";
import { build2ToadSource, get2ToadLanguages } from "../src/importers/toad-profanity.js";
import { buildObscenityEnglishSource } from "../src/importers/obscenity.js";
import { buildCussSource, getCussLanguages } from "../src/importers/cuss.js";
import { buildDsojevicSource } from "../src/importers/dsojevic-profanity.js";
import {
  buildUsptoTrademarkSource,
  buildUsptoTrademarkSourceFromCsvFile,
  deriveUsptoBrandRiskSource,
  parseUsptoCaseFileCsv,
  splitUsptoTrademarkSource
} from "../src/importers/uspto.js";
import { detectScriptRisk } from "../src/core/script-risk.js";
import { compactSource } from "../src/schema/source-format.js";

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
    ...loadSourcesFromDirectory(new URL("../custom/sources/", import.meta.url)).filter(
      (source) => !source.id.startsWith("imported-uspto-trademarks-")
    )
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

assert.equal(
  loadSourceFromFile(new URL("../custom/sources/cuss-en.json", import.meta.url)).metadata.source,
  "cuss",
  "cuss source metadata should load from JSON"
);

assert.equal(
  loadSourceFromFile(new URL("../custom/sources/dsojevic-profanity-en.json", import.meta.url)).metadata.source,
  "dsojevic/profanity-list",
  "dsojevic source metadata should load from JSON"
);

assert.equal(
  loadSourcesFromDirectory(new URL("../custom/sources/", import.meta.url)).some(
    (source) => source.id === "imported-rfc2142-role-mailboxes"
  ),
  true,
  "directory loader should include official role-mailbox source"
);

{
  const bundle = loadRuntimeBundleFromFile(new URL("../dist/runtime-sources.json", import.meta.url));
  assert.equal(
    bundle.rules.some((rule) => rule.term === "abuse" && rule.category === "impersonation"),
    true,
    "runtime bundle should expose flattened rules"
  );
  assert.equal(
    bundle.compositeRules.some((rule) => rule.term === "security+support"),
    true,
    "runtime bundle should expose flattened composite rules"
  );
}

{
  const records = parseUsptoCaseFileCsv(
    fs.readFileSync(new URL("./fixtures/uspto-case-file-sample.csv", import.meta.url), "utf8")
  ).map((record) => ({ ...record, trade_mark_in: "1" }));
  const source = buildUsptoTrademarkSource(records);
  assert.equal(source.metadata.source, "USPTO", "uspto importer should stamp source metadata");
  assert.deepEqual(
    source.rules.map((rule) => rule.term).sort(),
    ["azure", "mega corp", "openai"],
    "uspto importer should keep only live standard-character trademarks and service marks"
  );
}

{
  const records = parseUsptoCaseFileCsv(
    fs.readFileSync(new URL("./fixtures/uspto-case-file-alt-sample.csv", import.meta.url), "utf8")
  ).map((record) => ({ ...record, trade_mark_in: "1" }));
  const source = buildUsptoTrademarkSource(records);
  assert.deepEqual(
    source.rules.map((rule) => rule.term),
    ["github"],
    "uspto importer should handle alternate column names and live/dead codes"
  );
}

{
  const source = await buildUsptoTrademarkSourceFromCsvFile(
    new URL("./fixtures/uspto-case-file-alt-sample.csv", import.meta.url)
  );
  assert.deepEqual(
    source.rules.map((rule) => rule.term),
    ["github"],
    "uspto file importer should stream and produce the same filtered result"
  );
}

{
  const source = buildUsptoTrademarkSource([
    {
      serial_no: "1",
      registration_no: "1",
      mark_id_char: "Alpha",
      mark_draw_cd: "4000",
      cfh_status_cd: "800",
      trade_mark_in: "1",
      serv_mark_in: "0"
    },
    {
      serial_no: "2",
      registration_no: "2",
      mark_id_char: "Beta",
      mark_draw_cd: "4000",
      cfh_status_cd: "800",
      trade_mark_in: "0",
      serv_mark_in: "1"
    },
    {
      serial_no: "3",
      registration_no: "3",
      mark_id_char: "Gamma",
      mark_draw_cd: "4000",
      cfh_status_cd: "800",
      trade_mark_in: "1",
      serv_mark_in: "0"
    }
  ], { id: "imported-uspto-trademarks" });
  const chunks = splitUsptoTrademarkSource(source, { chunkSize: 2 });
  assert.deepEqual(
    chunks.map((chunk) => ({ id: chunk.id, size: chunk.rules.length })),
    [
      { id: "imported-uspto-trademarks-001", size: 2 },
      { id: "imported-uspto-trademarks-002", size: 1 }
    ],
    "uspto source splitting should create stable chunk ids and sizes"
  );
}

{
  const source = buildUsptoTrademarkSource([
    {
      serial_no: "1",
      registration_no: "1",
      mark_id_char: "Superbrandname",
      mark_draw_cd: "4000",
      cfh_status_cd: "800",
      trade_mark_in: "1"
    },
    {
      serial_no: "2",
      registration_no: "2",
      mark_id_char: "Silver Rocket",
      mark_draw_cd: "4000",
      cfh_status_cd: "800",
      trade_mark_in: "1"
    },
    {
      serial_no: "3",
      registration_no: "3",
      mark_id_char: "AB",
      mark_draw_cd: "4000",
      cfh_status_cd: "800",
      trade_mark_in: "1"
    },
    {
      serial_no: "4",
      registration_no: "4",
      mark_id_char: "Alpha 360",
      mark_draw_cd: "4000",
      cfh_status_cd: "800",
      trade_mark_in: "1"
    },
    {
      serial_no: "5",
      registration_no: "5",
      mark_id_char: "tiny app suite",
      mark_draw_cd: "4000",
      cfh_status_cd: "800",
      trade_mark_in: "1"
    }
  ], { id: "imported-uspto-trademarks" });
  const derived = deriveUsptoBrandRiskSource(source, {
    singleWordMinLength: 12,
    multiWordMinTokenLength: 5,
    maxWords: 2,
    allowDigits: false
  });
  assert.deepEqual(
    derived.rules.map((rule) => rule.term).sort(),
    ["silver rocket", "superbrandname"],
    "uspto derived risk subset should keep only structurally stronger review candidates"
  );
}

assert.deepEqual(
  get2ToadLanguages(),
  ["ar", "de", "en", "es", "fr", "hi", "it", "ja", "ko", "pt", "ru", "zh"],
  "2Toad language inventory should be discoverable from the installed package"
);

assert.deepEqual(
  getCussLanguages(),
  ["ar-latn", "en", "es", "fr", "it", "pt", "pt-pt"],
  "cuss language inventory should be discoverable from the installed package"
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

assert.throws(
  () => validateSource({
    id: "invalid-metadata",
    metadata: { tags: ["ok", 123] }
  }),
  /source\.metadata\.tags\[1\] must be a non-empty string/,
  "metadata tag arrays should enforce strings"
);

{
  const compact = compactSource({
    id: "compact-test",
    metadata: { source: "test" },
    rules: [
      {
        id: "compact-test/a",
        term: "alpha",
        category: "profanity",
        scopes: ["username"],
        match: "token",
        severity: "low",
        normalizationField: "confusableSkeleton",
        metadata: { source: "test", notes: "n1" }
      },
      {
        id: "compact-test/b",
        term: "beta",
        category: "profanity",
        scopes: ["username"],
        match: "token",
        severity: "high",
        normalizationField: "confusableSkeleton",
        metadata: { source: "test", notes: "n2" }
      }
    ]
  });
  const validated = validateSource(compact);
  assert.deepEqual(
    validated.rules.map((rule) => ({ id: rule.id, term: rule.term, notes: rule.metadata?.notes })),
    [
      { id: "compact-test/a", term: "alpha", notes: "n1" },
      { id: "compact-test/b", term: "beta", notes: "n2" }
    ],
    "compact sources should expand and validate to the canonical rule model"
  );
}

{
  const severityEngine = createEngine({
    sources: [{
      id: "severity-test-source",
      rules: [
        {
          id: "severity-test-source/heck",
          term: "heck",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token",
          severity: "low",
          normalizationField: "confusableSkeleton"
        },
        {
          id: "severity-test-source/slurx",
          term: "slurx",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token",
          severity: "high",
          normalizationField: "confusableSkeleton"
        }
      ]
    }],
    policies: [{
      id: "severity-test-policy",
      appliesTo: ["tenantName"],
      decisionMatrix: {
        profanity: {
          low: "review",
          high: "reject",
          default: "review"
        }
      }
    }]
  });
  assert.equal(
    severityEngine.evaluate({ value: "heck", kind: "tenantName" }).decision,
    "review",
    "severity-aware policies should allow category-level review for low severity"
  );
  assert.equal(
    severityEngine.evaluate({ value: "slurx", kind: "tenantName" }).decision,
    "reject",
    "severity-aware policies should escalate high-severity rules"
  );
}

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
  const result = applyAllowOverrides({
    normalized: normalizeValue("support"),
    kind: "tenantSlug",
    provisional: "reject",
    reasons: [{ category: "impersonation" }],
    policy: tenantSlug(),
    overrides: [
      {
        id: "allow/internal-support",
        term: "support",
        scopes: ["tenantSlug"],
        match: "exact",
        override: {
          action: "allow"
        }
      }
    ],
    context: {}
  });

  assert.equal(result.decision, "allow", "explicit allow override should force allow");
  assert.equal(result.override?.action, "allow", "explicit allow override should surface its action");
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
  const result = engine.evaluate({
    value: "0penai",
    kind: "tenantSlug"
  });

  assert.equal(result.provisionalDecision, "review", "brand hits should be review under current policy");
  assert.deepEqual(
    result.reasons.map((reason) => reason.category),
    ["protectedBrand"],
    "brand hits should surface the protectedBrand category"
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
  const source = buildCussSource({ language: "en" });
  assert.equal(source.metadata.source, "cuss", "cuss importer should stamp source metadata");
  assert.equal(source.rules.some((rule) => rule.term === "abbo"), true, "cuss importer should expose rated words");
  assert.equal(source.rules.some((rule) => rule.term === "adult"), false, "cuss importer should skip zero-rated entries");
}

{
  const source = buildDsojevicSource({
    language: "en",
    entries: [
      { id: "simple", match: "dumb|d*mb", tags: ["general"], severity: 2 },
      { id: "shock", match: "2 girls 1 cup|2g1c", tags: ["shock"], severity: 4, exceptions: ["x*"] }
    ]
  });
  assert.equal(source.metadata.source, "dsojevic/profanity-list", "dsojevic importer should stamp source metadata");
  assert.equal(source.rules.some((rule) => rule.term === "dumb"), true, "dsojevic importer should keep literal matches");
  assert.equal(source.rules.some((rule) => rule.term === "dmb"), false, "dsojevic importer should skip wildcard patterns");
  assert.equal(
    source.rules.some((rule) => rule.id.includes("/shock/")),
    true,
    "dsojevic importer should keep literal multi-word matches"
  );
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
    ["nigga", "n!gga", "tenantName", "reject"],
    ["abbo", "abbo", "tenantName", "reject"]
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
  const normalized = normalizeValue("A+\u2060B");
  assert.equal(normalized.leetFolded, "atb", "plus signs should fold as leetspeak before separator handling");
  assert.equal(normalized.separatorFolded, "atb", "word joiners should be removed before tokenization");
}

{
  const unconfigured = createEngine({ sources: [], policies: [] });
  assert.throws(
    () => unconfigured.evaluate({ value: "test", kind: "tenantSlug" }),
    /No policy configured for kind: tenantSlug/,
    "engine should fail loudly when no policy exists"
  );
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

{
  const result = detectScriptRisk("abc漢字");
  assert.equal(result.mixed, true, "latin and han should trigger mixed-script risk");
}

{
  const result = detectScriptRisk("abcעברית");
  assert.equal(result.mixed, true, "latin and hebrew should trigger mixed-script risk");
}

console.log("All fixture tests passed");
