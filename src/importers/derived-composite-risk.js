import { validateSource } from "../schema/validate-source.js";

const ANCHOR_TERMS = ["security", "support"];

const DERIVED_COMPOSITE_TERM_PATTERN =
  /^(admin|administrator|help|login|oauth|profile|secure|ssladmin|ssladministrator|sslwebmaster|sysadmin|sysadministrator|webmail)$/;

function compareStrings(left, right) {
  return left.localeCompare(right);
}

function normalizePair(left, right) {
  return [left, right].sort(compareStrings);
}

function getExistingCompositePairs(sources) {
  return new Set(
    sources
      .flatMap((source) =>
        source.id === "derived-composite-risk"
          ? []
          : (source.compositeRules ?? []),
      )
      .map((rule) => normalizePair(...(rule.allOf ?? [])).join("+")),
  );
}

function getImpersonationTerms(sources) {
  return new Set(
    sources.flatMap((source) =>
      (source.rules ?? [])
        .filter((rule) => rule.category === "impersonation")
        .map((rule) =>
          String(rule.term ?? "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  );
}

export function deriveCompositeRiskRules(sources) {
  const impersonationTerms = getImpersonationTerms(sources);
  const existingPairs = getExistingCompositePairs(sources);
  const rules = [];

  const candidates = Array.from(impersonationTerms)
    .filter((term) => DERIVED_COMPOSITE_TERM_PATTERN.test(term))
    .sort(compareStrings);

  for (const candidate of candidates) {
    for (const anchor of ANCHOR_TERMS) {
      if (!impersonationTerms.has(anchor)) continue;
      const allOf = normalizePair(candidate, anchor);
      const pairKey = allOf.join("+");
      if (existingPairs.has(pairKey)) continue;
      existingPairs.add(pairKey);
      rules.push({
        id: `derived-composite-risk/${pairKey}`,
        term: pairKey,
        category: "compositeRisk",
        scopes: ["username", "tenantSlug", "tenantName"],
        allOf,
      });
    }
  }

  return rules;
}

export function buildDerivedCompositeRiskSource({ sources }) {
  return validateSource({
    id: "derived-composite-risk",
    description:
      "Derived composite-risk rules built from maintained impersonation and account-access terms",
    metadata: {
      source: "Derived maintained composite-risk vocabulary",
      notes:
        "Derived from the maintained impersonation baseline. Generates exact-token deception combinations between conservative account-access terms and the maintained support and security anchors.",
    },
    compositeRules: deriveCompositeRiskRules(sources),
  });
}
