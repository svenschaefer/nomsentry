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
        `separator-joined variant ${variant} should preserve compact normalization`,
      );
    }
  }
}

{
  const invisibleChars = ["\u200B", "\u200C", "\u200D", "\u2060", "\uFEFF"];
  const separators = ["-", "_", ".", "/", " "];
  const asciiBases = ["support", "admin", "openai", "merde"];
  const unicodeBases = ["scheiße", "sécurité"];

  function toFullwidthAscii(value) {
    return Array.from(value)
      .map((ch) => {
        if (/[A-Za-z0-9]/.test(ch)) {
          return String.fromCharCode(ch.charCodeAt(0) + 65248);
        }
        return ch;
      })
      .join("");
  }

  function deterministicCaseMix(value, seed) {
    return Array.from(value)
      .map((ch, index) => {
        if (!/[a-z]/i.test(ch)) return ch;
        return (seed + index) % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase();
      })
      .join("");
  }

  function injectInvisibles(value, seed) {
    const chars = Array.from(value);
    const parts = [];
    for (let index = 0; index < chars.length; index += 1) {
      parts.push(chars[index]);
      if (index < chars.length - 1 && (seed + index) % 3 === 0) {
        parts.push(invisibleChars[(seed + index) % invisibleChars.length]);
      }
    }
    return parts.join("");
  }

  function interleaveSeparators(value, seed) {
    const chars = Array.from(value);
    return chars
      .map((ch, index) => {
        if (index === chars.length - 1) return ch;
        return `${ch}${separators[(seed + index) % separators.length]}`;
      })
      .join("");
  }

  for (const [seed, base] of [...asciiBases, ...unicodeBases].entries()) {
    const expected = normalizeValue(base);
    const compactOnlyVariants = new Set([
      interleaveSeparators(base, seed),
      injectInvisibles(interleaveSeparators(base, seed), seed + 1),
    ]);
    const compactAndSlugVariants = new Set([
      deterministicCaseMix(base, seed),
      injectInvisibles(base, seed),
      deterministicCaseMix(base.normalize("NFD"), seed + 2),
    ]);

    if (asciiBases.includes(base)) {
      compactAndSlugVariants.add(toFullwidthAscii(base));
      compactAndSlugVariants.add(
        deterministicCaseMix(toFullwidthAscii(base), seed + 3),
      );
    }

    for (const variant of compactOnlyVariants) {
      const normalized = normalizeValue(variant);
      assert.equal(
        normalized.compact,
        expected.compact,
        `generated normalization variant ${JSON.stringify(variant)} should preserve compact output for ${base}`,
      );
    }

    for (const variant of compactAndSlugVariants) {
      const normalized = normalizeValue(variant);
      assert.equal(
        normalized.compact,
        expected.compact,
        `generated normalization variant ${JSON.stringify(variant)} should preserve compact output for ${base}`,
      );
      assert.equal(
        normalized.slug,
        expected.slug,
        `generated normalization variant ${JSON.stringify(variant)} should preserve slug output for ${base}`,
      );
    }
  }
}

{
  const invisibleChars = ["\u200B", "\u200C", "\u2060"];
  const separators = ["-", "_", ".", "/"];
  const variants = [
    {
      base: "support",
      confusable: "ѕuppоrt",
      expectedProjection: "support",
    },
    {
      base: "openai",
      confusable: "оpеnаi",
      expectedProjection: "openai",
    },
    {
      base: "security",
      confusable: "sесurіty",
      expectedProjection: "security",
    },
  ];

  for (const { base, confusable, expectedProjection } of variants) {
    const chars = Array.from(confusable);

    for (const separator of separators) {
      const separated = chars.join(separator);
      const withInvisibles = chars
        .map((ch, index) =>
          index === chars.length - 1
            ? ch
            : `${ch}${invisibleChars[index % invisibleChars.length]}${separator}`,
        )
        .join("");
      const nfdCaseMixed = Array.from(withInvisibles.normalize("NFD"))
        .map((ch, index) => {
          if (!/[a-z]/i.test(ch)) return ch;
          return index % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase();
        })
        .join("");

      for (const candidate of [separated, withInvisibles]) {
        const normalized = normalizeValue(candidate);
        assert.equal(
          normalized.compact,
          expectedProjection,
          `generated confusable-heavy variant ${JSON.stringify(candidate)} should preserve compact output for ${base}`,
        );
      }

      const normalizedNfdCaseMixed = normalizeValue(nfdCaseMixed);
      const expectedVariantSlug = normalizeValue(withInvisibles).slug;
      assert.equal(
        normalizedNfdCaseMixed.compact,
        expectedProjection,
        `generated confusable-heavy variant ${JSON.stringify(nfdCaseMixed)} should preserve compact output for ${base}`,
      );
      assert.equal(
        normalizedNfdCaseMixed.slug,
        expectedVariantSlug,
        `generated confusable-heavy variant ${JSON.stringify(nfdCaseMixed)} should preserve slug output for ${base}`,
      );
    }
  }
}

{
  const leetMap = new Map([
    ["a", "4"],
    ["e", "3"],
    ["i", "1"],
    ["o", "0"],
    ["s", "5"],
    ["t", "7"],
  ]);
  const confusableMap = new Map([
    ["a", "а"],
    ["c", "с"],
    ["e", "е"],
    ["i", "і"],
    ["o", "о"],
    ["p", "р"],
    ["s", "ѕ"],
    ["x", "х"],
  ]);
  const separators = ["-", "_", ".", "/"];
  const invisibles = ["\u200B", "\u200C", "\u200D", "\u2060"];
  const bases = ["admin", "support", "oauth", "scheisse", "paypal"];

  function createSeededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return ((state >>> 0) % 1000) / 1000;
    };
  }

  function maybeTransformChar(char, random) {
    let next = char;
    const lower = char.toLowerCase();

    if (leetMap.has(lower) && random() < 0.25) {
      next = leetMap.get(lower);
    } else if (confusableMap.has(lower) && random() < 0.25) {
      next = confusableMap.get(lower);
    } else if (/[a-z]/i.test(char) && random() < 0.3) {
      next = random() < 0.5 ? char.toUpperCase() : char.toLowerCase();
    }

    if (/[a-z]/i.test(char) && random() < 0.15) {
      next = Array.from(next)
        .map((part) =>
          /[A-Za-z]/.test(part)
            ? String.fromCharCode(part.charCodeAt(0) + 65248)
            : part,
        )
        .join("");
    }

    return next;
  }

  function fuzzVariant(base, seed) {
    const random = createSeededRandom(seed);
    const chars = Array.from(base.normalize("NFD"));
    const parts = [];
    let insertedSeparator = false;

    for (let index = 0; index < chars.length; index += 1) {
      const char = chars[index];
      parts.push(maybeTransformChar(char, random));
      if (index < chars.length - 1 && random() < 0.4) {
        parts.push(separators[Math.floor(random() * separators.length)]);
        insertedSeparator = true;
      }
      if (index < chars.length - 1 && random() < 0.35) {
        parts.push(invisibles[Math.floor(random() * invisibles.length)]);
      }
    }

    return {
      value: parts.join(""),
      insertedSeparator,
    };
  }

  for (const [baseIndex, base] of bases.entries()) {
    const expected = normalizeValue(base);

    for (let variantIndex = 0; variantIndex < 25; variantIndex += 1) {
      const variant = fuzzVariant(base, baseIndex * 100 + variantIndex + 1);
      const normalized = normalizeValue(variant.value);
      assert.equal(
        normalized.compact,
        expected.compact,
        `seeded normalization fuzz variant ${JSON.stringify(variant.value)} should preserve compact output for ${base}`,
      );
      if (!variant.insertedSeparator) {
        assert.equal(
          normalized.slug,
          expected.slug,
          `seeded normalization fuzz variant ${JSON.stringify(variant.value)} should preserve slug output for ${base} when no separators are injected`,
        );
      }
    }
  }
}

{
  const supportedConfusableVariants = [
    ["support", "ѕuppоrt"],
    ["security", "sесurіty"],
    ["openai", "оpеnаi"],
    ["paypal", "раypаl"],
    ["arschloch", "аrsсhlосh"],
  ];

  for (const [canonical, variant] of supportedConfusableVariants) {
    const canonicalNormalized = normalizeValue(canonical);
    const variantNormalized = normalizeValue(variant);
    assert.equal(
      variantNormalized.confusableSkeleton,
      canonicalNormalized.confusableSkeleton,
      `supported confusable variant ${variant} should preserve the confusable skeleton for ${canonical}`,
    );
    assert.equal(
      variantNormalized.compact,
      canonicalNormalized.compact,
      `supported confusable variant ${variant} should preserve compact output for ${canonical}`,
    );
  }
}

{
  const unconfigured = createEngine({ sources: [], policies: [] });
  assert.throws(
    () => unconfigured.evaluate({ value: "test", kind: "tenantSlug" }),
    /No policy configured for kind: tenantSlug/,
    "engine should fail loudly when no policy exists",
  );
}

{
  for (const testCase of [
    { value: "αdmin", kind: "tenantSlug" },
    { value: "раypal", kind: "tenantName" },
    { value: "оpenai", kind: "tenantSlug" },
  ]) {
    const result = engine.evaluate(testCase);
    assert.equal(
      result.reasons.some((reason) => reason.category === "scriptRisk"),
      true,
      `${testCase.value} should surface scriptRisk`,
    );
  }
}

{
  const result = detectScriptRisk("abcمرحبا");
  assert.equal(
    result.mixed,
    true,
    "latin and arabic should trigger mixed-script risk",
  );
}

{
  const result = detectScriptRisk("abc漢字");
  assert.equal(
    result.mixed,
    true,
    "latin and han should trigger mixed-script risk",
  );
}

{
  const result = detectScriptRisk("abcעברית");
  assert.equal(
    result.mixed,
    true,
    "latin and hebrew should trigger mixed-script risk",
  );
}
