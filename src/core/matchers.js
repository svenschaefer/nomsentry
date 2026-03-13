function tokenize(v) {
  if (!v) return [];
  return v.split(/[\s-]+/).filter(Boolean);
}

function projection(normalized, field) {
  return normalized[field] || "";
}

export function matchRules({ normalized, kind, rules }) {
  const matches = [];

  for (const rule of rules) {
    if (!(rule.scopes || []).includes(kind)) continue;
    if (rule.enabled === false) continue;

    const field = rule.normalizationField || "separatorFolded";
    const target = projection(normalized, field);
    const term = String(rule.term ?? "").toLowerCase();

    let matched = false;
    let matchType = null;

    if (rule.match === "exact") {
      matched = target === term;
      matchType = matched ? "exact" : null;
    } else if (rule.match === "token") {
      matched = tokenize(target).includes(term);
      matchType = matched ? "token" : null;
    } else if (rule.match === "contains") {
      matched = target.includes(term);
      matchType = matched ? "contains" : null;
    } else if (rule.match === "compact") {
      matched = normalized.compact === term;
      matchType = matched ? "compact" : null;
    }

    if (matched) {
      matches.push({
        rule,
        matchType,
        comparedField: field
      });
    }
  }

  return matches;
}
