import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";
import { cuss as cussEn } from "cuss";
import { cuss as cussArLatn } from "cuss/ar-latn";
import { cuss as cussEs } from "cuss/es";
import { cuss as cussFr } from "cuss/fr";
import { cuss as cussIt } from "cuss/it";
import { cuss as cussPt } from "cuss/pt";
import { cuss as cussPtPt } from "cuss/pt-pt";

const CUSS_DATASETS = {
  en: cussEn,
  "ar-latn": cussArLatn,
  es: cussEs,
  fr: cussFr,
  it: cussIt,
  pt: cussPt,
  "pt-pt": cussPtPt
};

function ratingToSeverity(rating) {
  if (rating >= 2) return "high";
  if (rating >= 1) return "medium";
  return "low";
}

export function getCussLanguages() {
  return Object.keys(CUSS_DATASETS).sort((left, right) => left.localeCompare(right));
}

export function buildCussSource({
  language,
  scopes = ["username", "tenantSlug", "tenantName"],
  minRating = 1,
  category = "profanity"
}) {
  const dataset = CUSS_DATASETS[language];
  if (!dataset) throw new Error(`Unsupported cuss language: ${language}`);

  const seen = new Set();
  const rules = [];

  for (const [rawTerm, rating] of Object.entries(dataset)) {
    if (rating < minRating) continue;
    const normalized = normalizeValue(rawTerm);
    if (!normalized.latinFolded || normalized.compact.length < 2) continue;
    if (seen.has(normalized.latinFolded)) continue;
    seen.add(normalized.latinFolded);

    rules.push({
      id: `imported-cuss-${language}/${normalized.slug || normalized.compact}`,
      term: normalized.latinFolded,
      category,
      scopes,
      match: "token",
      normalizationField: "confusableSkeleton",
      metadata: {
        source: "cuss",
        language,
        severity: ratingToSeverity(rating),
        tags: ["external-import", "profanity", "library", "rating-based"],
        license: "MIT",
        notes: `rating:${rating}`
      }
    });
  }

  return validateSource({
    id: `imported-cuss-${language}`,
    description: `Imported cuss profanity snapshot (${language})`,
    metadata: {
      source: "cuss",
      language,
      severity: "mixed",
      tags: ["external-import", "profanity", "library", "rating-based"],
      license: "MIT"
    },
    rules: rules.sort((left, right) => left.term.localeCompare(right.term))
  });
}
