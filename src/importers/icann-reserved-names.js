import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";

export const ICANN_RESERVED_NAMES_PAGE_URL =
  "https://www.icann.org/en/registry-agreements/com/com-registry-agreement--schedule-of-reserved-names-1-3-2006-en";

const ADDITIVE_ICANN_RESERVED_TERMS = new Set([
  "example",
  "gtld-servers",
  "iana",
  "iana-servers",
  "nic",
  "rfc-editor",
  "root-servers",
  "whois",
]);

function stripMarkup(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractListItems(sectionHtml) {
  const items = [];
  const itemPattern = /<li>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = itemPattern.exec(sectionHtml)) !== null) {
    const item = stripMarkup(match[1]).toLowerCase();
    if (item) items.push(item);
  }
  return items;
}

export function extractIcannReservedNames(html) {
  const results = new Set();

  const ianaSection = html.match(
    /IANA-related names:\s*<\/p>\s*<ul>([\s\S]*?)<\/ul>/i,
  );
  const operationsSection = html.match(
    /Second-Level Reservations for Registry Operations[\s\S]*?<ul>([\s\S]*?)<\/ul>/i,
  );

  if (!ianaSection && !operationsSection) {
    throw new Error("Could not find ICANN reserved names list markup");
  }

  for (const section of [ianaSection?.[1], operationsSection?.[1]]) {
    if (!section) continue;
    for (const item of extractListItems(section)) {
      const normalized =
        normalizeValue(item).slug || normalizeValue(item).compact;
      if (!normalized) continue;
      if (!ADDITIVE_ICANN_RESERVED_TERMS.has(normalized)) continue;
      results.add(normalized);
    }
  }

  return Array.from(results).sort((left, right) => left.localeCompare(right));
}

export async function fetchIcannReservedNames(fetchImpl = fetch) {
  const response = await fetchImpl(ICANN_RESERVED_NAMES_PAGE_URL);
  if (!response.ok) {
    throw new Error(
      `ICANN reserved names request failed: ${response.status} ${response.statusText}`,
    );
  }

  const terms = extractIcannReservedNames(await response.text());
  if (terms.length === 0) {
    throw new Error("Could not extract any ICANN reserved names");
  }
  return terms;
}

export function buildIcannReservedNamesSource({
  terms,
  scopes = ["username", "tenantSlug"],
  category = "reservedTechnical",
}) {
  const filteredTerms = Array.from(
    new Set(
      terms
        .map(
          (term) => normalizeValue(term).slug || normalizeValue(term).compact,
        )
        .filter(Boolean)
        .filter((term) => ADDITIVE_ICANN_RESERVED_TERMS.has(term)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return validateSource({
    id: "imported-icann-reserved-names",
    description:
      "Conservative technical reserved names extracted from the ICANN .com schedule of reserved names",
    metadata: {
      source: "ICANN",
      sourceUrl: ICANN_RESERVED_NAMES_PAGE_URL,
      notes:
        "Filtered to additive infrastructure-like reserved identifiers from the official ICANN reserved-names schedule. Registry-body and brand-like names are intentionally excluded.",
    },
    ruleDefaults: {
      category,
      scopes,
      match: "token",
      normalizationField: "slug",
      idPrefix: "icann-reserved/",
    },
    rules: filteredTerms.map((term) => [term, term]),
  });
}
