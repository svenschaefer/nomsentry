import { englishDataset } from "obscenity";
import { validateSource } from "../schema/validate-source.js";

export function buildObscenityEnglishSource({
  scopes = ["username", "tenantSlug", "tenantName"],
  category = "profanity",
} = {}) {
  const terms = Array.from(
    new Set(
      (englishDataset.containers || [])
        .map((container) => container?.metadata?.originalWord)
        .map((term) =>
          String(term || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return validateSource({
    id: "imported-obscenity-en",
    description: "Imported obscenity English dataset snapshot",
    metadata: {
      source: "obscenity",
      language: "en",
      severity: "mixed",
      tags: ["external-import", "profanity", "library", "pattern-derived"],
      license: "MIT",
      notes: "Derived from obscenity englishDataset originalWord metadata.",
    },
    rules: terms.map((term) => ({
      id: `imported-obscenity-en/${term}`,
      term,
      category,
      scopes,
      match: "token",
      normalizationField: "confusableSkeleton",
      metadata: {
        source: "obscenity",
        language: "en",
        severity: "mixed",
        tags: ["external-import", "profanity", "library", "pattern-derived"],
        license: "MIT",
      },
    })),
  });
}
