function resolveAction(rule, policy) {
  const entry = policy.decisionMatrix?.[rule.category];
  if (typeof entry === "string") {
    return entry;
  }

  if (entry && typeof entry === "object") {
    if (rule.severity && typeof entry[rule.severity] === "string") {
      return entry[rule.severity];
    }
    if (typeof entry.default === "string") {
      return entry.default;
    }
  }

  return "review";
}

export function decide({ matches, policy }) {
  let outcome = "allow";
  const reasons = [];

  for (const match of matches) {
    const rule = match.rule;
    const action = resolveAction(rule, policy);

    reasons.push({
      ruleId: rule.id,
      category: rule.category,
      term: rule.term,
      severity: rule.severity,
      matchType: match.matchType,
      comparedField: match.comparedField
    });

    if (action === "reject") outcome = "reject";
    else if (action === "review" && outcome !== "reject") outcome = "review";
  }

  return {
    outcome,
    reasons
  };
}
