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
      match.rule.normalizedTerm || match.rule.term,
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
  const rules = sources.flatMap((s) =>
    (s.rules || []).map((rule, index) => {
      const field = rule.normalizationField || "separatorFolded";
      return {
        ...rule,
        _order: index,
        normalizedTerm:
          normalizeValue(rule.term)[field] ||
          String(rule.term ?? "").toLowerCase(),
      };
    }),
  );
  rules.forEach((rule, index) => {
    rule._order = index;
  });
  const ruleIndex = buildRuleIndex(rules);
  const affixRiskIndex = buildAffixRiskIndex(rules);
  const compositeRules = sources.flatMap((s) =>
    (s.compositeRules || []).map((rule) => ({
      ...rule,
      normalizedAllOf: (rule.allOf || []).map(
        (term) => normalizeValue(term).latinFolded,
      ),
    })),
  );

  const ruleKinds = Array.from(
    new Set(rules.flatMap((rule) => rule.scopes || []).filter(Boolean)),
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
        rules,
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

    const dedupedMatches = dedupeMatches(matches);
    const provisional = decide({ matches: dedupedMatches, policy });
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
      matchedRules: dedupedMatches.map((m) => ({
        ruleId: m.rule.id,
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
        new Set(dedupedMatches.map((m) => m.comparedField).filter(Boolean)),
      ),
    };
  }

  return { evaluate };
}
