import { normalizeValue } from "./normalize.js";
import { matchRules } from "./matchers.js";
import { detectCompositeRisk } from "./composite.js";
import { detectScriptRisk } from "./script-risk.js";
import { decide } from "./decision.js";
import { applyAllowOverrides } from "./overrides.js";

export function createEngine({ sources = [], policies = [], allowOverrides = [] } = {}) {
  const rules = sources.flatMap((s) => s.rules || []);
  const compositeRules = sources.flatMap((s) => s.compositeRules || []);

  function resolvePolicy(kind) {
    const policy = policies.find((p) => (p.appliesTo || []).includes(kind));
    if (!policy) throw new Error(`No policy configured for kind: ${kind}`);
    return policy;
  }

  function evaluate({ value, kind, context = {} }) {
    const normalized = normalizeValue(value);
    const policy = resolvePolicy(kind);

    const matches = matchRules({
      normalized,
      kind,
      rules
    });

    const scriptRisk = detectScriptRisk(normalized.raw);
    if (scriptRisk.mixed) {
      matches.push({
        rule: {
          id: "derived/script-risk",
          term: scriptRisk.scripts.join("+"),
          category: "scriptRisk"
        },
        matchType: "derived",
        comparedField: "raw"
      });
    }

    for (const compositeRule of detectCompositeRisk({ normalized, kind, compositeRules })) {
      matches.push({
        rule: compositeRule,
        matchType: "composite",
        comparedField: "separatorFolded"
      });
    }

    const provisional = decide({ matches, policy });
    const override = applyAllowOverrides({
      normalized,
      kind,
      provisional: provisional.outcome,
      reasons: provisional.reasons,
      overrides: allowOverrides,
      context
    });

    return {
      input: value,
      kind,
      normalized,
      matchedRules: matches.map((m) => ({
        ruleId: m.rule.id,
        category: m.rule.category,
        term: m.rule.term,
        matchType: m.matchType,
        comparedField: m.comparedField
      })),
      provisionalDecision: provisional.outcome,
      decision: override.decision,
      overridden: override.overridden,
      override: override.override,
      reasons: override.reasons,
      projectionsUsed: Array.from(new Set(matches.map((m) => m.comparedField).filter(Boolean)))
    };
  }

  return { evaluate };
}
