function tokenize(v) {
  if (!v) return [];
  return v.split(/[\s-]+/).filter(Boolean);
}

function projection(normalized, field) {
  return normalized[field] || "";
}

function pushIndexedRule(map, key, rule) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(rule);
}

function tokenIndexKeys(term) {
  const tokens = tokenize(term);
  if (tokens.length <= 1) return [term];
  return Array.from(new Set([term, tokens.join(" ")]));
}

function getKindEntry(index, kind) {
  if (!index.byKind.has(kind)) {
    index.byKind.set(kind, {
      fields: new Map(),
      compact: new Map()
    });
  }
  return index.byKind.get(kind);
}

function getFieldEntry(kindEntry, field) {
  if (!kindEntry.fields.has(field)) {
    kindEntry.fields.set(field, {
      exact: new Map(),
      token: new Map(),
      contains: []
    });
  }
  return kindEntry.fields.get(field);
}

function collectTokenCandidates(value) {
  const tokens = tokenize(value);
  const candidates = new Set();

  for (let start = 0; start < tokens.length; start += 1) {
    let combined = "";
    const phraseTokens = [];

    for (let end = start; end < tokens.length; end += 1) {
      const token = tokens[end];
      phraseTokens.push(token);
      combined += token;
      candidates.add(combined);
      if (phraseTokens.length > 1) {
        candidates.add(phraseTokens.join(" "));
      }
    }
  }

  return candidates;
}

export function buildRuleIndex(rules) {
  const index = {
    byKind: new Map()
  };

  for (const rule of rules) {
    if (rule.enabled === false) continue;

    const term = String(rule.normalizedTerm ?? rule.term ?? "").toLowerCase();
    const field = rule.normalizationField || "separatorFolded";

    for (const kind of rule.scopes || []) {
      const kindEntry = getKindEntry(index, kind);

      if (rule.match === "compact") {
        pushIndexedRule(kindEntry.compact, term, rule);
        continue;
      }

      const fieldEntry = getFieldEntry(kindEntry, field);
      if (rule.match === "exact") pushIndexedRule(fieldEntry.exact, term, rule);
      else if (rule.match === "token") {
        for (const key of tokenIndexKeys(term)) {
          pushIndexedRule(fieldEntry.token, key, rule);
        }
      }
      else if (rule.match === "contains") fieldEntry.contains.push(rule);
    }
  }

  return index;
}

function matchIndexedRules({ normalized, kind, ruleIndex }) {
  const kindEntry = ruleIndex.byKind.get(kind);
  if (!kindEntry) return [];

  const matches = [];

  for (const [field, fieldEntry] of kindEntry.fields.entries()) {
    const target = projection(normalized, field);

    for (const rule of fieldEntry.exact.get(target) ?? []) {
      matches.push({
        rule,
        matchType: "exact",
        comparedField: field
      });
    }

    for (const candidate of collectTokenCandidates(target)) {
      for (const rule of fieldEntry.token.get(candidate) ?? []) {
        matches.push({
          rule,
          matchType: "token",
          comparedField: field
        });
      }
    }

    for (const rule of fieldEntry.contains) {
      const term = String(rule.normalizedTerm ?? rule.term ?? "").toLowerCase();
      if (!target.includes(term)) continue;
      matches.push({
        rule,
        matchType: "contains",
        comparedField: field
      });
    }
  }

  for (const rule of kindEntry.compact.get(normalized.compact) ?? []) {
    matches.push({
      rule,
      matchType: "compact",
      comparedField: "compact"
    });
  }

  matches.sort((left, right) => (left.rule._order ?? 0) - (right.rule._order ?? 0));
  return matches;
}

export function matchRules({ normalized, kind, rules, ruleIndex }) {
  if (ruleIndex) {
    return matchIndexedRules({ normalized, kind, ruleIndex });
  }

  const matches = [];

  for (const rule of rules) {
    if (!(rule.scopes || []).includes(kind)) continue;
    if (rule.enabled === false) continue;

    const field = rule.normalizationField || "separatorFolded";
    const target = projection(normalized, field);
    const term = String(rule.normalizedTerm ?? rule.term ?? "").toLowerCase();

    let matched = false;
    let matchType = null;

    if (rule.match === "exact") {
      matched = target === term;
      matchType = matched ? "exact" : null;
    } else if (rule.match === "token") {
      matched = collectTokenCandidates(target).has(term);
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
