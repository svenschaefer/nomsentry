import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SEARCH_API_URL =
  "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=10&search=";
const ENTITY_API_URL =
  "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&languages=en&props=labels|descriptions|aliases|claims&ids=";
const USER_AGENT = "nomsentry/0.3.0";
const LEGAL_SUFFIX_PATTERN =
  /\b(inc\.?|corp\.?|corporation|company|co\.?|llc|ltd\.?|limited|plc|ag|gmbh|s\.a\.|sa|n\.v\.|nv)\b/gi;
const POSITIVE_DESCRIPTION_PATTERN =
  /\b(company|corporation|brand|service|software|platform|organization|payments|chatbot|product|technology)\b/i;
const NEGATIVE_DESCRIPTION_PATTERN =
  /\b(given name|family name|fruit|river|song genre|district|city)\b/i;
const BRAND_RELEVANT_P31 = new Set([
  "Q4830453", // business
  "Q6881511", // enterprise
  "Q891723", // public company
  "Q43229", // organization
  "Q35127", // website
  "Q1668024", // service on internet
  "Q3077240", // online service
  "Q7397", // software
  "Q431289", // brand
  "Q2424752", // product
  "Q163740", // non-profit / org style classes can still be brand-facing
  "Q351764", // payment system
  "Q19967801", // media / product family style class often brand-facing
  "Q166142", // fintech/payment-related service classes
]);

function normalizeTerm(value) {
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

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    terms: [],
    fixtureFile: path.resolve(
      process.cwd(),
      "test",
      "fixtures",
      "catalog-documented-current-gaps.json",
    ),
    outputFile: path.resolve(
      process.cwd(),
      "docs",
      "generated",
      "wikidata-brand-gap-report.json",
    ),
  };

  while (args.length > 0) {
    const token = args.shift();
    if (token === "--terms") {
      options.terms = String(args.shift() || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    } else if (token === "--fixture-file") {
      options.fixtureFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else if (token === "--output-file") {
      options.outputFile = path.resolve(
        process.cwd(),
        String(args.shift() || ""),
      );
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

export function loadTermsFromFixture(fixtureFile) {
  const fixture = JSON.parse(fs.readFileSync(fixtureFile, "utf8"));
  const uncoveredBrands =
    fixture.find((group) => group.label.includes("uncovered-brand"))?.values ??
    [];
  return uncoveredBrands.map((value) => String(value).trim().toLowerCase());
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

export function writeReport(outputFile, report) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main(argv) {
  const options = parseArgs(argv);
  const terms =
    options.terms.length > 0
      ? options.terms
      : loadTermsFromFixture(options.fixtureFile);
  const report = await evaluateTerms(terms);
  writeReport(options.outputFile, report);
  console.log(`Wrote ${options.outputFile} (${report.terms.length} terms)`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
