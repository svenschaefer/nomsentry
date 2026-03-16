import { normalizeValue } from "./normalize.js";
import { buildRuleIndex, matchRules } from "./matchers.js";
import { buildAffixRiskIndex, detectAffixRisk } from "./affix-risk.js";
import { detectCompositeRisk } from "./composite.js";
import { detectScriptRisk } from "./script-risk.js";
import { decide } from "./decision.js";
import { applyAllowOverrides } from "./overrides.js";

function dedupeMatches(matches) {
  const seen = new Set();
  const deduped = [];

  for (const match of matches) {
    const key = [
      match.rule.category,
      match.rule.term ??
        (Number.isInteger(match.rule.rid) ? `#${match.rule.rid}` : ""),
      match.matchType,
      match.comparedField,
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(match);
  }

  return deduped;
}

export function createEngine({
  sources = [],
  policies = [],
  allowOverrides = [],
} = {}) {
  const indexedRules = [];
  const ruleCatalog = [];
  let order = 0;

  for (const source of sources) {
    for (const rule of source.rules || []) {
      const field = rule.normalizationField || "separatorFolded";
      const normalizedTerm =
        normalizeValue(rule.term)[field] ||
        String(rule.term ?? "").toLowerCase();
      const rid = ruleCatalog.length;
      const sourceRid = Number.isInteger(rule.rid) ? rule.rid : rid;
      const idPrefix = rule.idPrefix || "r";
      ruleCatalog.push({
        rid: sourceRid,
        idPrefix,
        id: rule.id,
        term: rule.term,
        category: rule.category,
        severity: rule.severity,
        _order: order,
      });
      indexedRules.push({
        rid,
        term: rule.term,
        category: rule.category,
        enabled: rule.enabled,
        scopes: rule.scopes,
        match: rule.match,
        normalizationField: field,
        normalizedTerm,
      });
      order += 1;
    }
  }

  const ruleIndex = buildRuleIndex(indexedRules);
  ruleIndex.ruleCatalog = ruleCatalog;
  const affixRiskIndex = buildAffixRiskIndex(indexedRules);
  const compositeRules = sources.flatMap((s) =>
    (s.compositeRules || []).map((rule) => ({
      ...rule,
      normalizedAllOf: (rule.allOf || []).map(
        (term) => normalizeValue(term).latinFolded,
      ),
    })),
  );

  const ruleKinds = Array.from(
    new Set(indexedRules.flatMap((rule) => rule.scopes || []).filter(Boolean)),
  );
  const compositeKinds = Array.from(
    new Set(
      compositeRules.flatMap((rule) => rule.scopes || []).filter(Boolean),
    ),
  );

  function resolvePolicy(kind) {
    if (kind) {
      const policy = policies.find((p) => (p.appliesTo || []).includes(kind));
      if (policy) return policy;
      throw new Error(`No policy configured for kind: ${kind}`);
    }

    const defaultPolicy = policies.find((p) =>
      (p.appliesTo || []).includes("default"),
    );
    if (defaultPolicy) return defaultPolicy;

    if (policies.length === 1) return policies[0];

    const policy = policies.find((p) => (p.appliesTo || []).length > 0);
    if (!policy) throw new Error(`No policy configured for kind: ${kind}`);
    return policy;
  }

  function resolveEvaluationKinds(kind, policy) {
    if (kind && kind !== "default") return [kind];
    if (!(policy.appliesTo || []).includes("default")) {
      const fallback = kind || policy.appliesTo?.[0];
      return fallback ? [fallback] : [];
    }

    const kinds = Array.from(new Set([...ruleKinds, ...compositeKinds]));
    return kinds;
  }

  function evaluate({ value, kind, context = {} }) {
    const normalized = normalizeValue(value);
    const policy = resolvePolicy(kind);
    const evaluationKinds = resolveEvaluationKinds(kind, policy);
    const resolvedKind = kind || "default";

    const matches = evaluationKinds.flatMap((evaluationKind) =>
      matchRules({
        normalized,
        kind: evaluationKind,
        ruleIndex,
      }),
    );
    for (const evaluationKind of evaluationKinds) {
      for (const affixMatch of detectAffixRisk({
        normalized,
        kind: evaluationKind,
        index: affixRiskIndex,
      })) {
        matches.push({
          rule: {
            id: `derived/affix-risk/${affixMatch.category}/${affixMatch.term}`,
            term: affixMatch.term,
            category: affixMatch.category,
          },
          matchType: `derived-affix-${affixMatch.position}`,
          comparedField: "compact",
        });
      }
    }

    const scriptRisk = detectScriptRisk(normalized.raw);
    if (scriptRisk.mixed) {
      matches.push({
        rule: {
          id: "derived/script-risk",
          term: scriptRisk.scripts.join("+"),
          category: "scriptRisk",
        },
        matchType: "derived",
        comparedField: "raw",
      });
    }

    for (const evaluationKind of evaluationKinds) {
      for (const compositeRule of detectCompositeRisk({
        normalized,
        kind: evaluationKind,
        compositeRules,
      })) {
        matches.push({
          rule: compositeRule,
          matchType: "composite",
          comparedField: "separatorFolded",
        });
      }
    }

    const matchesForDecision = dedupeMatches(matches);
    const provisional = decide({
      matches: matchesForDecision,
      policy,
    });
    const override = applyAllowOverrides({
      normalized,
      kind,
      provisional: provisional.outcome,
      reasons: provisional.reasons,
      policy,
      overrides: allowOverrides,
      context,
    });

    return {
      input: value,
      kind: resolvedKind,
      normalized,
      matchedRules: matchesForDecision.map((m) => ({
        ruleId:
          m.rule.id ??
          (Number.isInteger(m.rule.rid)
            ? `${m.rule.idPrefix || "r"}${m.rule.rid.toString(36)}`
            : null),
        category: m.rule.category,
        term: m.rule.term,
        severity: m.rule.severity,
        matchType: m.matchType,
        comparedField: m.comparedField,
      })),
      provisionalDecision: provisional.outcome,
      decision: override.decision,
      overridden: override.overridden,
      override: override.override,
      reasons: override.reasons,
      projectionsUsed: Array.from(
        new Set(matchesForDecision.map((m) => m.comparedField).filter(Boolean)),
      ),
    };
  }

  return { evaluate };
}
