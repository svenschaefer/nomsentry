/* eslint-disable no-unused-vars */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as publicApi from "../src/index.js";
import { createEngine } from "../src/core/evaluate.js";
import { applyAllowOverrides } from "../src/core/overrides.js";
import { username, tenantSlug, tenantName } from "../src/policies/index.js";
import {
  loadSourceFromFile,
  loadSourcesFromDirectory,
} from "../src/loaders/source-loader.js";
import { loadRuntimeBundleFromFile } from "../src/loaders/runtime-bundle.js";
import { normalizeValue } from "../src/core/normalize.js";
import { validateSource } from "../src/schema/validate-source.js";
import {
  serializeSource,
  writeTextFileAtomic,
} from "../src/schema/source-io.js";
import {
  buildLdnoobwSource,
  parseLdnoobwWordList,
} from "../src/importers/ldnoobw.js";
import {
  build2ToadSource,
  get2ToadLanguages,
} from "../src/importers/toad-profanity.js";
import { buildObscenityEnglishSource } from "../src/importers/obscenity.js";
import { buildCussSource, getCussLanguages } from "../src/importers/cuss.js";
import { buildDsojevicSource } from "../src/importers/dsojevic-profanity.js";
import {
  buildInsultWikiSource,
  extractInsultWikiTerms,
  fetchInsultWikiTerms,
  getInsultWikiLanguages,
} from "../src/importers/insult-wiki.js";
import {
  buildGitHubReservedUsernamesSource,
  extractGitHubReservedUsernames,
  fetchGitHubReservedUsernames,
} from "../src/importers/github-reserved-usernames.js";
import {
  buildGitLabReservedNamesSource,
  extractGitLabReservedNames,
  fetchGitLabReservedNames,
} from "../src/importers/gitlab-reserved-names.js";
import {
  buildIcannReservedNamesSource,
  extractIcannReservedNames,
  fetchIcannReservedNames,
} from "../src/importers/icann-reserved-names.js";
import {
  buildReservedUsernamesSource,
  filterReservedUsernameTerms,
  getReservedUsernamesDataPath,
  loadReservedUsernamesTerms,
} from "../src/importers/reserved-usernames.js";
import {
  buildReservedUsernamesImpersonationSource,
  filterReservedUsernameImpersonationTerms,
} from "../src/importers/reserved-usernames-impersonation.js";
import {
  buildWindowsReservedUriSchemesSource,
  extractWindowsReservedUriSchemes,
  fetchWindowsReservedUriSchemes,
} from "../src/importers/windows-reserved-uri-schemes.js";
import {
  buildDerivedImpersonationSource,
  deriveImpersonationTerms,
} from "../src/importers/derived-impersonation.js";
import {
  buildDerivedCompositeRiskSource,
  deriveCompositeRiskRules,
} from "../src/importers/derived-composite-risk.js";
import {
  buildWikidataBrandRiskSource,
  isAcceptedWikidataBrandCandidate,
} from "../src/importers/wikidata-brand-risk.js";
import {
  buildUsptoTrademarkSource,
  buildUsptoTrademarkSourceFromCsvFile,
  deriveUsptoFilterTerm,
  deriveUsptoBrandRiskSource,
  parseUsptoCaseFileCsv,
  splitUsptoTrademarkSource,
} from "../src/importers/uspto.js";
import { detectScriptRisk } from "../src/core/script-risk.js";
import { buildRuleIndex, matchRules } from "../src/core/matchers.js";
import { compactSource, expandSource } from "../src/schema/source-format.js";
import {
  buildRuntimeBundle,
  writeRuntimeBundle,
} from "../scripts/build-runtime-sources.js";
import {
  fetchAvailableLanguages as fetchLdnoobwLanguages,
  fetchWordList as fetchLdnoobwWordList,
} from "../scripts/import-ldnoobw.js";
import { fetchLanguage as fetchDsojevicLanguage } from "../scripts/import-dsojevic-profanity.js";
import { parseArgs as parseGitHubReservedArgs } from "../scripts/import-github-reserved-usernames.js";
import { parseArgs as parseIcannReservedArgs } from "../scripts/import-icann-reserved-names.js";
import { parseArgs as parseReservedUsernamesArgs } from "../scripts/import-reserved-usernames.js";
import { parseArgs as parseReservedUsernamesImpersonationArgs } from "../scripts/import-reserved-usernames-impersonation.js";
import { parseArgs as parseWindowsReservedUriArgs } from "../scripts/import-windows-reserved-uri-schemes.js";
import {
  parseArgs as parseUsptoImportArgs,
  replaceUsptoChunkSet,
} from "../scripts/import-uspto-trademarks.js";
import {
  buildProvenanceManifest,
  writeProvenanceManifest,
} from "../scripts/build-provenance-manifest.js";
import { removeLegacyDerivedUsptoFiles } from "../scripts/derive-uspto-brand-risk.js";
import {
  benchmarkRuntime,
  parseArgs as parseRuntimeBenchmarkArgs,
} from "../scripts/benchmark-runtime.js";
import {
  evaluateBenchmarkBudget,
  loadBenchmarkBudget,
  parseArgs as parseBenchmarkBudgetArgs,
} from "../scripts/check-runtime-benchmark-budget.js";
import {
  buildPackageSmokeScript,
  parsePackOutput,
} from "../scripts/check-package-smoke.js";
import {
  parseAuditReport,
  parseSbom,
} from "../scripts/check-security-baseline.js";
import {
  evaluateCoverageThresholds,
  loadCoverageSummary,
  loadCoverageThresholds,
  parseArgs as parseCoverageThresholdArgs,
} from "../scripts/check-coverage-thresholds.js";
import {
  deriveFilterTerm,
  evaluateSearchResults,
  loadTermsFromFixture,
  parseArgs as parseWikidataBrandArgs,
  scoreCandidate,
} from "../scripts/evaluate-wikidata-brand-supplement.js";
import {
  evaluateBrandProfile,
  loadCalibrationFixture,
  parseArgs as parseBrandProfileArgs,
} from "../scripts/evaluate-brand-profile.js";
import { parseArgs as parseWikidataDeriveArgs } from "../scripts/derive-wikidata-brand-risk.js";
import { parseArgs as parseDerivedImpersonationArgs } from "../scripts/derive-impersonation.js";
import { parseArgs as parseDerivedCompositeArgs } from "../scripts/derive-composite-risk.js";
import {
  assessFreshness,
  findRefreshPolicy,
  getLastCommitDate,
  resolveAsOfDate,
  validateRefreshPolicy,
} from "../scripts/check-source-freshness.js";
import {
  buildIntegrityTargets,
  captureUrlIntegrity,
  parseContentType,
  validateSourceIntegrityLock,
} from "../scripts/source-integrity.js";
import {
  evaluateSourceIntegrity,
  parseArgs as parseSourceIntegrityArgs,
} from "../scripts/check-source-integrity.js";
import {
  evaluateReleaseWorkflow,
  parseArgs as parseReleaseAttestationArgs,
} from "../scripts/check-release-attestation.js";
import {
  compactSourcesDirectory,
  resolveCompactFilename,
} from "../scripts/compact-sources.js";

const syntheticPolicySource = {
  id: "synthetic-policy-source",
  rules: [
    {
      id: "synthetic/reserved-admin",
      term: "admin",
      category: "reservedTechnical",
      scopes: ["username", "tenantSlug"],
      match: "token",
      normalizationField: "confusableSkeleton",
    },
    {
      id: "synthetic/impersonation-support",
      term: "support",
      category: "impersonation",
      scopes: ["username", "tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton",
    },
    {
      id: "synthetic/impersonation-security",
      term: "security",
      category: "impersonation",
      scopes: ["username", "tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton",
    },
    {
      id: "synthetic/brand-openai",
      term: "openai",
      category: "protectedBrand",
      scopes: ["username", "tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton",
    },
    {
      id: "synthetic/brand-seven",
      term: "seven",
      category: "protectedBrand",
      scopes: ["tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton",
    },
  ],
  compositeRules: [
    {
      id: "synthetic/composite-security-support",
      term: "security+support",
      category: "compositeRisk",
      scopes: ["username", "tenantSlug", "tenantName"],
      allOf: ["security", "support"],
    },
  ],
};

const engine = createEngine({
  sources: [
    syntheticPolicySource,
    ...loadSourcesFromDirectory(
      new URL("../custom/sources/", import.meta.url),
    ).filter((source) => !source.id.startsWith("imported-uspto-trademarks-")),
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
        suppressCategories: ["impersonation"],
      },
    },
  ],
});

const maintainedEngine = createEngine({
  sources: loadSourcesFromDirectory(
    new URL("../custom/sources/", import.meta.url),
  ).filter((source) => !source.id.startsWith("imported-uspto-trademarks-")),
  policies: [username(), tenantSlug(), tenantName()],
});

function loadFixture(name) {
  return JSON.parse(
    fs.readFileSync(
      new URL(`./fixtures/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
}

const publicApiContract = JSON.parse(
  fs.readFileSync(
    new URL("./fixtures/public-api-contract.json", import.meta.url),
    "utf8",
  ),
);
const adversarialSecurityRegression = JSON.parse(
  fs.readFileSync(
    new URL("./fixtures/adversarial-security-regression.json", import.meta.url),
    "utf8",
  ),
);

for (const name of ["allow", "reject", "review"]) {
  for (const testCase of loadFixture(name)) {
    const result = engine.evaluate({
      value: testCase.value,
      kind: testCase.kind,
      context: testCase.context || {},
    });
    assert.equal(
      result.decision,
      testCase.expected,
      `${name}: ${testCase.value}`,
    );
  }
}

for (const fixtureName of [
  "catalog-maintained-positives",
  "catalog-maintained-false-positives",
  "catalog-maintained-true-negatives",
  "catalog-maintained-obfuscated-positives",
  "catalog-maintained-compact-contract",
  "catalog-maintained-mixed-script",
  "catalog-documented-non-goals-and-future-gaps",
]) {
  for (const group of loadFixture(fixtureName)) {
    for (const value of group.values) {
      const result = maintainedEngine.evaluate({
        value,
        kind: group.kind,
      });
      assert.equal(
        result.decision,
        group.expected,
        `${fixtureName}/${group.label}: ${value}`,
      );
    }
  }
}

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/ldnoobw-en.json", import.meta.url),
  ).metadata.source,
  "LDNOOBW",
  "ldnoobw source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/2toad-profanity-en.json", import.meta.url),
  ).metadata.source,
  "@2toad/profanity",
  "2toad source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/obscenity-en.json", import.meta.url),
  ).metadata.source,
  "obscenity",
  "obscenity source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(new URL("../custom/sources/cuss-en.json", import.meta.url))
    .metadata.source,
  "cuss",
  "cuss source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/dsojevic-profanity-en.json", import.meta.url),
  ).metadata.source,
  "dsojevic/profanity-list",
  "dsojevic source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/derived-impersonation.json", import.meta.url),
  ).metadata.source,
  "Derived maintained impersonation vocabulary",
  "derived impersonation source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/derived-composite-risk.json", import.meta.url),
  ).metadata.source,
  "Derived maintained composite-risk vocabulary",
  "derived composite-risk source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL(
      "../custom/sources/derived-wikidata-brand-risk.json",
      import.meta.url,
    ),
  ).metadata.source,
  "Wikidata",
  "wikidata derived source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/insult-wiki-en.json", import.meta.url),
  ).metadata.source,
  "insult.wiki",
  "insult.wiki english source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/insult-wiki-de.json", import.meta.url),
  ).metadata.source,
  "insult.wiki",
  "insult.wiki german source metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL(
      "../custom/sources/github-reserved-usernames.json",
      import.meta.url,
    ),
  ).metadata.source,
  "GitHub Docs",
  "github reserved usernames metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/icann-reserved-names.json", import.meta.url),
  ).metadata.source,
  "ICANN",
  "ICANN reserved names metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL("../custom/sources/gitlab-reserved-names.json", import.meta.url),
  ).metadata.source,
  "GitLab Docs",
  "gitlab reserved names metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL(
      "../custom/sources/reserved-usernames-impersonation.json",
      import.meta.url,
    ),
  ).metadata.source,
  "reserved-usernames",
  "reserved-usernames impersonation metadata should load from JSON",
);

assert.equal(
  loadSourceFromFile(
    new URL(
      "../custom/sources/windows-reserved-uri-schemes.json",
      import.meta.url,
    ),
  ).metadata.source,
  "Microsoft Learn",
  "windows reserved URI schemes metadata should load from JSON",
);

assert.equal(
  loadSourcesFromDirectory(new URL("../custom/sources/", import.meta.url)).some(
    (source) => source.id === "imported-rfc2142-role-mailboxes",
  ),
  true,
  "directory loader should include official role-mailbox source",
);

{
  const benchmarkArgs = parseRuntimeBenchmarkArgs([
    "--iterations",
    "25",
    "--warmup-iterations",
    "5",
  ]);
  assert.equal(
    benchmarkArgs.iterations,
    25,
    "runtime benchmark args should parse iterations",
  );
  assert.equal(
    benchmarkArgs.warmupIterations,
    5,
    "runtime benchmark args should parse warmup iterations",
  );
}

{
  const wikidataArgs = parseWikidataBrandArgs([
    "--terms",
    "openai,paypal",
    "--output-file",
    "tmp/wikidata-report.json",
  ]);
  assert.deepEqual(
    wikidataArgs.terms,
    ["openai", "paypal"],
    "wikidata evaluation args should parse explicit brand terms",
  );
  assert.equal(
    path.basename(wikidataArgs.outputFile),
    "wikidata-report.json",
    "wikidata evaluation args should parse output files",
  );
}

{
  const wikidataDeriveArgs = parseWikidataDeriveArgs([
    "--terms",
    "openai,google",
    "--output-file",
    "tmp/derived-wikidata-brand-risk.json",
    "--report-file",
    "tmp/wikidata-report.json",
  ]);
  assert.deepEqual(
    wikidataDeriveArgs.terms,
    ["openai", "google"],
    "wikidata derive args should parse explicit brand terms",
  );
  assert.equal(
    path.basename(wikidataDeriveArgs.outputFile),
    "derived-wikidata-brand-risk.json",
    "wikidata derive args should parse output files",
  );
  assert.equal(
    path.basename(wikidataDeriveArgs.reportFile),
    "wikidata-report.json",
    "wikidata derive args should parse report files",
  );
}

{
  const brandProfileArgs = parseBrandProfileArgs([
    "--bundle-file",
    "tmp/runtime-sources.json",
    "--fixture-file",
    "tmp/brand-profile-calibration.json",
    "--output-file",
    "tmp/brand-profile-report.json",
  ]);
  assert.equal(
    path.basename(brandProfileArgs.bundleFile),
    "runtime-sources.json",
    "brand profile evaluation args should parse bundle files",
  );
  assert.equal(
    path.basename(brandProfileArgs.fixtureFile),
    "brand-profile-calibration.json",
    "brand profile evaluation args should parse fixture files",
  );
  assert.equal(
    path.basename(brandProfileArgs.outputFile),
    "brand-profile-report.json",
    "brand profile evaluation args should parse output files",
  );
}

{
  const githubReservedArgs = parseGitHubReservedArgs([
    "--output-dir",
    "tmp/github-reserved",
  ]);
  assert.equal(
    path.basename(githubReservedArgs.outputDir),
    "github-reserved",
    "github reserved usernames args should parse output directories",
  );
}

{
  const icannReservedArgs = parseIcannReservedArgs([
    "--output-dir",
    "tmp/icann-reserved",
  ]);
  assert.equal(
    path.basename(icannReservedArgs.outputDir),
    "icann-reserved",
    "ICANN reserved names args should parse output directories",
  );
}

{
  const derivedImpersonationArgs = parseDerivedImpersonationArgs([
    "--output-file",
    "tmp/derived-impersonation.json",
  ]);
  assert.equal(
    path.basename(derivedImpersonationArgs.outputFile),
    "derived-impersonation.json",
    "derived impersonation args should parse output files",
  );
}

{
  const derivedCompositeArgs = parseDerivedCompositeArgs([
    "--output-file",
    "tmp/derived-composite-risk.json",
  ]);
  assert.equal(
    path.basename(derivedCompositeArgs.outputFile),
    "derived-composite-risk.json",
    "derived composite-risk args should parse output files",
  );
}

{
  const windowsReservedUriArgs = parseWindowsReservedUriArgs([
    "--output-dir",
    "tmp/windows-uri",
  ]);
  assert.equal(
    path.basename(windowsReservedUriArgs.outputDir),
    "windows-uri",
    "windows reserved URI import args should parse output directories",
  );
}

assert.throws(
  () => parseBrandProfileArgs(["--wat"]),
  /Unknown option: --wat/,
  "brand profile evaluation args should reject unknown options",
);

assert.throws(
  () => parseGitHubReservedArgs(["--wat"]),
  /Unknown option: --wat/,
  "github reserved usernames args should reject unknown options",
);

assert.throws(
  () => parseIcannReservedArgs(["--wat"]),
  /Unknown option: --wat/,
  "ICANN reserved names args should reject unknown options",
);

assert.throws(
  () => parseDerivedImpersonationArgs(["--wat"]),
  /Unknown option: --wat/,
  "derived impersonation args should reject unknown options",
);

assert.throws(
  () => parseDerivedCompositeArgs(["--wat"]),
  /Unknown option: --wat/,
  "derived composite-risk args should reject unknown options",
);

assert.throws(
  () => parseWikidataBrandArgs(["--wat"]),
  /Unknown option: --wat/,
  "wikidata evaluation args should reject unknown options",
);

assert.throws(
  () => parseWikidataDeriveArgs(["--wat"]),
  /Unknown option: --wat/,
  "wikidata derive args should reject unknown options",
);

assert.throws(
  () => parseWindowsReservedUriArgs(["--wat"]),
  /Unknown option: --wat/,
  "windows reserved URI import args should reject unknown options",
);

{
  const fixtureTerms = loadTermsFromFixture(
    path.resolve(
      process.cwd(),
      "test",
      "fixtures",
      "wikidata-brand-seed-terms.json",
    ),
  );
  assert.equal(
    fixtureTerms.includes("openai") && fixtureTerms.includes("paypal"),
    true,
    "wikidata evaluation should load the Wikidata seed cohort terms",
  );
}

{
  const calibrationFixture = loadCalibrationFixture(
    path.resolve(
      process.cwd(),
      "test",
      "fixtures",
      "brand-profile-calibration.json",
    ),
  );
  assert.equal(
    calibrationFixture.some(
      (group) =>
        group.label === "maintained protectedBrand review positives" &&
        group.values.includes("openai"),
    ),
    true,
    "brand profile evaluation should load the maintained calibration corpus",
  );
}

{
  const report = evaluateBrandProfile({
    bundleFile: path.resolve(process.cwd(), "dist", "runtime-sources.json"),
    fixtureFile: path.resolve(
      process.cwd(),
      "test",
      "fixtures",
      "brand-profile-calibration.json",
    ),
  });
  assert.equal(
    report.summary.totalCases > 0,
    true,
    "brand profile evaluation should emit non-empty reports",
  );
  assert.equal(
    report.evaluations.some(
      (entry) =>
        entry.value === "openai" &&
        entry.expected === "review" &&
        entry.actual === "review",
    ),
    true,
    "brand profile evaluation should record maintained review positives",
  );
  assert.equal(
    report.evaluations.some(
      (entry) =>
        entry.value === "playstation" &&
        entry.expected === "review" &&
        entry.actual === "review",
    ),
    true,
    "brand profile evaluation should record calibrated USPTO-derived review positives",
  );
  assert.equal(
    report.evaluations.some(
      (entry) =>
        entry.value === "apple" &&
        entry.expected === "allow" &&
        entry.actual === "allow",
    ),
    true,
    "brand profile evaluation should record documented ambiguity-prone allows",
  );
  assert.equal(
    report.evaluations.some(
      (entry) =>
        entry.value === "3m" &&
        entry.expected === "allow" &&
        entry.actual === "allow",
    ),
    true,
    "brand profile evaluation should record numeric brand non-goals explicitly",
  );
}

{
  assert.equal(
    deriveFilterTerm({
      label: "Visa Inc.",
      aliases: ["Visa"],
    }),
    "visa",
    "wikidata evaluation should derive filter terms without corporate suffixes",
  );
  assert.equal(
    deriveFilterTerm({
      label: "Stripe",
      aliases: [],
    }),
    "stripe",
    "wikidata evaluation should preserve plain brand-facing labels as filter terms",
  );
}

{
  const exactBrandCandidate = scoreCandidate("openai", {
    id: "Q21708200",
    page: "https://www.wikidata.org/wiki/Q21708200",
    label: "OpenAI",
    description: "American artificial intelligence research organization",
    aliases: [],
    instanceOf: ["Q163740"],
  });
  const ambiguousCommonNounCandidate = scoreCandidate("apple", {
    id: "Q89",
    page: "https://www.wikidata.org/wiki/Q89",
    label: "apple",
    description: "edible fruit of the apple tree",
    aliases: [],
    instanceOf: [],
  });
  const legalSuffixCandidate = scoreCandidate("apple", {
    id: "Q312",
    page: "https://www.wikidata.org/wiki/Q312",
    label: "Apple Inc.",
    description:
      "American multinational technology company based in Cupertino, California",
    aliases: ["Apple"],
    instanceOf: ["Q4830453", "Q6881511"],
  });

  assert.equal(
    exactBrandCandidate.score > 0,
    true,
    "wikidata scoring should reward exact brand-facing labels",
  );
  assert.equal(
    legalSuffixCandidate.score > exactBrandCandidate.score,
    true,
    "wikidata scoring should strongly reward legal-suffix company labels when they also expose the bare brand alias",
  );
  assert.equal(
    legalSuffixCandidate.derivedTerm,
    "apple",
    "wikidata scoring should derive the brand term without the legal suffix when a company page is selected",
  );
  assert.equal(
    ambiguousCommonNounCandidate.score < 0,
    true,
    "wikidata scoring should down-rank obvious common-noun collisions",
  );
  assert.equal(
    isAcceptedWikidataBrandCandidate("openai", exactBrandCandidate),
    true,
    "wikidata supplement should accept clean exact brand candidates",
  );
  assert.equal(
    isAcceptedWikidataBrandCandidate("apple", legalSuffixCandidate),
    false,
    "wikidata supplement should reject ambiguity-blocked brand terms by default",
  );
}

{
  const candidates = evaluateSearchResults(
    "apple",
    [
      {
        id: "Q89",
        label: "apple",
        description: "edible fruit of the apple tree",
      },
      {
        id: "Q312",
        label: "Apple Inc.",
        description:
          "American multinational technology company based in Cupertino, California",
      },
    ],
    {
      Q89: {
        id: "Q89",
        labels: { en: { value: "apple" } },
        descriptions: { en: { value: "edible fruit of the apple tree" } },
        aliases: {},
        claims: {},
      },
      Q312: {
        id: "Q312",
        labels: { en: { value: "Apple Inc." } },
        descriptions: {
          en: {
            value:
              "American multinational technology company based in Cupertino, California",
          },
        },
        aliases: { en: [{ value: "Apple" }] },
        claims: {
          P31: [
            { mainsnak: { datavalue: { value: { id: "Q4830453" } } } },
            { mainsnak: { datavalue: { value: { id: "Q6881511" } } } },
          ],
        },
      },
    },
  );
  assert.equal(
    candidates[0].id,
    "Q312",
    "wikidata evaluation should rank the brand/company page ahead of the common-noun page",
  );
}

{
  const derivedImpersonation = buildDerivedImpersonationSource({
    sources: [
      validateSource({
        id: "imported-rfc2142-role-mailboxes",
        rules: [
          {
            id: "rfc/support",
            term: "support",
            category: "impersonation",
            scopes: ["tenantSlug"],
            match: "token",
            normalizationField: "confusableSkeleton",
          },
          {
            id: "rfc/security",
            term: "security",
            category: "impersonation",
            scopes: ["tenantSlug"],
            match: "token",
            normalizationField: "confusableSkeleton",
          },
        ],
      }),
      validateSource({
        id: "imported-gitlab-reserved-names",
        rules: [
          {
            id: "gitlab/admin",
            term: "admin",
            category: "reservedTechnical",
            scopes: ["tenantSlug"],
            match: "token",
            normalizationField: "slug",
          },
          {
            id: "gitlab/help",
            term: "help",
            category: "reservedTechnical",
            scopes: ["tenantSlug"],
            match: "token",
            normalizationField: "slug",
          },
          {
            id: "gitlab/profile",
            term: "profile",
            category: "reservedTechnical",
            scopes: ["tenantSlug"],
            match: "token",
            normalizationField: "slug",
          },
        ],
      }),
      validateSource({
        id: "imported-reserved-usernames",
        rules: [
          {
            id: "reserved-usernames/admin",
            term: "admin",
            category: "reservedTechnical",
            scopes: ["tenantSlug"],
            match: "token",
            normalizationField: "slug",
          },
          {
            id: "reserved-usernames/webmail",
            term: "webmail",
            category: "reservedTechnical",
            scopes: ["tenantSlug"],
            match: "token",
            normalizationField: "slug",
          },
          {
            id: "reserved-usernames/root",
            term: "root",
            category: "reservedTechnical",
            scopes: ["tenantSlug"],
            match: "token",
            normalizationField: "slug",
          },
        ],
      }),
    ],
  });
  assert.deepEqual(
    derivedImpersonation.rules.map((rule) => rule.term),
    ["admin", "help", "profile", "webmail"],
    "derived impersonation builder should keep only conservative additive role and account-access terms",
  );
}

{
  const sources = [
    validateSource({
      id: "imported-rfc2142-role-mailboxes",
      rules: [
        {
          id: "rfc/support",
          term: "support",
          category: "impersonation",
          scopes: ["tenantSlug"],
          match: "token",
          normalizationField: "confusableSkeleton",
        },
        {
          id: "rfc/security",
          term: "security",
          category: "impersonation",
          scopes: ["tenantSlug"],
          match: "token",
          normalizationField: "confusableSkeleton",
        },
      ],
      compositeRules: [
        {
          id: "rfc/security-support",
          term: "security+support",
          category: "compositeRisk",
          scopes: ["tenantSlug"],
          allOf: ["security", "support"],
        },
      ],
    }),
    validateSource({
      id: "derived-impersonation",
      rules: [
        {
          id: "derived/admin",
          term: "admin",
          category: "impersonation",
          scopes: ["tenantSlug"],
          match: "token",
          normalizationField: "confusableSkeleton",
        },
        {
          id: "derived/help",
          term: "help",
          category: "impersonation",
          scopes: ["tenantSlug"],
          match: "token",
          normalizationField: "confusableSkeleton",
        },
      ],
    }),
  ];

  assert.deepEqual(
    deriveCompositeRiskRules(sources).map((rule) => rule.term),
    ["admin+security", "admin+support", "help+security", "help+support"],
    "derived composite-risk builder should generate additive exact-token pairs against the maintained support and security anchors",
  );

  const derivedComposite = buildDerivedCompositeRiskSource({ sources });
  assert.equal(
    derivedComposite.compositeRules.length,
    4,
    "derived composite-risk source should keep the generated composite rules",
  );
}

{
  const source = buildWikidataBrandRiskSource({
    id: "wikidata-brand-gap-evaluation",
    version: 1,
    generatedAt: "2026-03-14T00:00:00.000Z",
    terms: [
      {
        term: "openai",
        recommended: {
          id: "Q21708200",
          derivedTerm: "openai",
          recommendedTerm: "openai",
          exactLabelMatch: true,
          aliasMatch: false,
          legalSuffixMatch: false,
          positiveDescription: true,
          relevantClass: true,
          negativeDescription: false,
          score: 140,
        },
      },
      {
        term: "apple",
        recommended: {
          id: "Q312",
          derivedTerm: "apple",
          recommendedTerm: "apple",
          exactLabelMatch: false,
          aliasMatch: true,
          legalSuffixMatch: true,
          positiveDescription: true,
          relevantClass: true,
          negativeDescription: false,
          score: 170,
        },
      },
      {
        term: "mastercard",
        recommended: {
          id: "Q489921",
          derivedTerm: "mastercard",
          recommendedTerm: "mastercard",
          exactLabelMatch: true,
          aliasMatch: false,
          legalSuffixMatch: false,
          positiveDescription: true,
          relevantClass: true,
          negativeDescription: false,
          score: 140,
        },
      },
    ],
  });
  assert.deepEqual(
    source.rules.map((rule) => rule.term),
    ["mastercard", "openai"],
    "wikidata supplement should keep the accepted cohort and exclude ambiguity-blocked terms",
  );
  assert.equal(
    source.metadata.source,
    "Wikidata",
    "wikidata supplement should stamp Wikidata source metadata",
  );
}

assert.throws(
  () => parseRuntimeBenchmarkArgs(["--iterations", "0"]),
  /Invalid option: --iterations must be a positive integer/,
  "runtime benchmark args should reject non-positive iteration counts",
);

{
  const summary = benchmarkRuntime({
    bundleFile: path.resolve(process.cwd(), "dist", "runtime-sources.json"),
    iterations: 20,
    warmupIterations: 2,
  });
  assert.equal(
    summary.id,
    "runtime-benchmark",
    "runtime benchmark should return a stable result id",
  );
  assert.equal(
    summary.version,
    1,
    "runtime benchmark should return a stable result version",
  );
  assert.equal(
    summary.iterations,
    20,
    "runtime benchmark should report the requested iteration count",
  );
  assert.equal(
    summary.benchmarkCases > 0,
    true,
    "runtime benchmark should use maintained fixture cases",
  );
  assert.equal(
    summary.bundleLoadMs >= 0,
    true,
    "runtime benchmark should measure bundle load time",
  );
  assert.equal(
    summary.engineCreateMs >= 0,
    true,
    "runtime benchmark should measure engine creation time",
  );
  assert.equal(
    summary.avgEvalMs >= 0,
    true,
    "runtime benchmark should measure evaluation latency",
  );
}

{
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nomsentry-budget-"));
  const budgetFile = path.join(tempDir, "budget.json");
  fs.writeFileSync(
    budgetFile,
    JSON.stringify({
      max: {
        bundleLoadMs: 1,
        engineCreateMs: 2,
        avgEvalMs: 3,
        p95EvalMs: 4,
        p99EvalMs: 5,
      },
    }),
  );

  try {
    const budget = loadBenchmarkBudget(budgetFile);
    assert.equal(
      budget.max.p95EvalMs,
      4,
      "benchmark budget helper should load numeric limits",
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  assert.deepEqual(
    evaluateBenchmarkBudget(
      {
        bundleLoadMs: 10,
        engineCreateMs: 1,
        avgEvalMs: 0.01,
        p95EvalMs: 0.02,
        p99EvalMs: 0.03,
      },
      {
        max: {
          bundleLoadMs: 5,
          engineCreateMs: 2,
          avgEvalMs: 0.1,
          p95EvalMs: 0.2,
          p99EvalMs: 0.3,
        },
      },
    ),
    [
      {
        metric: "bundleLoadMs",
        actual: 10,
        max: 5,
      },
    ],
    "benchmark budget helper should report metrics above budget",
  );

  assert.equal(
    parseBenchmarkBudgetArgs(["--iterations", "25", "--warmup-iterations", "5"])
      .iterations,
    25,
    "benchmark budget CLI should parse iteration overrides",
  );
}

{
  const manifest = JSON.parse(
    fs.readFileSync(
      new URL("../dist/build-manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(
    manifest.id,
    "build-provenance-manifest",
    "build manifest should have a stable id",
  );
  assert.equal(
    manifest.version,
    3,
    "build manifest should have a stable version",
  );
  assert.equal(
    manifest.provenanceInputs.refreshPolicyFile,
    "source-refresh-policy.json",
    "build manifest should record the deterministic refresh-policy input",
  );
  assert.equal(
    typeof manifest.provenanceInputs.refreshPolicySha256,
    "string",
    "build manifest should hash the refresh-policy input",
  );
  assert.equal(
    manifest.provenanceInputs.packageLockFile,
    "package-lock.json",
    "build manifest should record the package-lock input when it exists",
  );
  assert.equal(
    manifest.sourceArtifacts.some(
      (entry) =>
        entry.id === "imported-github-reserved-usernames" &&
        entry.source === "GitHub Docs",
    ),
    true,
    "build manifest should enumerate the GitHub reserved usernames artifact",
  );
  assert.equal(
    manifest.sourceArtifacts.some(
      (entry) =>
        entry.id === "imported-icann-reserved-names" &&
        entry.source === "ICANN",
    ),
    true,
    "build manifest should enumerate the ICANN reserved names artifact",
  );
  assert.equal(
    manifest.sourceArtifacts.some(
      (entry) =>
        entry.id === "imported-gitlab-reserved-names" &&
        entry.source === "GitLab Docs",
    ),
    true,
    "build manifest should enumerate maintained source artifacts",
  );
  assert.equal(
    manifest.sourceArtifacts.some(
      (entry) =>
        entry.id === "imported-reserved-usernames-impersonation" &&
        entry.source === "reserved-usernames",
    ),
    true,
    "build manifest should enumerate the reserved-usernames impersonation artifact",
  );
  assert.equal(
    manifest.sourceArtifacts.some(
      (entry) =>
        entry.id === "imported-windows-reserved-uri-schemes" &&
        entry.source === "Microsoft Learn",
    ),
    true,
    "build manifest should enumerate the Windows reserved URI scheme artifact",
  );
  assert.equal(
    manifest.sourceArtifacts.some(
      (entry) =>
        entry.id === "derived-impersonation" &&
        entry.source === "Derived maintained impersonation vocabulary",
    ),
    true,
    "build manifest should enumerate the derived impersonation artifact",
  );
  assert.equal(
    manifest.sourceArtifacts.some(
      (entry) =>
        entry.id === "derived-composite-risk" &&
        entry.source === "Derived maintained composite-risk vocabulary",
    ),
    true,
    "build manifest should enumerate the derived composite-risk artifact",
  );
  assert.deepEqual(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "imported-2toad-profanity-en",
    )?.upstreamVersion,
    { source: "package-lock.json", value: "3.2.0" },
    "build manifest should pin package-backed dataset versions from package-lock",
  );
  assert.deepEqual(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "derived-uspto-brand-risk",
    )?.refreshPolicy,
    {
      source: "source-refresh-policy",
      version: 1,
      maxAgeDays: 45,
      notes:
        "Trademark-derived artifacts should be reviewed and refreshed at least every 45 days.",
    },
    "build manifest should carry the matched refresh policy for maintained artifacts",
  );
  assert.deepEqual(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "derived-wikidata-brand-risk",
    )?.refreshPolicy,
    {
      source: "source-refresh-policy",
      version: 1,
      maxAgeDays: 45,
      notes:
        "Derived Wikidata brand supplements should be reviewed and refreshed at least every 45 days.",
    },
    "build manifest should carry refresh policy metadata for the Wikidata supplement",
  );
  assert.equal(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "derived-uspto-brand-risk",
    )?.transformVersion,
    "derive-uspto-brand-risk@4",
    "build manifest should record deterministic transform versions for derived artifacts",
  );
  assert.equal(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "imported-github-reserved-usernames",
    )?.transformVersion,
    "import-github-reserved-usernames@1",
    "build manifest should record deterministic transform versions for GitHub reserved usernames",
  );
  assert.equal(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "imported-icann-reserved-names",
    )?.transformVersion,
    "import-icann-reserved-names@1",
    "build manifest should record deterministic transform versions for ICANN reserved names",
  );
  assert.equal(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "imported-reserved-usernames-impersonation",
    )?.transformVersion,
    "import-reserved-usernames-impersonation@1",
    "build manifest should record deterministic transform versions for reserved-usernames impersonation",
  );
  assert.equal(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "derived-wikidata-brand-risk",
    )?.transformVersion,
    "derive-wikidata-brand-risk@2",
    "build manifest should record deterministic transform versions for the Wikidata supplement",
  );
  assert.equal(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "derived-impersonation",
    )?.transformVersion,
    "derive-impersonation@1",
    "build manifest should record deterministic transform versions for the derived impersonation layer",
  );
  assert.equal(
    manifest.sourceArtifacts.find(
      (entry) => entry.id === "derived-composite-risk",
    )?.transformVersion,
    "derive-composite-risk@1",
    "build manifest should record deterministic transform versions for the derived composite-risk layer",
  );
  assert.equal(
    manifest.runtimeArtifact.transformVersion,
    "build-runtime-sources@1",
    "build manifest should record the runtime bundle transform version",
  );
  assert.equal(
    manifest.runtimeArtifact.sourceArtifactSetSha256,
    manifest.sourceArtifactSetSha256,
    "build manifest should tie the runtime artifact to the exact source artifact set",
  );
  assert.equal(
    manifest.provenanceInputs.sourceIntegrityLockFile,
    "source-integrity-lock.json",
    "build manifest should record the checked-in source integrity lock file",
  );
  assert.equal(
    typeof manifest.provenanceInputs.sourceIntegrityLockSha256,
    "string",
    "build manifest should hash the source integrity lock file",
  );
  assert.equal(
    manifest.provenanceInputs.sourceIntegrityLockVersion,
    1,
    "build manifest should record the source integrity lock schema version",
  );
  assert.equal(
    typeof manifest.sourceArtifacts.find(
      (entry) => entry.id === "imported-gitlab-reserved-names",
    )?.upstreamIntegrity?.responseSha256,
    "string",
    "build manifest should attach captured upstream integrity metadata to external fetched sources",
  );
}

{
  const refreshPolicy = validateRefreshPolicy(
    JSON.parse(
      fs.readFileSync(
        new URL("../source-refresh-policy.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  const ldnoobwPolicy = findRefreshPolicy(refreshPolicy, { source: "LDNOOBW" });
  assert.equal(
    ldnoobwPolicy?.maxAgeDays,
    180,
    "refresh policy lookup should match on source name",
  );
  assert.equal(
    resolveAsOfDate("2026-03-14"),
    "2026-03-14",
    "freshness checks should accept ISO date inputs",
  );
  assert.equal(
    ldnoobwPolicy?.requiresUpstreamIntegrity,
    true,
    "refresh policy should flag external fetched sources that require captured upstream integrity",
  );
}

assert.throws(
  () => validateRefreshPolicy({ id: "bad", version: 1, policies: [] }),
  /source refresh policy must have id 'source-refresh-policy'/,
  "refresh policy validation should require the stable policy id",
);

assert.throws(
  () =>
    validateRefreshPolicy({
      id: "source-refresh-policy",
      version: 1,
      policies: [
        {
          match: { source: "LDNOOBW" },
          maxAgeDays: 180,
          requiresUpstreamIntegrity: "yes",
        },
      ],
    }),
  /requiresUpstreamIntegrity must be a boolean/,
  "refresh policy validation should reject non-boolean upstream-integrity flags",
);

{
  const results = assessFreshness({
    manifest: {
      sourceArtifacts: [
        { file: "custom/sources/example-a.json", id: "a", source: "LDNOOBW" },
        { file: "custom/sources/example-b.json", id: "b", source: "RFC 2142" },
      ],
    },
    policy: {
      id: "source-refresh-policy",
      version: 1,
      policies: [
        { match: { source: "LDNOOBW" }, maxAgeDays: 180 },
        { match: { source: "RFC 2142" }, maxAgeDays: 3650 },
      ],
    },
    asOfDate: "2026-03-14",
    getCommitDate(filePath) {
      if (filePath.endsWith("example-a.json")) return "2026-03-01";
      return "2020-01-01";
    },
  });
  assert.deepEqual(
    results.map((entry) => ({ file: entry.file, stale: entry.stale })),
    [
      { file: "custom/sources/example-a.json", stale: false },
      { file: "custom/sources/example-b.json", stale: false },
    ],
    "freshness assessment should apply policy-specific age limits",
  );
}

{
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "nomsentry-freshness-mtime-"),
  );
  const filePath = path.join(tmpDir, "source.json");
  fs.writeFileSync(filePath, "{}", "utf8");
  const originalCwd = process.cwd();
  process.chdir(tmpDir);
  try {
    const commitDate = getLastCommitDate("source.json");
    assert.match(
      commitDate,
      /^\d{4}-\d{2}-\d{2}$/,
      "freshness checks should fall back to file mtime when a file has no git history",
    );
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

assert.throws(
  () =>
    assessFreshness({
      manifest: {
        sourceArtifacts: [
          {
            file: "custom/sources/example.json",
            id: "x",
            source: "Unknown Source",
          },
        ],
      },
      policy: {
        id: "source-refresh-policy",
        version: 1,
        policies: [{ match: { source: "LDNOOBW" }, maxAgeDays: 180 }],
      },
      asOfDate: "2026-03-14",
      getCommitDate() {
        return "2026-03-01";
      },
    }),
  /No refresh policy found/,
  "freshness assessment should fail fast for unmanaged sources",
);

assert.equal(
  parseContentType("text/html; charset=utf-8"),
  "text/html",
  "content-type parsing should normalize MIME types without parameters",
);

{
  const integrity = await captureUrlIntegrity(
    "https://example.test/source.txt",
    async () =>
      new Response("hello world", {
        status: 200,
        headers: {
          etag: '"abc123"',
          "last-modified": "Sat, 14 Mar 2026 00:00:00 GMT",
          "content-type": "text/plain; charset=utf-8",
        },
      }),
  );
  assert.deepEqual(
    integrity,
    {
      responseSha256:
        "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      etag: '"abc123"',
      lastModified: "Sat, 14 Mar 2026 00:00:00 GMT",
      contentType: "text/plain",
    },
    "captured source integrity should include a body hash and normalized headers",
  );
}

{
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "nomsentry-integrity-targets-"),
  );
  try {
    writeTextFileAtomic(
      path.join(tmpDir, "gitlab-reserved-names.json"),
      JSON.stringify({
        id: "imported-gitlab-reserved-names",
        metadata: {
          source: "GitLab Docs",
          sourceUrl: "https://docs.gitlab.com/user/reserved_names/",
        },
        rules: [],
      }),
    );
    writeTextFileAtomic(
      path.join(tmpDir, "reserved-usernames.json"),
      JSON.stringify({
        id: "imported-reserved-usernames",
        metadata: {
          source: "reserved-usernames",
          sourceUrl: "https://github.com/mvila/reserved-usernames",
        },
        rules: [],
      }),
    );

    const targets = buildIntegrityTargets(tmpDir, {
      id: "source-refresh-policy",
      version: 1,
      policies: [
        {
          match: { source: "GitLab Docs" },
          maxAgeDays: 180,
          requiresUpstreamIntegrity: true,
        },
        {
          match: { source: "reserved-usernames" },
          maxAgeDays: 180,
        },
      ],
    });
    assert.deepEqual(
      targets.map((target) => ({
        file: path.basename(target.file),
        id: target.id,
        source: target.source,
        fetchUrl: target.fetchUrl,
      })),
      [
        {
          file: "gitlab-reserved-names.json",
          id: "imported-gitlab-reserved-names",
          source: "GitLab Docs",
          fetchUrl:
            "https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/user/reserved_names.md",
        },
      ],
      "integrity target selection should only include policy-managed external fetch sources and use the real fetch URL",
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

{
  const validLock = validateSourceIntegrityLock({
    id: "source-integrity-lock",
    version: 1,
    entries: [
      {
        file: "custom/sources/gitlab-reserved-names.json",
        id: "imported-gitlab-reserved-names",
        source: "GitLab Docs",
        fetchUrl:
          "https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/user/reserved_names.md",
        sourceArtifactSha256: "a".repeat(64),
        responseSha256: "b".repeat(64),
        etag: '"abc123"',
        lastModified: "Sat, 14 Mar 2026 00:00:00 GMT",
        contentType: "text/markdown",
      },
    ],
  });
  assert.equal(
    validLock.entries.length,
    1,
    "source integrity lock validation should accept well-formed lock files",
  );
  assert.throws(
    () =>
      validateSourceIntegrityLock({
        id: "source-integrity-lock",
        version: 1,
        entries: [
          {
            file: "x.json",
            id: "x",
            source: "x",
            fetchUrl: "https://example.test/x",
            sourceArtifactSha256: "short",
            responseSha256: "y".repeat(64),
          },
        ],
      }),
    /sha256 hex digests/,
    "source integrity lock validation should reject malformed digests",
  );
}

{
  const count = evaluateSourceIntegrity({
    targets: [
      {
        file: "custom/sources/gitlab-reserved-names.json",
        id: "imported-gitlab-reserved-names",
        source: "GitLab Docs",
        fetchUrl:
          "https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/user/reserved_names.md",
        sourceArtifactSha256: "c".repeat(64),
      },
    ],
    lock: {
      id: "source-integrity-lock",
      version: 1,
      entries: [
        {
          file: "custom/sources/gitlab-reserved-names.json",
          id: "imported-gitlab-reserved-names",
          source: "GitLab Docs",
          fetchUrl:
            "https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/user/reserved_names.md",
          sourceArtifactSha256: "c".repeat(64),
          responseSha256: "d".repeat(64),
          etag: null,
          lastModified: null,
          contentType: "text/markdown",
        },
      ],
    },
  });
  assert.equal(
    count,
    1,
    "source integrity evaluation should accept matching lock entries",
  );
  assert.throws(
    () =>
      evaluateSourceIntegrity({
        targets: [
          {
            file: "custom/sources/gitlab-reserved-names.json",
            id: "imported-gitlab-reserved-names",
            source: "GitLab Docs",
            fetchUrl:
              "https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/user/reserved_names.md",
            sourceArtifactSha256: "c".repeat(64),
          },
        ],
        lock: {
          id: "source-integrity-lock",
          version: 1,
          entries: [],
        },
      }),
    /Missing source integrity entry/,
    "source integrity evaluation should fail fast for missing required entries",
  );
}

assert.deepEqual(
  parseSourceIntegrityArgs([
    "--input-dir",
    "fixtures",
    "--policy-file",
    "source-refresh-policy.json",
    "--lock-file",
    "source-integrity-lock.json",
  ]),
  {
    inputDir: path.resolve(process.cwd(), "fixtures"),
    policyFile: path.resolve(process.cwd(), "source-refresh-policy.json"),
    lockFile: path.resolve(process.cwd(), "source-integrity-lock.json"),
  },
  "source integrity check argument parsing should resolve explicit paths",
);

assert.deepEqual(
  parseReleaseAttestationArgs([
    "--workflow-file",
    ".github/workflows/release-publish.yml",
  ]),
  {
    workflowFile: path.resolve(
      process.cwd(),
      ".github/workflows/release-publish.yml",
    ),
  },
  "release attestation check argument parsing should resolve explicit paths",
);

assert.deepEqual(
  evaluateReleaseWorkflow(`
name: Release
jobs:
  publish:
    permissions:
      id-token: write
    steps:
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`),
  [],
  "release attestation evaluation should accept workflows with provenance publishing and OIDC permissions",
);

assert.deepEqual(
  evaluateReleaseWorkflow(`
name: Release
jobs:
  publish:
    permissions:
      contents: read
    steps:
      - run: npm publish --access public
`),
  [
    "release workflow must request id-token: write permissions",
    "release workflow must publish with npm --provenance",
    "release workflow must read npm auth from secrets.NPM_TOKEN",
  ],
  "release attestation evaluation should report missing OIDC, provenance, and npm-token settings",
);
