import { profaneWords } from "@2toad/profanity";
import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";

export function get2ToadLanguages() {
  return Array.from(profaneWords.keys()).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function build2ToadSource({
  language,
  scopes = ["username", "tenantSlug", "tenantName"],
  category = "profanity",
}) {
  const terms = Array.from(
    new Set(
      (profaneWords.get(language) || [])
        .map((term) => normalizeValue(term))
        .filter((normalized) => normalized.compact.length >= 3)
        .map((normalized) => normalized.compact)
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return validateSource({
    id: `imported-2toad-profanity-${language}`,
    description: `Imported @2toad/profanity snapshot (${language})`,
    metadata: {
      source: "@2toad/profanity",
      language,
      severity: "mixed",
      tags: ["external-import", "profanity", "library"],
      license: "MIT",
    },
    rules: terms.map((term) => ({
      id: `imported-2toad-profanity-${language}/${term}`,
      term,
      category,
      scopes,
      match: "token",
      normalizationField: "confusableSkeleton",
      metadata: {
        source: "@2toad/profanity",
        language,
        severity: "mixed",
        tags: ["external-import", "profanity", "library"],
        license: "MIT",
      },
    })),
  });
}
