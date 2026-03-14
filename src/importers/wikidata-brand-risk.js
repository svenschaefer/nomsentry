import { validateSource } from "../schema/validate-source.js";

export const SEARCH_API_URL =
  "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=10&search=";
export const ENTITY_API_URL =
  "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&languages=en&props=labels|descriptions|aliases|claims&ids=";
export const USER_AGENT = "nomsentry/0.3.0";
export const LEGAL_SUFFIX_PATTERN =
  /\b(inc\.?|corp\.?|corporation|company|co\.?|llc|ltd\.?|limited|plc|ag|gmbh|s\.a\.|sa|n\.v\.|nv)\b/gi;
export const DEFAULT_WIKIDATA_BRAND_SCORE_THRESHOLD = 120;
export const DEFAULT_WIKIDATA_AMBIGUOUS_TERMS = new Set([
  "amazon",
  "apple",
  "visa",
]);

const POSITIVE_DESCRIPTION_PATTERN =
  /\b(company|corporation|brand|service|software|platform|organization|payments|chatbot|product|technology)\b/i;
const NEGATIVE_DESCRIPTION_PATTERN =
  /\b(given name|family name|fruit|river|song genre|district|city)\b/i;
const BRAND_RELEVANT_P31 = new Set([
  "Q4830453",
  "Q6881511",
  "Q891723",
  "Q43229",
  "Q35127",
  "Q1668024",
  "Q3077240",
  "Q7397",
  "Q431289",
  "Q2424752",
  "Q163740",
  "Q351764",
  "Q19967801",
  "Q166142",
]);

export function normalizeTerm(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(LEGAL_SUFFIX_PATTERN, "")
    .replace(/[^a-z0-9]+/g, "");
}

function exactMatch(values, term) {
  return values.some((value) => normalizeTerm(value) === term);
}

export function deriveFilterTerm(candidate, preferredTerm = null) {
  const normalizedPreferred =
    preferredTerm === null ? null : normalizeTerm(preferredTerm);
  const normalizedLabel = normalizeTerm(candidate.label);

  if (normalizedPreferred !== null && normalizedLabel === normalizedPreferred) {
    return normalizedPreferred;
  }

  const matchingAlias = candidate.aliases.find(
    (value) => normalizeTerm(value) === normalizedPreferred,
  );
  if (matchingAlias) {
    return normalizedPreferred;
  }

  const normalizedAliases = candidate.aliases
    .map((value) => normalizeTerm(value))
    .filter(Boolean)
    .sort(
      (left, right) => left.length - right.length || left.localeCompare(right),
    );

  return normalizedAliases[0] ?? normalizedLabel;
}

export async function fetchSearchResults(term, fetchImpl = fetch) {
  const response = await fetchImpl(
    `${SEARCH_API_URL}${encodeURIComponent(term)}`,
    {
      headers: { "user-agent": USER_AGENT },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Wikidata search results for ${term}: ${response.status} ${response.statusText}`,
    );
  }
  const data = await response.json();
  return data.search ?? [];
}

export async function fetchEntities(ids, fetchImpl = fetch) {
  if (ids.length === 0) return {};
  const response = await fetchImpl(`${ENTITY_API_URL}${ids.join("|")}`, {
    headers: { "user-agent": USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Wikidata entities: ${response.status} ${response.statusText}`,
    );
  }
  const data = await response.json();
  return data.entities ?? {};
}

export function summarizeEntity(entity, searchHit) {
  const aliases = (entity.aliases?.en ?? []).map((entry) => entry.value);
  const p31 = (entity.claims?.P31 ?? [])
    .map((claim) => claim.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);

  return {
    id: entity.id,
    page: `https://www.wikidata.org/wiki/${entity.id}`,
    label: entity.labels?.en?.value ?? searchHit.label ?? null,
    description:
      entity.descriptions?.en?.value ?? searchHit.description ?? null,
    aliases,
    instanceOf: p31,
  };
}

export function scoreCandidate(term, candidate) {
  const normalizedTerm = normalizeTerm(term);
  const normalizedLabel = normalizeTerm(candidate.label);
  const aliasMatch = exactMatch(candidate.aliases, normalizedTerm);
  const exactLabelMatch = normalizedLabel === normalizedTerm;
  const legalSuffixMatch =
    !exactLabelMatch &&
    normalizeTerm(candidate.label?.replace(LEGAL_SUFFIX_PATTERN, "")) ===
      normalizedTerm;
  const positiveDescription = POSITIVE_DESCRIPTION_PATTERN.test(
    candidate.description ?? "",
  );
  const negativeDescription = NEGATIVE_DESCRIPTION_PATTERN.test(
    candidate.description ?? "",
  );
  const relevantClass = candidate.instanceOf.some((id) =>
    BRAND_RELEVANT_P31.has(id),
  );

  let score = 0;
  if (exactLabelMatch) score += 100;
  if (aliasMatch) score += 80;
  if (legalSuffixMatch) score += 70;
  if (positiveDescription) score += 20;
  if (relevantClass) score += 20;
  if (negativeDescription) score -= 120;

  return {
    ...candidate,
    derivedTerm: deriveFilterTerm(candidate, term),
    exactLabelMatch,
    aliasMatch,
    legalSuffixMatch,
    positiveDescription,
    relevantClass,
    negativeDescription,
    score,
  };
}

export function evaluateSearchResults(term, searchHits, entities) {
  return searchHits
    .map((hit) => entities[hit.id] && summarizeEntity(entities[hit.id], hit))
    .filter(Boolean)
    .map((candidate) => scoreCandidate(term, candidate))
    .sort(
      (left, right) =>
        right.score - left.score ||
        String(left.label).localeCompare(String(right.label)) ||
        left.id.localeCompare(right.id),
    );
}

export async function evaluateTerms(terms, fetchImpl = fetch) {
  const results = [];

  for (const term of terms) {
    const searchHits = await fetchSearchResults(term, fetchImpl);
    const entities = await fetchEntities(
      searchHits.map((entry) => entry.id),
      fetchImpl,
    );
    const candidates = evaluateSearchResults(term, searchHits, entities);
    results.push({
      term,
      candidates,
      recommended:
        candidates[0] === undefined
          ? null
          : {
              ...candidates[0],
              recommendedTerm: candidates[0].derivedTerm,
            },
    });
  }

  return {
    id: "wikidata-brand-gap-evaluation",
    version: 1,
    generatedAt: new Date().toISOString(),
    terms: results,
  };
}

export function isAcceptedWikidataBrandCandidate(
  term,
  candidate,
  {
    minScore = DEFAULT_WIKIDATA_BRAND_SCORE_THRESHOLD,
    excludedTerms = DEFAULT_WIKIDATA_AMBIGUOUS_TERMS,
  } = {},
) {
  const normalizedTerm = normalizeTerm(term);
  if (!candidate) return false;
  if (excludedTerms.has(normalizedTerm)) return false;
  if (candidate.derivedTerm !== normalizedTerm) return false;
  if (candidate.negativeDescription) return false;
  if (!(candidate.positiveDescription || candidate.relevantClass)) return false;
  if (
    !(
      candidate.exactLabelMatch ||
      candidate.aliasMatch ||
      candidate.legalSuffixMatch
    )
  ) {
    return false;
  }
  return candidate.score >= minScore;
}

export function buildWikidataBrandRiskSource(
  report,
  {
    id = "derived-wikidata-brand-risk",
    scopes = ["username", "tenantSlug", "tenantName"],
    minScore = DEFAULT_WIKIDATA_BRAND_SCORE_THRESHOLD,
    excludedTerms = DEFAULT_WIKIDATA_AMBIGUOUS_TERMS,
  } = {},
) {
  const accepted = [];

  for (const entry of report?.terms ?? []) {
    const candidate = entry.recommended;
    if (
      !isAcceptedWikidataBrandCandidate(entry.term, candidate, {
        minScore,
        excludedTerms,
      })
    ) {
      continue;
    }

    accepted.push({
      qid: candidate.id,
      term: candidate.recommendedTerm,
    });
  }

  const deduped = Array.from(
    accepted.reduce((map, entry) => map.set(entry.term, entry), new Map()),
    ([, value]) => value,
  ).sort((left, right) => left.term.localeCompare(right.term));

  return validateSource({
    id,
    description:
      "Derived protected-brand supplement from conservative Wikidata brand evaluation results",
    metadata: {
      source: "Wikidata",
      language: "en",
      license: "CC0-1.0",
      sourceUrl: "https://www.wikidata.org/wiki/Wikidata:Licensing",
      notes:
        "Derived from exact-match Wikidata entity evaluation with explicit ambiguity exclusions for apple, amazon, and visa.",
    },
    ruleDefaults: {
      category: "protectedBrand",
      scopes,
      match: "token",
      normalizationField: "confusableSkeleton",
      idPrefix: `${id}/`,
    },
    rules: deduped.map((entry) => [entry.qid, entry.term]),
  });
}
