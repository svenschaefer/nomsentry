import fs from "node:fs";
import readline from "node:readline";
import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";

const LEGAL_SUFFIX_TOKENS = new Set([
  "ag",
  "bv",
  "co",
  "company",
  "corp",
  "corporation",
  "gmbh",
  "inc",
  "incorporated",
  "limited",
  "llc",
  "llp",
  "lp",
  "ltd",
  "nv",
  "plc",
  "sa",
  "sarl",
]);

export function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const ch = line[index];

    if (ch === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  cells.push(current);
  return cells;
}

function recordFromHeaders(headers, line) {
  const cells = parseCsvLine(line);
  return headers.reduce((record, header, index) => {
    record[header] = cells[index] ?? "";
    return record;
  }, {});
}

export function parseUsptoCaseFileCsv(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => recordFromHeaders(headers, line));
}

async function* iterateUsptoCaseFileCsv(path) {
  const stream = fs.createReadStream(path, "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let headers = null;

  for await (const line of rl) {
    if (!line) continue;
    if (!headers) {
      headers = parseCsvLine(line).map((header) => header.trim());
      continue;
    }

    yield recordFromHeaders(headers, line);
  }
}

function firstValue(record, keys) {
  for (const key of keys) {
    if (record[key] !== undefined && String(record[key]).trim().length > 0) {
      return String(record[key]).trim();
    }
  }

  return "";
}

function isTruthyFlag(value) {
  return ["y", "yes", "true", "1"].includes(
    String(value ?? "")
      .trim()
      .toLowerCase(),
  );
}

function looksLive(record) {
  const liveDead = firstValue(record, [
    "live_dead_indicator",
    "live_dead_ind",
    "live_dead_cd",
  ]).toUpperCase();

  if (liveDead) {
    return liveDead === "LIVE" || liveDead === "L";
  }

  const status = firstValue(record, [
    "cfh_status_cd",
    "status_category",
    "status_type",
    "status_code",
    "status_desc",
  ]).toLowerCase();

  if (!status) return true;
  if (["700", "701", "702", "703", "704", "705", "800"].includes(status))
    return true;
  if (/^\d+$/.test(status)) return false;
  if (
    status.includes("dead") ||
    status.includes("cancel") ||
    status.includes("abandon")
  )
    return false;
  if (status.includes("live") || status.includes("registered")) return true;

  return false;
}

function isStandardCharacterMark(record) {
  if (
    isTruthyFlag(
      firstValue(record, [
        "std_char_claim_in",
        "standard_character_claim_indicator",
        "standard_character_claim",
        "standard_char_claim_ind",
      ]),
    )
  ) {
    return true;
  }

  const drawingCode = firstValue(record, [
    "mark_draw_cd",
    "mark_drawing_code",
    "drawing_code",
  ]);
  if (
    drawingCode === "1" ||
    drawingCode === "4" ||
    drawingCode === "1000" ||
    drawingCode === "4000"
  ) {
    return true;
  }

  const drawingDescription = firstValue(record, [
    "mark_drawing_code_description",
    "mark_drawing_description",
    "drawing_code_description",
  ]).toLowerCase();

  return drawingDescription.includes("standard character");
}

function extractBrandTerm(record) {
  const rawTerm = firstValue(record, [
    "mark_id_char",
    "mark_identification",
    "literal_element",
    "mark_literal",
    "word_mark",
    "standard_character_text",
  ]);

  if (!rawTerm) return "";
  return normalizeValue(rawTerm).latinFolded;
}

function isTrademarkOrServiceMark(record) {
  return (
    isTruthyFlag(firstValue(record, ["trade_mark_in"])) ||
    isTruthyFlag(firstValue(record, ["serv_mark_in"]))
  );
}

function createUsptoRule(record, id) {
  if (!looksLive(record)) return null;
  if (!isStandardCharacterMark(record)) return null;
  if (!isTrademarkOrServiceMark(record)) return null;

  const term = extractBrandTerm(record);
  if (!term || term.length < 2) return null;

  const normalized = normalizeValue(term);
  if (normalized.compact.length < 2) return null;

  const serialNumber = firstValue(record, [
    "serial_number",
    "serial_num",
    "serial_no",
  ]);
  const registrationNumber = firstValue(record, [
    "registration_number",
    "registration_num",
    "registration_no",
  ]);

  return {
    dedupeKey: normalized.latinFolded,
    rule: {
      id: `${id}/${registrationNumber || serialNumber || normalized.slug || normalized.compact}`,
      term: normalized.latinFolded,
      category: "protectedBrand",
      scopes: ["username", "tenantSlug", "tenantName"],
      match: "token",
      normalizationField: "confusableSkeleton",
      metadata: {
        source: "USPTO",
        language: "en",
        severity: "medium",
        tags: ["external-import", "brand", "trademark", "official"],
        sourceUrl:
          "https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data",
        notes: registrationNumber
          ? `registration:${registrationNumber}`
          : `serial:${serialNumber}`,
      },
    },
  };
}

export function buildUsptoTrademarkSource(
  records,
  {
    id = "imported-uspto-trademarks",
    scopes = ["username", "tenantSlug", "tenantName"],
  } = {},
) {
  const rules = [];
  const seen = new Set();

  for (const record of records) {
    const created = createUsptoRule(record, id);
    if (!created) continue;
    if (seen.has(created.dedupeKey)) continue;
    seen.add(created.dedupeKey);
    created.rule.scopes = scopes;
    rules.push(created.rule);
  }

  return validateSource({
    id,
    description:
      "Imported USPTO live standard-character trademarks and service marks",
    metadata: {
      source: "USPTO",
      language: "en",
      severity: "medium",
      tags: ["external-import", "brand", "trademark", "official"],
      sourceUrl:
        "https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data",
    },
    rules,
  });
}

export async function buildUsptoTrademarkSourceFromCsvFile(
  path,
  {
    id = "imported-uspto-trademarks",
    scopes = ["username", "tenantSlug", "tenantName"],
  } = {},
) {
  const rules = [];
  const seen = new Set();

  for await (const record of iterateUsptoCaseFileCsv(path)) {
    const created = createUsptoRule(record, id);
    if (!created) continue;
    if (seen.has(created.dedupeKey)) continue;
    seen.add(created.dedupeKey);
    created.rule.scopes = scopes;
    rules.push(created.rule);
  }

  return validateSource({
    id,
    description:
      "Imported USPTO live standard-character trademarks and service marks",
    metadata: {
      source: "USPTO",
      language: "en",
      severity: "medium",
      tags: ["external-import", "brand", "trademark", "official"],
      sourceUrl:
        "https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data",
    },
    rules,
  });
}

export function loadUsptoCaseFileCsv(path) {
  return parseUsptoCaseFileCsv(fs.readFileSync(path, "utf8"));
}

export function splitUsptoTrademarkSource(source, { chunkSize = 5000 } = {}) {
  const rules = Array.isArray(source?.rules) ? source.rules : [];
  if (rules.length === 0) return [];

  const chunks = [];
  for (let index = 0; index < rules.length; index += chunkSize) {
    const chunkNumber = String(Math.floor(index / chunkSize) + 1).padStart(
      3,
      "0",
    );
    chunks.push(
      validateSource({
        ...source,
        id: `${source.id}-${chunkNumber}`,
        description: `${source.description} (chunk ${chunkNumber})`,
        rules: rules.slice(index, index + chunkSize),
      }),
    );
  }

  return chunks;
}

export function deriveUsptoBrandRiskSource(
  source,
  {
    id = "derived-uspto-brand-risk",
    singleWordMinLength = 11,
    multiWordMinTokenLength = 6,
    maxWords = 2,
    allowDigits = false,
  } = {},
) {
  const rules = Array.isArray(source?.rules) ? source.rules : [];
  const seenTerms = new Set();

  const filteredRules = rules
    .filter((rule) => {
      const term = deriveUsptoFilterTerm(rule.term);
      if (!term) return false;
      if (!allowDigits && /\d/.test(term)) return false;

      const tokens = term.split(/\s+/).filter(Boolean);
      if (tokens.length === 0 || tokens.length > maxWords) return false;

      if (tokens.length === 1) {
        return tokens[0].length >= singleWordMinLength;
      }

      return tokens.every((token) => token.length >= multiWordMinTokenLength);
    })
    .map((rule) => {
      const term = deriveUsptoFilterTerm(rule.term);
      return {
        id: `${id}/${rule.id.split("/").pop()}`,
        term,
        category: rule.category,
        scopes: rule.scopes,
        match: rule.match,
        normalizationField: rule.normalizationField,
      };
    })
    .filter((rule) => {
      if (seenTerms.has(rule.term)) return false;
      seenTerms.add(rule.term);
      return true;
    });

  return validateSource({
    id,
    description:
      "Derived USPTO protected-brand risk subset for review-level identifier screening",
    metadata: {
      source: "USPTO",
      language: "en",
      sourceUrl:
        "https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data",
      notes:
        "Derived structural review subset from imported USPTO standard-character trademarks and service marks. Trailing legal-entity suffixes are stripped to the filter-facing brand term before structural thresholding. The maintained default keeps one-word marks with at least 11 characters, keeps at most two-word marks with at least 6 characters per token, and drops digit-bearing terms.",
    },
    rules: filteredRules,
  });
}

export function deriveUsptoFilterTerm(rawTerm) {
  const normalized = normalizeValue(rawTerm).latinFolded;
  const tokens = String(normalized ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length <= 1) return tokens.join(" ");

  const stripped = [...tokens];
  while (
    stripped.length > 1 &&
    LEGAL_SUFFIX_TOKENS.has(stripped[stripped.length - 1])
  ) {
    stripped.pop();
  }

  return stripped.join(" ");
}
