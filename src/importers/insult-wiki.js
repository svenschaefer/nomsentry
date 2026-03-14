import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";

const INSULT_WIKI_PAGES = {
  en: "https://www.insult.wiki/list-of-insults",
  de: "https://www.insult.wiki/schimpfwort-liste",
};

const HTML_ENTITY_MAP = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  szlig: "ß",
};

function decodeHtmlEntities(value) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const numeric = Number.parseInt(
        entity.slice(isHex ? 2 : 1),
        isHex ? 16 : 10,
      );
      return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : match;
    }

    return HTML_ENTITY_MAP[entity] ?? match;
  });
}

function stripMarkup(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function getInsultWikiLanguages() {
  return Object.keys(INSULT_WIKI_PAGES).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function getInsultWikiUrl(language) {
  const url = INSULT_WIKI_PAGES[language];
  if (!url) throw new Error(`Unsupported insult.wiki language: ${language}`);
  return url;
}

export function extractInsultWikiTerms(html) {
  const listMatch = html.match(/<ol>([\s\S]*?)<\/ol>/i);
  if (!listMatch) {
    throw new Error("Could not find insult.wiki list markup");
  }

  const terms = [];
  const itemPattern = /<li>\s*<a\b[^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi;
  let match;

  while ((match = itemPattern.exec(listMatch[1])) !== null) {
    const term = stripMarkup(match[1]);
    if (term) terms.push(term);
  }

  return terms;
}

export async function fetchInsultWikiTerms(language, fetchImpl = fetch) {
  const response = await fetchImpl(getInsultWikiUrl(language));
  if (!response.ok) {
    throw new Error(
      `insult.wiki request failed for ${language}: ${response.status}`,
    );
  }

  return extractInsultWikiTerms(await response.text());
}

export function buildInsultWikiSource({
  language,
  terms,
  scopes = ["username", "tenantSlug", "tenantName"],
  category = "insult",
}) {
  if (!INSULT_WIKI_PAGES[language]) {
    throw new Error(`Unsupported insult.wiki language: ${language}`);
  }

  const seen = new Set();
  const rules = [];

  for (const rawTerm of terms) {
    const normalized = normalizeValue(rawTerm);
    if (!normalized.latinFolded || normalized.compact.length < 2) continue;
    if (seen.has(normalized.latinFolded)) continue;
    seen.add(normalized.latinFolded);

    rules.push({
      id: `imported-insult-wiki-${language}/${normalized.slug || normalized.compact}`,
      term: normalized.latinFolded,
      category,
      scopes,
      match: "token",
      normalizationField: "confusableSkeleton",
      metadata: {
        source: "insult.wiki",
        language,
        license: "CC0-1.0",
        sourceUrl: INSULT_WIKI_PAGES[language],
      },
    });
  }

  return validateSource({
    id: `imported-insult-wiki-${language}`,
    description: `Imported insult.wiki snapshot (${language})`,
    metadata: {
      source: "insult.wiki",
      language,
      license: "CC0-1.0",
      sourceUrl: INSULT_WIKI_PAGES[language],
    },
    rules: rules.sort((left, right) => left.term.localeCompare(right.term)),
  });
}
