export function decide({ matches, policy }) {
  let outcome = "allow";
  const reasons = [];

  for (const match of matches) {
    const rule = match.rule;
    const action = policy.decisionMatrix?.[rule.category] || "review";

    reasons.push({
      ruleId: rule.id,
      category: rule.category,
      term: rule.term,
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
