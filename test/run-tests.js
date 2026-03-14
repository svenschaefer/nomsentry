import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createEngine } from "../src/core/evaluate.js";
import { applyAllowOverrides } from "../src/core/overrides.js";
import { username, tenantSlug, tenantName } from "../src/policies/index.js";
import { loadSourceFromFile, loadSourcesFromDirectory } from "../src/loaders/source-loader.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";
import { normalizeValue } from "../src/core/normalize.js";
import { validateSource } from "../src/schema/validate-source.js";
import { serializeSource, writeTextFileAtomic } from "../src/schema/source-io.js";
import { buildLdnoobwSource, parseLdnoobwWordList } from "../src/importers/ldnoobw.js";
import { build2ToadSource, get2ToadLanguages } from "../src/importers/toad-profanity.js";
import { buildObscenityEnglishSource } from "../src/importers/obscenity.js";
import { buildCussSource, getCussLanguages } from "../src/importers/cuss.js";
import { buildDsojevicSource } from "../src/importers/dsojevic-profanity.js";
import {
  buildInsultWikiSource,
  extractInsultWikiTerms,
  fetchInsultWikiTerms,
  getInsultWikiLanguages
} from "../src/importers/insult-wiki.js";
import {
  buildGitLabReservedNamesSource,
  extractGitLabReservedNames,
  fetchGitLabReservedNames
} from "../src/importers/gitlab-reserved-names.js";
import {
  buildUsptoTrademarkSource,
  buildUsptoTrademarkSourceFromCsvFile,
  deriveUsptoBrandRiskSource,
  parseUsptoCaseFileCsv,
  splitUsptoTrademarkSource
} from "../src/importers/uspto.js";
import { detectScriptRisk } from "../src/core/script-risk.js";
import { buildRuleIndex, matchRules } from "../src/core/matchers.js";
import { compactSource, expandSource } from "../src/schema/source-format.js";
import { buildRuntimeBundle, writeRuntimeBundle } from "../scripts/build-runtime-sources.js";
import { buildProvenanceManifest, writeProvenanceManifest } from "../scripts/build-provenance-manifest.js";
import {
  assessFreshness,
  findRefreshPolicy,
  resolveAsOfDate,
  validateRefreshPolicy
} from "../scripts/check-source-freshness.js";
import { compactSourcesDirectory, resolveCompactFilename } from "../scripts/compact-sources.js";
import {
  fetchAvailableLanguages as fetchLdnoobwLanguages,
  fetchWordList as fetchLdnoobwWordList
} from "../scripts/import-ldnoobw.js";
import { fetchLanguage as fetchDsojevicLanguage } from "../scripts/import-dsojevic-profanity.js";

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

const maintainedEngine = createEngine({
  sources: loadSourcesFromDirectory(new URL("../custom/sources/", import.meta.url)).filter(
    (source) => !source.id.startsWith("imported-uspto-trademarks-")
  ),
  policies: [username(), tenantSlug(), tenantName()]
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

for (const fixtureName of [
  "catalog-maintained-positives",
  "catalog-maintained-false-positives",
  "catalog-maintained-obfuscated-positives",
  "catalog-maintained-mixed-script",
  "catalog-documented-current-gaps"
]) {
  for (const group of loadFixture(fixtureName)) {
    for (const value of group.values) {
      const result = maintainedEngine.evaluate({
        value,
        kind: group.kind
      });
      assert.equal(result.decision, group.expected, `${fixtureName}/${group.label}: ${value}`);
    }
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
  loadSourceFromFile(new URL("../custom/sources/insult-wiki-en.json", import.meta.url)).metadata.source,
  "insult.wiki",
  "insult.wiki english source metadata should load from JSON"
);

assert.equal(
  loadSourceFromFile(new URL("../custom/sources/insult-wiki-de.json", import.meta.url)).metadata.source,
  "insult.wiki",
  "insult.wiki german source metadata should load from JSON"
);

assert.equal(
  loadSourceFromFile(new URL("../custom/sources/gitlab-reserved-names.json", import.meta.url)).metadata.source,
  "GitLab Docs",
  "gitlab reserved names metadata should load from JSON"
);

assert.equal(
  loadSourcesFromDirectory(new URL("../custom/sources/", import.meta.url)).some(
    (source) => source.id === "imported-rfc2142-role-mailboxes"
  ),
  true,
  "directory loader should include official role-mailbox source"
);

{
  const manifest = JSON.parse(fs.readFileSync(new URL("../dist/build-manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.id, "build-provenance-manifest", "build manifest should have a stable id");
  assert.equal(manifest.version, 1, "build manifest should have a stable version");
  assert.equal(
    manifest.sourceArtifacts.some((entry) => entry.id === "imported-gitlab-reserved-names" && entry.source === "GitLab Docs"),
    true,
    "build manifest should enumerate maintained source artifacts"
  );
  assert.equal(
    manifest.runtimeArtifact.sourceArtifactSetSha256,
    manifest.sourceArtifactSetSha256,
    "build manifest should tie the runtime artifact to the exact source artifact set"
  );
}

{
  const refreshPolicy = validateRefreshPolicy(
    JSON.parse(fs.readFileSync(new URL("../source-refresh-policy.json", import.meta.url), "utf8"))
  );
  const ldnoobwPolicy = findRefreshPolicy(refreshPolicy, { source: "LDNOOBW" });
  assert.equal(ldnoobwPolicy?.maxAgeDays, 180, "refresh policy lookup should match on source name");
  assert.equal(resolveAsOfDate("2026-03-14"), "2026-03-14", "freshness checks should accept ISO date inputs");
}

assert.throws(
  () => validateRefreshPolicy({ id: "bad", version: 1, policies: [] }),
  /source refresh policy must have id 'source-refresh-policy'/,
  "refresh policy validation should require the stable policy id"
);

{
  const results = assessFreshness({
    manifest: {
      sourceArtifacts: [
        { file: "custom/sources/example-a.json", id: "a", source: "LDNOOBW" },
        { file: "custom/sources/example-b.json", id: "b", source: "RFC 2142" }
      ]
    },
    policy: {
      id: "source-refresh-policy",
      version: 1,
      policies: [
        { match: { source: "LDNOOBW" }, maxAgeDays: 180 },
        { match: { source: "RFC 2142" }, maxAgeDays: 3650 }
      ]
    },
    asOfDate: "2026-03-14",
    getCommitDate(filePath) {
      if (filePath.endsWith("example-a.json")) return "2026-03-01";
      return "2020-01-01";
    }
  });
  assert.deepEqual(
    results.map((entry) => ({ file: entry.file, stale: entry.stale })),
    [
      { file: "custom/sources/example-a.json", stale: false },
      { file: "custom/sources/example-b.json", stale: false }
    ],
    "freshness assessment should apply policy-specific age limits"
  );
}

assert.throws(
  () => assessFreshness({
    manifest: {
      sourceArtifacts: [
        { file: "custom/sources/example.json", id: "x", source: "Unknown Source" }
      ]
    },
    policy: {
      id: "source-refresh-policy",
      version: 1,
      policies: [{ match: { source: "LDNOOBW" }, maxAgeDays: 180 }]
    },
    asOfDate: "2026-03-14",
    getCommitDate() {
      return "2026-03-01";
    }
  }),
  /No refresh policy found/,
  "freshness assessment should fail fast for unmanaged sources"
);

{
  const runScript = (scriptName, ...args) =>
    spawnSync(process.execPath, [fileURLToPath(new URL(`../scripts/${scriptName}`, import.meta.url)), ...args], {
      encoding: "utf8"
    });

  const freshnessBadDate = runScript("check-source-freshness.js", "--as-of", "20260314");
  assert.equal(freshnessBadDate.status, 1, "freshness checks should reject malformed as-of dates");
  assert.match(
    freshnessBadDate.stderr,
    /Invalid --as-of date: 20260314/,
    "freshness checks should surface direct argument validation errors"
  );

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-freshness-policy-"));
  const badPolicyFile = path.join(tmpDir, "bad-policy.json");
  fs.writeFileSync(badPolicyFile, JSON.stringify({ id: "bad", version: 1, policies: [] }), "utf8");
  const freshnessBadPolicy = runScript("check-source-freshness.js", "--policy-file", badPolicyFile);
  assert.equal(freshnessBadPolicy.status, 1, "freshness checks should reject invalid policy files");
  assert.match(
    freshnessBadPolicy.stderr,
    /source refresh policy must have id 'source-refresh-policy'/,
    "freshness checks should surface refresh-policy validation errors"
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

{
  const indexedRules = [
    {
      id: "indexed/openai",
      term: "openai",
      normalizedTerm: "openai",
      category: "protectedBrand",
      scopes: ["tenantSlug"],
      match: "token",
      normalizationField: "confusableSkeleton",
      _order: 0
    },
    {
      id: "indexed/create-dir",
      term: "create-dir",
      normalizedTerm: "create dir",
      category: "reservedTechnical",
      scopes: ["tenantSlug"],
      match: "token",
      normalizationField: "slug",
      _order: 1
    }
  ];
  const indexedMatches = matchRules({
    normalized: normalizeValue("open-ai create-dir"),
    kind: "tenantSlug",
    ruleIndex: buildRuleIndex(indexedRules)
  });
  assert.deepEqual(
    indexedMatches.map((match) => match.rule.id),
    ["indexed/openai", "indexed/create-dir"],
    "indexed matching should preserve concatenated token and multi-token sequence behavior"
  );
}

{
  const bundle = loadRuntimeBundleFromFile(new URL("../dist/runtime-sources.json", import.meta.url));
  assert.equal(
    bundle.rules.some((rule) => rule.term === "abuse" && rule.category === "impersonation"),
    true,
    "runtime bundle should expose flattened rules"
  );
  assert.equal(
    bundle.rules.some((rule) => rule.term === "login" && rule.category === "reservedTechnical"),
    true,
    "runtime bundle should expose gitlab reserved-name rules"
  );
  assert.equal(
    bundle.compositeRules.some((rule) => rule.term === "security+support"),
    true,
    "runtime bundle should expose flattened composite rules"
  );
}

assert.throws(
  () => loadRuntimeBundleFromFile(new URL("./fixtures/runtime-bundle-invalid-version.json", import.meta.url)),
  /Unsupported runtime bundle version/,
  "runtime bundle loader should reject unsupported bundle versions"
);

assert.throws(
  () => loadRuntimeBundleFromFile(new URL("./fixtures/runtime-bundle-invalid-profile-index.json", import.meta.url)),
  /references missing categoryTable\[9\]/,
  "runtime bundle loader should reject broken profile table indexes"
);

{
  const cliPath = fileURLToPath(new URL("../bin/nomsentry.js", import.meta.url));
  const runCli = (...args) =>
    spawnSync(process.execPath, [cliPath, ...args], {
      encoding: "utf8"
    });

  const usageResult = runCli();
  assert.equal(usageResult.status, 64, "cli should return a stable usage exit code");
  assert.match(usageResult.stdout, /Usage:/, "cli should print usage when arguments are missing");

  const commandResult = runCli("wat", "tenantName", "value");
  assert.equal(commandResult.status, 65, "cli should return a stable validation exit code for unknown commands");
  assert.match(commandResult.stderr, /Unknown command: wat/, "cli should reject unknown commands before evaluation");

  const kindResult = runCli("check", "tenantWhatever", "value");
  assert.equal(kindResult.status, 65, "cli should return a stable validation exit code for unknown kinds");
  assert.match(kindResult.stderr, /Unknown kind: tenantWhatever/, "cli should reject unknown kinds before evaluation");

  const checkResult = runCli("check", "tenantName", "depp");
  assert.equal(checkResult.status, 0, "cli check should succeed for valid inputs");
  assert.equal(checkResult.stdout.trim(), "reject", "cli check should still use the runtime bundle path");

  const explainResult = runCli("explain", "tenantSlug", "support", "--namespace", "internal");
  assert.equal(explainResult.status, 0, "cli explain should succeed for valid inputs");
  const explained = JSON.parse(explainResult.stdout);
  assert.equal(explained.decision, "allow", "cli explain should preserve namespace-based overrides");
}

{
  const runScript = (scriptName, ...args) =>
    spawnSync(process.execPath, [fileURLToPath(new URL(`../scripts/${scriptName}`, import.meta.url)), ...args], {
      encoding: "utf8"
    });

  const usptoMissingInput = runScript("import-uspto-trademarks.js");
  assert.equal(usptoMissingInput.status, 1, "uspto import script should fail with a stable non-zero exit");
  assert.match(
    usptoMissingInput.stderr,
    /Missing required option: --input-file/,
    "uspto import script should report missing input files without a stack trace"
  );
  assert.equal(usptoMissingInput.stderr.includes("ReferenceError"), false, "uspto import errors should stay concise");

  const usptoBadChunkSize = runScript("import-uspto-trademarks.js", "--input-file", "missing.csv", "--chunk-size", "0");
  assert.equal(usptoBadChunkSize.status, 1, "uspto import script should reject invalid chunk sizes");
  assert.match(
    usptoBadChunkSize.stderr,
    /Invalid option: --chunk-size must be a positive integer/,
    "uspto import script should validate chunk sizes before attempting import"
  );

  const obscenityUnknownOption = runScript("import-obscenity.js", "--wat");
  assert.equal(obscenityUnknownOption.status, 1, "obscenity import script should fail for unknown options");
  assert.match(
    obscenityUnknownOption.stderr,
    /Unknown option: --wat/,
    "obscenity import script should print a direct argument error"
  );

  const cussEmptyLanguages = runScript("import-cuss.js", "--languages", "");
  assert.equal(cussEmptyLanguages.status, 1, "cuss import script should reject empty language selections");
  assert.match(
    cussEmptyLanguages.stderr,
    /Invalid option: --languages must include at least one language or 'all'/,
    "cuss import script should validate explicit empty language lists"
  );

  const twoToadEmptyLanguages = runScript("import-2toad-profanity.js", "--languages", "");
  assert.equal(twoToadEmptyLanguages.status, 1, "2toad import script should reject empty language selections");
  assert.match(
    twoToadEmptyLanguages.stderr,
    /Invalid option: --languages must include at least one language or 'all'/,
    "2toad import script should validate explicit empty language lists"
  );

  const gitlabUnknownOption = runScript("import-gitlab-reserved-names.js", "--wat");
  assert.equal(gitlabUnknownOption.status, 1, "gitlab import script should fail for unknown options");
  assert.match(
    gitlabUnknownOption.stderr,
    /Unknown option: --wat/,
    "gitlab import script should report direct argument errors"
  );

  const runtimeUnknownOption = runScript("build-runtime-sources.js", "--wat");
  assert.equal(runtimeUnknownOption.status, 1, "runtime builder should fail for unknown options");
  assert.match(
    runtimeUnknownOption.stderr,
    /Unknown option: --wat/,
    "runtime builder should reject unknown options directly"
  );
}

await assert.rejects(
  () => fetchLdnoobwLanguages(async () => ({ ok: false, status: 503, statusText: "Service Unavailable" })),
  /Failed to fetch .* 503 Service Unavailable/,
  "ldnoobw language discovery should surface upstream HTTP failures"
);

await assert.rejects(
  () => fetchLdnoobwWordList("en", async () => ({ ok: false, status: 404, statusText: "Not Found" })),
  /Failed to fetch .*\/en: 404 Not Found/,
  "ldnoobw word-list fetches should surface upstream HTTP failures"
);

{
  const fetched = await fetchLdnoobwWordList("en", async () => ({
    ok: true,
    text: async () => "\nshit\nSHIT\n# comment\nbitch\n"
  }));
  assert.deepEqual(
    fetched,
    {
      language: "en",
      sourceUrl: "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en",
      terms: ["bitch", "shit"]
    },
    "ldnoobw word-list fetches should normalize fetched upstream payloads"
  );
}

await assert.rejects(
  () => fetchDsojevicLanguage("en", async () => ({ ok: false, status: 429, statusText: "Too Many Requests" })),
  /Failed to fetch .*\/en\.json: 429 Too Many Requests/,
  "dsojevic fetches should surface upstream HTTP failures"
);

{
  const payload = [{ id: "simple", match: "dumb", severity: 1 }];
  const fetched = await fetchDsojevicLanguage("en", async () => ({
    ok: true,
    json: async () => payload
  }));
  assert.deepEqual(fetched, payload, "dsojevic fetches should return parsed JSON payloads");
}

await assert.rejects(
  () => fetchInsultWikiTerms("en", async () => ({ ok: false, status: 502 })),
  /insult\.wiki request failed for en: 502/,
  "insult.wiki fetches should surface upstream HTTP failures"
);

await assert.rejects(
  () => fetchInsultWikiTerms("en", async () => ({ ok: true, text: async () => "<html><body>No list</body></html>" })),
  /Could not find insult\.wiki list markup/,
  "insult.wiki fetches should fail on malformed upstream markup"
);

await assert.rejects(
  () => fetchGitLabReservedNames(async () => ({ ok: false, status: 403, statusText: "Forbidden" })),
  /GitLab reserved names request failed: 403 Forbidden/,
  "gitlab reserved-name fetches should surface upstream HTTP failures"
);

{
  const markdown = `
## Reserved project names

- \`create_dir\`
- \`info/lfs/objects\`
- \`blob\`

## Reserved group names

- \`.well-known\`
- \`admin\`
- \`login\`
- \`robots.txt\`
- \`s\`
- \`health_check\`
`;

  assert.deepEqual(
    extractGitLabReservedNames(markdown),
    ["admin", "blob", "create-dir", "health-check", "login"],
    "gitlab reserved-name parser should keep only useful route-like reserved identifiers"
  );
}

{
  const fetched = await fetchGitLabReservedNames(async () => ({
    ok: true,
    text: async () => `
## Reserved project names

- \`raw\`

## Reserved group names

- \`api\`
- \`uploads\`
`
  }));
  assert.deepEqual(
    fetched,
    ["api", "raw", "uploads"],
    "gitlab reserved-name fetches should parse and normalize fetched markdown"
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

assert.deepEqual(
  getInsultWikiLanguages(),
  ["de", "en"],
  "insult.wiki language inventory should be explicit and stable"
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
  const compact = compactSource({
    id: "compact-defaults-test",
    rules: [
      {
        id: "compact-defaults-test/a",
        term: "alpha",
        category: "profanity",
        scopes: ["tenantName"],
        match: "token",
        normalizationField: "confusableSkeleton",
        metadata: { source: "fixture", language: "en" }
      },
      {
        id: "compact-defaults-test/b",
        term: "beta",
        category: "profanity",
        scopes: ["tenantName"],
        match: "token",
        normalizationField: "confusableSkeleton",
        metadata: { source: "fixture", language: "en" }
      }
    ]
  });
  assert.deepEqual(
    compact.ruleDefaults,
    {
      category: "profanity",
      scopes: ["tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton",
      metadata: { source: "fixture", language: "en" },
      idPrefix: "compact-defaults-test/"
    },
    "compactSource should extract shared rule defaults, metadata, and id prefixes"
  );
}

{
  const expanded = expandSource({
    id: "expand-merge-test",
    ruleDefaults: {
      category: "profanity",
      scopes: ["tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton",
      metadata: { source: "fixture", language: "en" },
      idPrefix: "expand-merge-test/"
    },
    rules: [["alpha", "alpha", { metadata: { notes: "keep-note" } }]]
  });
  assert.deepEqual(
    expanded.rules[0],
    {
      id: "expand-merge-test/alpha",
      term: "alpha",
      category: "profanity",
      scopes: ["tenantName"],
      match: "token",
      severity: undefined,
      normalizationField: "confusableSkeleton",
      metadata: { source: "fixture", language: "en", notes: "keep-note" }
    },
    "expandSource should merge metadata defaults with override notes"
  );
}

assert.deepEqual(
  validateSource({ id: "empty-source", rules: [] }),
  { id: "empty-source", rules: [] },
  "validateSource should accept explicit empty rule arrays"
);

assert.throws(
  () => expandSource({
    id: "invalid-compact-source",
    ruleDefaults: {
      category: "profanity",
      scopes: ["tenantName"],
      match: "token"
    },
    rules: [["id-only"]]
  }),
  /source\.rules\[0\] must be an object or a compact rule tuple/,
  "expandSource should reject malformed compact rule tuples"
);

assert.throws(
  () => validateSource({
    id: "missing-rule-defaults-values",
    ruleDefaults: {
      scopes: ["tenantName"],
      match: "token"
    },
    rules: [["alpha", "alpha"]]
  }),
  /source\.rules\[0\]\.category must be a non-empty string/,
  "validateSource should fail when compact rules expand without required defaults"
);

assert.throws(
  () => validateSource({
    id: "invalid-compact-override",
    ruleDefaults: {
      category: "profanity",
      scopes: ["tenantName"],
      match: "token"
      },
      rules: [["alpha", "alpha", "bad-override"]]
  }),
  /source\.rules\[0\]\.match must be a non-empty string/,
  "validateSource should fail compact tuples with non-object overrides once required fields are missing"
);

assert.throws(
  () => validateSource({
    id: "invalid-compact-scopes-override",
    ruleDefaults: {
      category: "profanity",
      scopes: ["tenantName"],
      match: "token"
    },
    rules: [["alpha", "alpha", { scopes: "tenantName" }]]
  }),
  /source\.rules\[0\]\.scopes must be an array/,
  "validateSource should reject compact tuple overrides with malformed scopes"
);

assert.throws(
  () => validateSource({
    id: "invalid-composite-scope-source",
    compositeRules: [
      {
        id: "invalid-composite-scope-source/rule",
        term: "security+support",
        category: "compositeRisk",
        scopes: "tenantSlug",
        allOf: ["security", "support"]
      }
    ]
  }),
  /source\.compositeRules\[0\]\.scopes must be an array/,
  "validateSource should reject malformed composite-rule scopes"
);

assert.throws(
  () => validateSource({
    id: "invalid-composite-allof-source",
    compositeRules: [
      {
        id: "invalid-composite-allof-source/rule",
        term: "security+support",
        category: "compositeRisk",
        scopes: ["tenantSlug"],
        allOf: ["security", 7]
      }
    ]
  }),
  /source\.compositeRules\[0\]\.allOf\[1\] must be a non-empty string/,
  "validateSource should reject malformed composite allOf terms"
);

{
  const serialized = serializeSource({
    id: "serialize-prune-test",
    metadata: {
      source: "fixture",
      language: "en",
      severity: "high",
      tags: ["external-import"],
      notes: "keep-me"
    },
    rules: [
      {
        id: "serialize-prune-test/rule",
        term: "alpha",
        category: "profanity",
        scopes: ["tenantName"],
        match: "token",
        metadata: {
          source: "fixture",
          tags: ["drop-me"],
          notes: "drop-me"
        }
      }
    ]
  });
  const parsed = JSON.parse(serialized);
  assert.deepEqual(
    parsed.metadata,
    {
      source: "fixture",
      language: "en",
      notes: "keep-me"
    },
    "serializeSource should retain only source-level metadata used by stored artifacts"
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(parsed.rules[0][2] ?? {}, "metadata"),
    false,
    "serializeSource should prune rule-level metadata from compact stored artifacts"
  );
}

{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-source-io-"));
  const targetFile = path.join(tmpDir, "atomic.json");
  const content = serializeSource({
    id: "atomic-test",
    rules: [
      {
        id: "atomic-test/alpha",
        term: "alpha",
        category: "profanity",
        scopes: ["tenantName"],
        match: "token"
      }
    ]
  });
  writeTextFileAtomic(targetFile, content);
  assert.equal(fs.readFileSync(targetFile, "utf8"), content, "atomic writer should persist the full content");
  assert.deepEqual(
    fs.readdirSync(tmpDir).filter((entry) => entry.includes(".tmp-")),
    [],
    "atomic writer should not leave temporary files behind"
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

assert.equal(
  resolveCompactFilename({ id: "imported-insult-wiki-de" }),
  "insult-wiki-de.json",
  "compact-sources should preserve insult.wiki filenames"
);

{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-compact-sources-"));
  const outputDir = path.join(tmpDir, "sources");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "stale.json"), '{"stale":true}\n', "utf8");

  compactSourcesDirectory([
    {
      id: "imported-insult-wiki-en",
      metadata: { source: "insult.wiki" },
      rules: [
        {
          id: "imported-insult-wiki-en/asshole",
          term: "asshole",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token"
        }
      ]
    }
  ], outputDir, {
    stageDir: path.join(tmpDir, "stage"),
    backupDir: path.join(tmpDir, "backup"),
    logger: null
  });

  assert.deepEqual(
    fs.readdirSync(outputDir).sort(),
    ["insult-wiki-en.json"],
    "compact-sources should swap the staged directory into place"
  );
  assert.equal(
    loadSourceFromFile(pathToFileURL(path.join(outputDir, "insult-wiki-en.json"))).rules[0].term,
    "asshole",
    "compacted staged sources should remain readable after the swap"
  );
  assert.equal(fs.existsSync(path.join(tmpDir, "stage")), false, "compact-sources should clean up the stage directory");
  assert.equal(fs.existsSync(path.join(tmpDir, "backup")), false, "compact-sources should clean up the backup directory");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-loader-order-"));
  fs.writeFileSync(path.join(tmpDir, "zeta.json"), serializeSource({
    id: "zeta-source",
    rules: [
      {
        id: "zeta-source/omega",
        term: "omega",
        category: "profanity",
        scopes: ["tenantName"],
        match: "token"
      }
    ]
  }), "utf8");
  fs.writeFileSync(path.join(tmpDir, "alpha.json"), serializeSource({
    id: "alpha-source",
    rules: [
      {
        id: "alpha-source/alpha",
        term: "alpha",
        category: "profanity",
        scopes: ["tenantName"],
        match: "token"
      }
    ]
  }), "utf8");

  const loaded = loadSourcesFromDirectory(pathToFileURL(`${tmpDir}${path.sep}`));
  assert.deepEqual(
    loaded.map((source) => source.id),
    ["alpha-source", "zeta-source"],
    "directory loading should be deterministic regardless of filesystem ordering"
  );

  const outputDirA = path.join(tmpDir, "out-a");
  const outputDirB = path.join(tmpDir, "out-b");
  compactSourcesDirectory(loaded, outputDirA, {
    stageDir: path.join(tmpDir, "stage-a"),
    backupDir: path.join(tmpDir, "backup-a"),
    logger: null
  });
  compactSourcesDirectory(loaded, outputDirB, {
    stageDir: path.join(tmpDir, "stage-b"),
    backupDir: path.join(tmpDir, "backup-b"),
    logger: null
  });

  const filesA = fs.readdirSync(outputDirA).sort();
  const filesB = fs.readdirSync(outputDirB).sort();
  assert.deepEqual(filesA, filesB, "recompacted maintained sources should have the same file set");

  for (const file of filesA) {
    assert.equal(
      fs.readFileSync(path.join(outputDirA, file), "utf8"),
      fs.readFileSync(path.join(outputDirB, file), "utf8"),
      `recompacted maintained sources should be byte-stable for ${file}`
    );
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

assert.throws(
  () => compactSourcesDirectory([], path.join(os.tmpdir(), "nomsentry-empty-sources"), { logger: null }),
  /source set is empty/,
  "compact-sources should reject empty source sets"
);

{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-compact-guard-"));
  const outputDir = path.join(tmpDir, "sources");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "README.txt"), "do not replace\n", "utf8");

  assert.throws(
    () => compactSourcesDirectory([
      {
        id: "imported-insult-wiki-en",
        rules: [
          {
            id: "imported-insult-wiki-en/asshole",
            term: "asshole",
            category: "profanity",
            scopes: ["tenantName"],
            match: "token"
          }
        ]
      }
    ], outputDir, { logger: null }),
    /unexpected existing entries README\.txt/,
    "compact-sources should refuse to replace directories that contain unexpected files"
  );

  assert.equal(
    fs.readFileSync(path.join(outputDir, "README.txt"), "utf8"),
    "do not replace\n",
    "compact-sources guardrail should leave foreign files untouched after refusal"
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-runtime-bundle-"));
  const outputFile = path.join(tmpDir, "runtime-sources.json");
  const manifestFile = path.join(tmpDir, "build-manifest.json");
  const bundle = buildRuntimeBundle([
    {
      id: "runtime-test-source",
      rules: [
        {
          id: "runtime-test-source/test",
          term: "test",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token",
          normalizationField: "confusableSkeleton"
        }
      ]
    }
  ]);
  writeRuntimeBundle(outputFile, bundle);
  writeProvenanceManifest(manifestFile, buildProvenanceManifest({
    inputDir: fileURLToPath(new URL("../custom/sources/", import.meta.url)),
    outputFile
  }));
  assert.equal(
    loadRuntimeBundleFromFile(pathToFileURL(outputFile)).rules[0].term,
    "test",
    "runtime bundle writer should persist a loadable bundle atomically"
  );
  assert.deepEqual(
    fs.readdirSync(tmpDir).filter((entry) => entry.includes(".tmp-")),
    [],
    "runtime bundle writer should not leave temporary files behind"
  );
  assert.equal(
    JSON.parse(fs.readFileSync(manifestFile, "utf8")).id,
    "build-provenance-manifest",
    "provenance manifest writer should persist a loadable manifest atomically"
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
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

{
  const severityFallbackEngine = createEngine({
    sources: [{
      id: "severity-fallback-source",
      rules: [
        {
          id: "severity-fallback-source/mild",
          term: "mild",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token",
          normalizationField: "confusableSkeleton"
        },
        {
          id: "severity-fallback-source/odd",
          term: "odd",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token",
          severity: "unknown",
          normalizationField: "confusableSkeleton"
        },
        {
          id: "severity-fallback-source/hardbrand",
          term: "hardbrand",
          category: "protectedBrand",
          scopes: ["tenantName"],
          match: "token",
          normalizationField: "confusableSkeleton"
        }
      ]
    }],
    policies: [{
      id: "severity-fallback-policy",
      appliesTo: ["tenantName"],
      decisionMatrix: {
        profanity: {
          high: "reject",
          default: "review"
        },
        protectedBrand: "review"
      }
    }]
  });

  assert.equal(
    severityFallbackEngine.evaluate({ value: "mild", kind: "tenantName" }).decision,
    "review",
    "missing severities should fall back to the category default"
  );
  assert.equal(
    severityFallbackEngine.evaluate({ value: "odd", kind: "tenantName" }).decision,
    "review",
    "unknown severities should fall back to the category default"
  );
  assert.equal(
    severityFallbackEngine.evaluate({ value: "odd hardbrand", kind: "tenantName" }).decision,
    "review",
    "mixed categories with review-only actions should remain review"
  );
}

{
  const severityNoDefaultEngine = createEngine({
    sources: [{
      id: "severity-nodefault-source",
      rules: [
        {
          id: "severity-nodefault-source/rare",
          term: "rare",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token",
          severity: "medium",
          normalizationField: "confusableSkeleton"
        }
      ]
    }],
    policies: [{
      id: "severity-nodefault-policy",
      appliesTo: ["tenantName"],
      decisionMatrix: {
        profanity: {
          high: "reject"
        }
      }
    }]
  });

  assert.equal(
    severityNoDefaultEngine.evaluate({ value: "rare", kind: "tenantName" }).decision,
    "review",
    "partial severity matrices without a default should fall back to review"
  );
}

{
  const severityMatrixEngine = createEngine({
    sources: [{
      id: "severity-matrix-source",
      rules: [
        {
          id: "severity-matrix-source/mild",
          term: "mild",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token",
          severity: "low",
          normalizationField: "confusableSkeleton"
        },
        {
          id: "severity-matrix-source/severe",
          term: "severe",
          category: "profanity",
          scopes: ["tenantName"],
          match: "token",
          severity: "high",
          normalizationField: "confusableSkeleton"
        },
        {
          id: "severity-matrix-source/brandx",
          term: "brandx",
          category: "protectedBrand",
          scopes: ["tenantName"],
          match: "token",
          normalizationField: "confusableSkeleton"
        }
      ]
    }],
    policies: [{
      id: "severity-matrix-policy",
      appliesTo: ["tenantName"],
      decisionMatrix: {
        profanity: {
          low: "review",
          high: "reject",
          default: "review"
        },
        protectedBrand: "review"
      }
    }]
  });

  assert.equal(
    severityMatrixEngine.evaluate({ value: "mild brandx", kind: "tenantName" }).decision,
    "review",
    "review-level severity combined with review-only categories should remain review"
  );
  assert.equal(
    severityMatrixEngine.evaluate({ value: "severe brandx", kind: "tenantName" }).decision,
    "reject",
    "high-severity rules should dominate mixed-category review matches"
  );
  assert.equal(
    severityMatrixEngine.evaluate({ value: "mild severe", kind: "tenantName" }).decision,
    "reject",
    "a high-severity rule should dominate lower-severity rules in the same category"
  );
  assert.deepEqual(
    severityMatrixEngine.evaluate({ value: "mild severe brandx", kind: "tenantName" }).reasons.map((reason) => ({
      category: reason.category,
      severity: reason.severity
    })),
    [
      { category: "profanity", severity: "low" },
      { category: "profanity", severity: "high" },
      { category: "protectedBrand", severity: undefined }
    ],
    "severity-aware evaluation should preserve per-rule severity evidence in reasons"
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
  const terms = extractInsultWikiTerms(`
    <html><body><ol>
      <li><a href="/insult/ahole">a-hole</a></li>
      <li><a href="/insult/depp">Depp</a></li>
      <li><a href="/insult/abscheisser">Abschei&szlig;er</a></li>
    </ol></body></html>
  `);
  assert.deepEqual(
    terms,
    ["a-hole", "Depp", "Abscheißer"],
    "insult.wiki parser should extract and decode list entries"
  );

  const source = buildInsultWikiSource({
    language: "de",
    terms
  });
  assert.equal(source.metadata.source, "insult.wiki", "insult.wiki importer should stamp source metadata");
  assert.equal(source.rules.some((rule) => rule.term === "depp"), true, "insult.wiki importer should normalize german insults");
  assert.equal(source.rules.some((rule) => rule.term === "abscheisser"), true, "insult.wiki importer should latinize german sharp s");
}

{
  const source = buildGitLabReservedNamesSource({
    terms: ["admin", "create_dir", "login", "admin", "robots.txt", ".well-known"]
  });
  assert.equal(source.metadata.source, "GitLab Docs", "gitlab importer should stamp source metadata");
  assert.deepEqual(
    source.rules.map((rule) => rule.term),
    ["admin", "create-dir", "login"],
    "gitlab importer should normalize and dedupe reserved-name terms conservatively"
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
  const samples = [
    "Admin",
    "ad\u200Bmin",
    "supp0rt",
    "ѕupport",
    "scheiße",
    "schéisse",
    "Ａdmin",
    "n!gga",
    "gооgle"
  ];

  for (const value of samples) {
    const once = normalizeValue(value);
    const twice = normalizeValue(once.latinFolded);
    assert.equal(
      twice.latinFolded,
      once.latinFolded,
      `normalization should be idempotent on latinFolded output for ${value}`
    );
    assert.equal(
      twice.compact,
      once.compact,
      `normalization should keep compact projections stable for ${value}`
    );
    assert.equal(
      twice.slug,
      once.slug,
      `normalization should keep slug projections stable for ${value}`
    );
  }
}

{
  const base = normalizeValue("support");
  for (const invisible of ["\u200B", "\u200C", "\u200D", "\u2060", "\uFEFF"]) {
    const variant = normalizeValue(`sup${invisible}port`);
    assert.equal(
      variant.compact,
      base.compact,
      `invisible character ${JSON.stringify(invisible)} should not affect compact support normalization`
    );
    assert.equal(
      variant.slug,
      base.slug,
      `invisible character ${JSON.stringify(invisible)} should not affect slug support normalization`
    );
  }
}

{
  const bases = ["admin", "support", "api"];
  const separators = ["-", "_", ".", "/", " "];

  for (const base of bases) {
    const expectedCompact = normalizeValue(base).compact;
    const letters = base.split("");

    for (const separator of separators) {
      const variant = letters.join(separator);
      const normalized = normalizeValue(variant);
      assert.equal(
        normalized.compact,
        expectedCompact,
        `separator-joined variant ${variant} should preserve compact normalization`
      );
    }
  }
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
