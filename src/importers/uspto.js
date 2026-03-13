import fs from "node:fs";
import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";

function parseCsvLine(line) {
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

function parseCsv(text) {
  const lines = String(text ?? "").split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = cells[index] ?? "";
      return record;
    }, {});
  });
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
    "live_dead_ind"
  ]).toUpperCase();
  if (liveDead) return liveDead === "LIVE";

  const status = firstValue(record, [
    "status_category",
    "status_type",
    "status_code"
  ]).toLowerCase();

  if (!status) return true;
  if (status.includes("dead") || status.includes("cancel") || status.includes("abandon")) return false;
  if (status.includes("live") || status.includes("registered")) return true;

  return true;
}

function isStandardCharacterMark(record) {
  if (isTruthyFlag(firstValue(record, ["standard_character_claim_indicator", "standard_character_claim"]))) {
    return true;
  }

  const drawingDescription = firstValue(record, [
    "mark_drawing_code_description",
    "mark_drawing_description"
  ]).toLowerCase();

  return drawingDescription.includes("standard character");
}

function extractBrandTerm(record) {
  const rawTerm = firstValue(record, [
    "mark_identification",
    "literal_element",
    "mark_literal",
    "word_mark"
  ]);

  if (!rawTerm) return "";

  return normalizeValue(rawTerm).latinFolded;
}

export function parseUsptoCaseFileCsv(text) {
  return parseCsv(text);
}

export function buildUsptoTrademarkSource(records, {
  id = "imported-uspto-trademarks",
  scopes = ["username", "tenantSlug", "tenantName"]
} = {}) {
  const rules = [];
  const seen = new Set();

  for (const record of records) {
    if (!looksLive(record)) continue;
    if (!isStandardCharacterMark(record)) continue;

    const term = extractBrandTerm(record);
    if (!term || term.length < 2) continue;

    const normalized = normalizeValue(term);
    if (normalized.compact.length < 2) continue;

    const serialNumber = firstValue(record, ["serial_number", "serial_num"]);
    const registrationNumber = firstValue(record, ["registration_number", "registration_num"]);
    const key = normalized.latinFolded;
    if (seen.has(key)) continue;
    seen.add(key);

    rules.push({
      id: `${id}/${registrationNumber || serialNumber || normalized.slug || normalized.compact}`,
      term: normalized.latinFolded,
      category: "protectedBrand",
      scopes,
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
    });
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
