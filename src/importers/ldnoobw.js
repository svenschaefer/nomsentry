import { validateSource } from "../schema/validate-source.js";

function normalizeLine(line) {
  return String(line ?? "")
    .trim()
    .toLowerCase();
}

export function parseLdnoobwWordList(text) {
  return Array.from(
    new Set(
      String(text ?? "")
        .split(/\r?\n/)
        .map(normalizeLine)
        .filter((line) => line.length > 0 && !line.startsWith("#")),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function buildLdnoobwSource({
  id,
  language,
  terms,
  scopes = ["username", "tenantSlug", "tenantName"],
  category = "profanity",
  sourceUrl,
}) {
  return validateSource({
    id,
    description: `Imported LDNOOBW snapshot (${language})`,
    metadata: {
      source: "LDNOOBW",
      language,
      severity: "mixed",
      tags: ["external-import", "profanity"],
      sourceUrl,
    },
    rules: terms.map((term) => ({
      id: `${id}/${term}`,
      term,
      category,
      scopes,
      match: "token",
      normalizationField: "confusableSkeleton",
      metadata: {
        source: "LDNOOBW",
        language,
        severity: "mixed",
        tags: ["external-import", "profanity"],
        sourceUrl,
      },
    })),
  });
}
