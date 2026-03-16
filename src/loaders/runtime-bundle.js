// @ts-check

/** @typedef {import("../types.js").RuntimeBundle} RuntimeBundle */

import fs from "node:fs";

const SUPPORTED_RUNTIME_BUNDLE_VERSION = 1;

/** @param {string | URL} path */
function readJson(path) {
  return /** @type {RuntimeBundle} */ (
    JSON.parse(fs.readFileSync(path, "utf8"))
  );
}

/** @param {RuntimeBundle} bundle */
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
  const defaultProfileIndex = Number.isInteger(bundle.defaultProfileIndex)
    ? bundle.defaultProfileIndex
    : 0;

  const rules = (bundle.rules ?? []).map((entry, index) => {
    /** @type {string} */
    let term;
    /** @type {number} */
    let profileIndex;

    if (typeof entry === "string") {
      term = entry;
      profileIndex = defaultProfileIndex;
    } else if (Array.isArray(entry) && entry.length === 1) {
      [term] = entry;
      profileIndex = defaultProfileIndex;
    } else if (Array.isArray(entry) && entry.length === 2) {
      [term, profileIndex] = entry;
    } else if (Array.isArray(entry) && entry.length === 3) {
      const [legacySuffix, legacyProfileIndex, explicitTerm] = entry;
      term = explicitTerm ?? legacySuffix;
      profileIndex = legacyProfileIndex;
    } else {
      throw new Error(
        `runtime bundle rule[${index}] must be a string or tuple of length 1, 2, or 3`,
      );
    }

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
      rid: index,
      idPrefix: "r",
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

    const [term, rawCategory, scopeIndex, allOf] = entry;
    const category =
      typeof rawCategory === "number"
        ? categoryTable[rawCategory]
        : rawCategory;
    if (category === undefined) {
      throw new Error(
        `runtime bundle compositeRules[${index}] references missing category`,
      );
    }
    return {
      rid: index,
      idPrefix: "c",
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

/** @param {string | URL} path */
export function loadRuntimeBundleFromFile(path) {
  return expandRuntimeBundle(readJson(path));
}
