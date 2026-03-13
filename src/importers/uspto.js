import fs from "node:fs";
import readline from "node:readline";
import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";

export function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const ch = line[index];

    if (ch === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
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
  const lines = String(text ?? "").split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => recordFromHeaders(headers, line));
}

async function *iterateUsptoCaseFileCsv(path) {
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
  return ["y", "yes", "true", "1"].includes(String(value ?? "").trim().toLowerCase());
}

function looksLive(record) {
  const liveDead = firstValue(record, [
    "live_dead_indicator",
    "live_dead_ind",
    "live_dead_cd"
  ]).toUpperCase();

  if (liveDead) {
    return liveDead === "LIVE" || liveDead === "L";
  }

  const status = firstValue(record, [
    "status_category",
    "status_type",
    "status_code",
    "status_desc"
  ]).toLowerCase();

  if (!status) return true;
  if (status.includes("dead") || status.includes("cancel") || status.includes("abandon")) return false;
  if (status.includes("live") || status.includes("registered")) return true;

  return true;
}

function isStandardCharacterMark(record) {
  if (isTruthyFlag(firstValue(record, [
    "standard_character_claim_indicator",
    "standard_character_claim",
    "standard_char_claim_ind"
  ]))) {
    return true;
  }

  const drawingCode = firstValue(record, [
    "mark_drawing_code",
    "drawing_code"
  ]);
  if (drawingCode === "4") return true;

  const drawingDescription = firstValue(record, [
    "mark_drawing_code_description",
    "mark_drawing_description",
    "drawing_code_description"
  ]).toLowerCase();

  return drawingDescription.includes("standard character");
}

function extractBrandTerm(record) {
  const rawTerm = firstValue(record, [
    "mark_identification",
    "literal_element",
    "mark_literal",
    "word_mark",
    "standard_character_text"
  ]);

  if (!rawTerm) return "";
  return normalizeValue(rawTerm).latinFolded;
}

function createUsptoRule(record, id) {
  if (!looksLive(record)) return null;
  if (!isStandardCharacterMark(record)) return null;

  const term = extractBrandTerm(record);
  if (!term || term.length < 2) return null;

  const normalized = normalizeValue(term);
  if (normalized.compact.length < 2) return null;

  const serialNumber = firstValue(record, ["serial_number", "serial_num", "serial_no"]);
  const registrationNumber = firstValue(record, [
    "registration_number",
    "registration_num",
    "registration_no"
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
        sourceUrl: "https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data",
        notes: registrationNumber
          ? `registration:${registrationNumber}`
          : `serial:${serialNumber}`
      }
    }
  };
}

export function buildUsptoTrademarkSource(records, {
  id = "imported-uspto-trademarks",
  scopes = ["username", "tenantSlug", "tenantName"]
} = {}) {
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
    description: "Imported USPTO live standard-character trademarks",
    metadata: {
      source: "USPTO",
      language: "en",
      severity: "medium",
      tags: ["external-import", "brand", "trademark", "official"],
      sourceUrl: "https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data"
    },
    rules
  });
}

export async function buildUsptoTrademarkSourceFromCsvFile(path, {
  id = "imported-uspto-trademarks",
  scopes = ["username", "tenantSlug", "tenantName"]
} = {}) {
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
    description: "Imported USPTO live standard-character trademarks",
    metadata: {
      source: "USPTO",
      language: "en",
      severity: "medium",
      tags: ["external-import", "brand", "trademark", "official"],
      sourceUrl: "https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data"
    },
    rules
  });
}

export function loadUsptoCaseFileCsv(path) {
  return parseUsptoCaseFileCsv(fs.readFileSync(path, "utf8"));
}
