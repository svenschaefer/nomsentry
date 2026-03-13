export function detectCompositeRisk({ normalized, kind, compositeRules = [] }) {
  const hits = [];
  const text = normalized.separatorFolded;

  for (const rule of compositeRules) {
    if (!(rule.scopes || []).includes(kind)) continue;
    const allOf = rule.allOf || [];
    if (allOf.length === 0) continue;
    if (allOf.every((term) => text.includes(term))) {
      hits.push(rule);
    }
  }

  return hits;
}
