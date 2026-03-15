import { normalizeValue } from "./normalize.js";

const DEFAULT_MIN_AFFIX_TERM_LENGTH = 5;
const AFFIX_RISK_CATEGORIES = new Set([
  "profanity",
  "generalProfanity",
  "slur",
  "sexual",
  "shock",
]);

function getKindEntry(index, kind) {
  if (!index.byKind.has(kind)) {
    index.byKind.set(kind, {
      byFirstChar: new Map(),
      byLastChar: new Map(),
    });
  }
  return index.byKind.get(kind);
}

function pushByChar(map, char, entry) {
  if (!map.has(char)) map.set(char, []);
  map.get(char).push(entry);
}

export function buildAffixRiskIndex(
  rules,
  { minTermLength = DEFAULT_MIN_AFFIX_TERM_LENGTH } = {},
) {
  const index = {
    byKind: new Map(),
  };

  for (const rule of rules) {
    if (rule.enabled === false) continue;
    if (!AFFIX_RISK_CATEGORIES.has(rule.category)) continue;
    if (rule.match !== "token") continue;

    const compactTerm = normalizeValue(rule.normalizedTerm ?? rule.term).compact;
    if (!compactTerm || compactTerm.length < minTermLength) continue;

    const firstChar = compactTerm[0];
    const lastChar = compactTerm[compactTerm.length - 1];
    const entry = {
      term: compactTerm,
      category: rule.category,
    };

    for (const kind of rule.scopes || []) {
      const kindEntry = getKindEntry(index, kind);
      pushByChar(kindEntry.byFirstChar, firstChar, entry);
      pushByChar(kindEntry.byLastChar, lastChar, entry);
    }
  }

  return index;
}

export function detectAffixRisk({ normalized, kind, index }) {
  if (!index) return [];
  const compact = String(normalized?.compact ?? "");
  const kindEntry = index.byKind.get(kind);
  if (!kindEntry || compact.length < DEFAULT_MIN_AFFIX_TERM_LENGTH + 1) {
    return [];
  }

  const firstCandidates = kindEntry.byFirstChar.get(compact[0]) ?? [];
  const lastCandidates =
    kindEntry.byLastChar.get(compact[compact.length - 1]) ?? [];

  const matches = [];
  const seen = new Set();

  for (const candidate of firstCandidates) {
    if (compact === candidate.term) continue;
    if (!compact.startsWith(candidate.term)) continue;
    const key = `${candidate.category}|${candidate.term}`;
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push({
      category: candidate.category,
      term: candidate.term,
      position: "prefix",
    });
  }

  for (const candidate of lastCandidates) {
    if (compact === candidate.term) continue;
    if (!compact.endsWith(candidate.term)) continue;
    const key = `${candidate.category}|${candidate.term}`;
    if (seen.has(key)) continue;
    seen.add(key);
    matches.push({
      category: candidate.category,
      term: candidate.term,
      position: "suffix",
    });
  }

  return matches;
}
