import fs from "node:fs";

const SUPPORTED_RUNTIME_BUNDLE_VERSION = 1;

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function expandRuntimeBundle(bundle) {
  if (bundle?.version !== SUPPORTED_RUNTIME_BUNDLE_VERSION) {
    throw new Error(
      `Unsupported runtime bundle version: ${bundle?.version}; expected ${SUPPORTED_RUNTIME_BUNDLE_VERSION}`,
    );
  }

  const scopeTable = bundle.scopeTable ?? [];
  const matchTable = bundle.matchTable ?? [];
  const categoryTable = bundle.categoryTable ?? [];
  const severityTable = bundle.severityTable ?? [];
  const normalizationFieldTable = bundle.normalizationFieldTable ?? [];
  const profileTable = bundle.profileTable ?? [];

  const rules = (bundle.rules ?? []).map((entry, index) => {
    if (!Array.isArray(entry) || entry.length < 2 || entry.length > 3) {
      throw new Error(
        `runtime bundle rule[${index}] must be a tuple of length 2 or 3`,
      );
    }

    const [suffix, profileIndex, explicitTerm] = entry;
    const profile = profileTable[profileIndex];
    if (!Array.isArray(profile) || profile.length < 4 || profile.length > 5) {
      throw new Error(
        `runtime bundle profile[${profileIndex}] must be a tuple of length 4 or 5`,
      );
    }

    const [
      categoryIndex,
      matchIndex,
      scopeIndex,
      normalizationFieldIndex,
      severityIndex,
    ] = profile;
    const term = explicitTerm ?? suffix;
    if (categoryTable[categoryIndex] === undefined) {
      throw new Error(
        `runtime bundle profile[${profileIndex}] references missing categoryTable[${categoryIndex}]`,
      );
    }
    if (matchTable[matchIndex] === undefined) {
      throw new Error(
        `runtime bundle profile[${profileIndex}] references missing matchTable[${matchIndex}]`,
      );
    }
    if (scopeTable[scopeIndex] === undefined) {
      throw new Error(
        `runtime bundle profile[${profileIndex}] references missing scopeTable[${scopeIndex}]`,
      );
    }
    if (normalizationFieldTable[normalizationFieldIndex] === undefined) {
      throw new Error(
        `runtime bundle profile[${profileIndex}] references missing normalizationFieldTable[${normalizationFieldIndex}]`,
      );
    }
    if (
      severityIndex !== undefined &&
      severityTable[severityIndex] === undefined
    ) {
      throw new Error(
        `runtime bundle profile[${profileIndex}] references missing severityTable[${severityIndex}]`,
      );
    }

    return {
      id: `r${index.toString(36)}`,
      term,
      category: categoryTable[categoryIndex],
      match: matchTable[matchIndex],
      scopes: scopeTable[scopeIndex],
      normalizationField: normalizationFieldTable[normalizationFieldIndex],
      ...(severityIndex !== undefined
        ? { severity: severityTable[severityIndex] }
        : {}),
    };
  });

  const compositeRules = (bundle.compositeRules ?? []).map((entry, index) => {
    if (!Array.isArray(entry) || entry.length !== 4) {
      throw new Error(
        `runtime bundle compositeRules[${index}] must be a tuple of length 4`,
      );
    }

    const [term, category, scopeIndex, allOf] = entry;
    return {
      id: `c${index.toString(36)}`,
      term,
      category,
      scopes: scopeTable[scopeIndex],
      allOf,
    };
  });

  return {
    id: bundle.id ?? "runtime-bundle",
    rules,
    compositeRules,
  };
}

export function loadRuntimeBundleFromFile(path) {
  return expandRuntimeBundle(readJson(path));
}
