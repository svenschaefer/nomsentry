import { normalizeValue } from "./normalize.js";

export function detectCompositeRisk({ normalized, kind, compositeRules = [] }) {
  const hits = [];
  const tokens = new Set(
    String(normalized.latinFolded || "")
      .split(/[\s-]+/)
      .filter(Boolean)
  );

  for (const rule of compositeRules) {
    if (!(rule.scopes || []).includes(kind)) continue;
    const allOf = (rule.normalizedAllOf || (rule.allOf || []).map((term) => normalizeValue(term).latinFolded))
      .map((term) => String(term).toLowerCase());
    if (allOf.length === 0) continue;
    if (allOf.every((term) => tokens.has(term))) {
      hits.push(rule);
    }
  }

  return hits;
}
