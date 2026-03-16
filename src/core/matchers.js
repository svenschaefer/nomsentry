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

function asIndexedRuleRef(rule) {
  if (Number.isInteger(rule?.rid)) return rule.rid;
  return rule;
}

function tokenIndexKeys(term) {
  const tokens = tokenize(term);
  if (tokens.length <= 1) return [term];
  return Array.from(new Set([term, tokens.join(" ")]));
}

function getFieldEntry(index, field) {
  if (!index.fields.has(field)) {
    index.fields.set(field, {
      exact: new Map(),
      token: new Map(),
      contains: [],
    });
  }
  return index.fields.get(field);
}

function compactPostingList(list) {
  if (list.length === 1 && Number.isInteger(list[0])) return list[0];
  if (list.length < 16) return list;
  for (let index = 0; index < list.length; index += 1) {
    if (!Number.isInteger(list[index])) return list;
  }
  return Uint32Array.from(list);
}

function compactPostingMap(map) {
  for (const [key, list] of map.entries()) {
    map.set(key, compactPostingList(list));
  }
}

function finalizeLookupMap(map) {
  const entries = Array.from(map.entries());
  entries.sort((left, right) => left[0].localeCompare(right[0]));
  return {
    keys: entries.map((entry) => entry[0]),
    postings: entries.map((entry) => entry[1]),
  };
}

function lookupPosting(table, key) {
  if (!table || !table.keys || table.keys.length === 0) return undefined;
  let low = 0;
  let high = table.keys.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const value = table.keys[mid];
    if (value === key) return table.postings[mid];
    if (value < key) low = mid + 1;
    else high = mid - 1;
  }
  return undefined;
}

function getKindBit(index, kind) {
  if (!index.kindBits.has(kind)) {
    const nextBit = 1 << index.kindBits.size;
    if (nextBit <= 0) {
      throw new Error("Too many distinct kinds for matcher bitmask indexing");
    }
    index.kindBits.set(kind, nextBit);
  }
  return index.kindBits.get(kind);
}

function computeScopeMask(index, scopes) {
  let mask = 0;
  for (const kind of scopes || []) {
    mask |= getKindBit(index, kind);
  }
  return mask;
}

function setRuleScopeMask(index, rid, scopes) {
  const previous = index.ruleScopeMasks[rid] ?? 0;
  index.ruleScopeMasks[rid] = previous | computeScopeMask(index, scopes);
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
    fields: new Map(),
    compact: new Map(),
    kindBits: new Map(),
    ruleScopeMasks: [],
  };
  let maxRid = -1;

  for (const rule of rules) {
    if (rule.enabled === false) continue;

    if (Number.isInteger(rule?.rid)) {
      if (rule.rid > maxRid) maxRid = rule.rid;
      setRuleScopeMask(index, rule.rid, rule.scopes);
    }

    const term = String(rule.normalizedTerm ?? rule.term ?? "").toLowerCase();
    const field = rule.normalizationField || "separatorFolded";
    const ruleRef = asIndexedRuleRef(rule);

    if (rule.match === "compact") {
      pushIndexedRule(index.compact, term, ruleRef);
      continue;
    }

    const fieldEntry = getFieldEntry(index, field);
    if (rule.match === "exact") {
      pushIndexedRule(fieldEntry.exact, term, ruleRef);
    } else if (rule.match === "token") {
      for (const key of tokenIndexKeys(term)) {
        pushIndexedRule(fieldEntry.token, key, ruleRef);
      }
    } else if (rule.match === "contains") {
      if (Number.isInteger(rule?.rid)) {
        fieldEntry.contains.push({ rid: rule.rid, term });
      } else {
        fieldEntry.contains.push(rule);
      }
    }
  }

  for (const [, fieldEntry] of index.fields.entries()) {
    compactPostingMap(fieldEntry.exact);
    compactPostingMap(fieldEntry.token);
    fieldEntry.contains = compactPostingList(fieldEntry.contains);
    fieldEntry.exact = finalizeLookupMap(fieldEntry.exact);
    fieldEntry.token = finalizeLookupMap(fieldEntry.token);
  }
  compactPostingMap(index.compact);
  index.compact = finalizeLookupMap(index.compact);
  if (maxRid >= 0) {
    const masks = new Uint32Array(maxRid + 1);
    for (let rid = 0; rid <= maxRid; rid += 1) {
      masks[rid] = index.ruleScopeMasks[rid] ?? 0;
    }
    index.ruleScopeMasks = masks;
  }

  return index;
}

function matchIndexedRules({ normalized, kind, ruleIndex }) {
  const matches = [];
  const kindBit = ruleIndex.kindBits.get(kind) ?? 0;

  function resolveRule(entry) {
    if (Number.isInteger(entry)) {
      return ruleIndex.ruleCatalog?.[entry] ?? null;
    }
    if (entry && typeof entry === "object" && Number.isInteger(entry.rid)) {
      return ruleIndex.ruleCatalog?.[entry.rid] ?? null;
    }
    return entry;
  }

  function matchesKindScope(entry) {
    if (Number.isInteger(entry)) {
      return (ruleIndex.ruleScopeMasks[entry] & kindBit) !== 0;
    }
    if (entry && typeof entry === "object" && Number.isInteger(entry.rid)) {
      return (ruleIndex.ruleScopeMasks[entry.rid] & kindBit) !== 0;
    }
    return (entry?.scopes || []).includes(kind);
  }

  function pushMatchesFromPosting(posting, comparedField, matchType) {
    if (posting === undefined || posting === null) return;
    if (Number.isInteger(posting)) {
      const entry = posting;
      if (!matchesKindScope(entry)) return;
      const rule = resolveRule(entry);
      if (!rule) return;
      matches.push({
        rule,
        matchType,
        comparedField,
      });
      return;
    }
    if (posting instanceof Uint32Array) {
      for (let idx = 0; idx < posting.length; idx += 1) {
        const entry = posting[idx];
        if (!matchesKindScope(entry)) continue;
        const rule = resolveRule(entry);
        if (!rule) continue;
        matches.push({
          rule,
          matchType,
          comparedField,
        });
      }
      return;
    }

    for (const entry of posting) {
      if (!matchesKindScope(entry)) continue;
      const rule = resolveRule(entry);
      if (!rule) continue;
      matches.push({
        rule,
        matchType,
        comparedField,
      });
    }
  }

  for (const [field, fieldEntry] of ruleIndex.fields.entries()) {
    const target = projection(normalized, field);

    pushMatchesFromPosting(
      lookupPosting(fieldEntry.exact, target),
      field,
      "exact",
    );

    for (const candidate of collectTokenCandidates(target)) {
      pushMatchesFromPosting(
        lookupPosting(fieldEntry.token, candidate),
        field,
        "token",
      );
    }

    for (const entry of fieldEntry.contains) {
      if (!matchesKindScope(entry)) continue;
      const term = Number.isInteger(entry?.rid)
        ? String(entry.term ?? "").toLowerCase()
        : String(entry.normalizedTerm ?? entry.term ?? "").toLowerCase();
      if (!target.includes(term)) continue;
      const rule = resolveRule(entry);
      if (!rule) continue;
      matches.push({
        rule,
        matchType: "contains",
        comparedField: field,
      });
    }
  }

  pushMatchesFromPosting(
    lookupPosting(ruleIndex.compact, normalized.compact),
    "compact",
    "compact",
  );

  matches.sort(
    (left, right) => (left.rule._order ?? 0) - (right.rule._order ?? 0),
  );
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
        comparedField: field,
      });
    }
  }

  return matches;
}
