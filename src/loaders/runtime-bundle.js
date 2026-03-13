import fs from "node:fs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function expandRuntimeBundle(bundle) {
  const scopeTable = bundle.scopeTable ?? [];
  const matchTable = bundle.matchTable ?? [];
  const normalizationFieldTable = bundle.normalizationFieldTable ?? [];

  const rules = (bundle.rules ?? []).map((entry, index) => {
    if (!Array.isArray(entry) || entry.length < 6 || entry.length > 7) {
      throw new Error(`runtime bundle rule[${index}] must be a tuple of length 6 or 7`);
    }

    const [id, term, category, matchIndex, scopeIndex, normalizationFieldIndex, severity] = entry;
    return {
      id,
      term,
      category,
      match: matchTable[matchIndex],
      scopes: scopeTable[scopeIndex],
      normalizationField: normalizationFieldTable[normalizationFieldIndex],
      ...(severity ? { severity } : {})
    };
  });

  const compositeRules = (bundle.compositeRules ?? []).map((entry, index) => {
    if (!Array.isArray(entry) || entry.length !== 5) {
      throw new Error(`runtime bundle compositeRules[${index}] must be a tuple of length 5`);
    }

    const [id, term, category, scopeIndex, allOf] = entry;
    return {
      id,
      term,
      category,
      scopes: scopeTable[scopeIndex],
      allOf
    };
  });

  return {
    id: bundle.id ?? "runtime-bundle",
    rules,
    compositeRules
  };
}

export function loadRuntimeBundleFromFile(path) {
  return expandRuntimeBundle(readJson(path));
}
