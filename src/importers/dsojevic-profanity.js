import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";

function severityToLabel(value) {
  const severity = Number(value);
  if (severity >= 4) return "high";
  if (severity >= 2) return "medium";
  return "low";
}

function extractLiteralMatches(entry) {
  return String(entry.match || "")
    .split("|")
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .filter((candidate) => !candidate.includes("*"));
}

export function buildDsojevicSource({
  language,
  entries,
  scopes = ["username", "tenantSlug", "tenantName"],
  category = "profanity",
}) {
  const seen = new Set();
  const rules = [];

  for (const entry of entries) {
    for (const candidate of extractLiteralMatches(entry)) {
      const normalized = normalizeValue(candidate);
      if (!normalized.latinFolded || normalized.compact.length < 2) continue;
      if (seen.has(normalized.latinFolded)) continue;
      seen.add(normalized.latinFolded);

      rules.push({
        id: `imported-dsojevic-${language}/${entry.id}/${normalized.slug || normalized.compact}`,
        term: normalized.latinFolded,
        category,
        scopes,
        match: "token",
        severity: severityToLabel(entry.severity),
        normalizationField: "confusableSkeleton",
        metadata: {
          source: "dsojevic/profanity-list",
          language,
          tags: ["external-import", "profanity", "repo", ...(entry.tags || [])],
          license: "MIT",
          notes: entry.exceptions?.length
            ? "exceptions omitted during import"
            : undefined,
        },
      });
    }
  }

  return validateSource({
    id: `imported-dsojevic-${language}`,
    description: `Imported dsojevic/profanity-list snapshot (${language})`,
    metadata: {
      source: "dsojevic/profanity-list",
      language,
      severity: "mixed",
      tags: ["external-import", "profanity", "repo"],
      license: "MIT",
    },
    rules: rules.sort((left, right) => left.term.localeCompare(right.term)),
  });
}
