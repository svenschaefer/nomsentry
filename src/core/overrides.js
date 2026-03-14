function deriveDecision({ reasons, policy, fallback }) {
  let outcome = "allow";

  for (const reason of reasons) {
    const action = policy?.decisionMatrix?.[reason.category] || "review";
    if (action === "reject") outcome = "reject";
    else if (action === "review" && outcome !== "reject") outcome = "review";
  }

  return reasons.length === 0 ? "allow" : outcome || fallback;
}

export function applyAllowOverrides({
  normalized,
  kind,
  provisional,
  reasons,
  overrides = [],
  context = {},
  policy,
}) {
  for (const rule of overrides) {
    if (!(rule.scopes || []).includes(kind)) continue;
    if (rule.match === "exact" && normalized.slug !== rule.term) continue;
    if (
      rule.conditions?.namespace &&
      !rule.conditions.namespace.includes(context.namespace)
    )
      continue;

    const suppressCategories = new Set(rule.override?.suppressCategories || []);

    if (suppressCategories.size > 0) {
      const remaining = reasons.filter(
        (r) => !suppressCategories.has(r.category),
      );
      if (remaining.length === reasons.length) continue;
      return {
        overridden: true,
        decision: deriveDecision({
          reasons: remaining,
          policy,
          fallback: provisional,
        }),
        reasons: remaining,
        override: {
          ruleId: rule.id,
          action: "allow",
          suppressCategories: Array.from(suppressCategories),
        },
      };
    }

    if (rule.override?.action === "allow") {
      return {
        overridden: true,
        decision: "allow",
        reasons,
        override: {
          ruleId: rule.id,
          action: "allow",
        },
      };
    }
  }

  return {
    overridden: false,
    decision: provisional,
    reasons,
    override: null,
  };
}
