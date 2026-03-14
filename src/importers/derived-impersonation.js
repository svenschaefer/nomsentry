import { validateSource } from "../schema/validate-source.js";

const IMPERSONATION_DERIVED_TERM_PATTERN =
  /^(admin|administrator|help|login|oauth|profile|secure|ssladmin|ssladministrator|sslwebmaster|sysadmin|sysadministrator|webmail)$/;

const CANDIDATE_SOURCE_IDS = new Set([
  "imported-gitlab-reserved-names",
  "imported-reserved-usernames",
]);

function compareStrings(left, right) {
  return left.localeCompare(right);
}

function getExistingImpersonationTerms(sources) {
  return new Set(
    sources.flatMap((source) => {
      if (source.id === "derived-impersonation") return [];
      return (source.rules ?? [])
        .filter((rule) => rule.category === "impersonation")
        .map((rule) => rule.term);
    }),
  );
}

export function deriveImpersonationTerms(sources) {
  const existingImpersonationTerms = getExistingImpersonationTerms(sources);
  const terms = new Set();

  for (const source of sources) {
    if (!CANDIDATE_SOURCE_IDS.has(source.id)) continue;
    for (const rule of source.rules ?? []) {
      const term = String(rule.term ?? "")
        .trim()
        .toLowerCase();
      if (!IMPERSONATION_DERIVED_TERM_PATTERN.test(term)) continue;
      if (existingImpersonationTerms.has(term)) continue;
      terms.add(term);
    }
  }

  return Array.from(terms).sort(compareStrings);
}

export function buildDerivedImpersonationSource({ sources }) {
  const terms = deriveImpersonationTerms(sources);
  return validateSource({
    id: "derived-impersonation",
    description:
      "Derived impersonation vocabulary built conservatively from maintained role and account-access sources",
    metadata: {
      source: "Derived maintained impersonation vocabulary",
      notes:
        "Derived from maintained RFC 2142, GitLab Docs, and reserved-usernames terms. Keeps only conservative role and account-access identifiers and intentionally does not attempt to cover billing, verification, trust, or recovery vocabulary.",
    },
    ruleDefaults: {
      category: "impersonation",
      scopes: ["username", "tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton",
      idPrefix: "derived-impersonation/",
    },
    rules: terms.map((term) => [term, term]),
  });
}
