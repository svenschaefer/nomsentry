import { normalizeValue } from "../core/normalize.js";
import { validateSource } from "../schema/validate-source.js";

export const WINDOWS_RESERVED_URI_SCHEMES_PAGE_URL =
  "https://learn.microsoft.com/en-us/windows/apps/develop/launch/reserved-uri-scheme-names";

const EXPLICITLY_ALLOWED_SCHEMES = new Set([
  "callto",
  "dtmf",
  "http",
  "https",
  "iehistory",
  "ierss",
  "internetshortcut",
  "javascript",
  "jscript",
  "ldap",
  "mailto",
  "rlogin",
  "smb",
  "tel",
  "telnet",
  "tn3270",
  "ms-accountpictureprovider",
  "ms-appdata",
  "ms-appx",
  "ms-autoplay",
  "ms-settings",
]);

const EXPLICITLY_EXCLUDED_SCHEMES = new Set([
  "bing",
  "blob",
  "file",
  "maps",
  "office",
  "onenote",
  "wallet",
  "xbls",
  "zune",
  "unknown",
  "res",
  "stickynotes",
  "ms-excel",
  "ms-powerpoint",
  "ms-windows-store",
  "ms-word",
  "windowsmediacenterapp",
  "windowsmediacenterssl",
  "windowsmediacenterweb",
]);

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function isUsefulReservedUriScheme(rawTerm) {
  const raw = String(rawTerm ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return false;
  if (/\d/.test(raw)) return false;

  const normalized = normalizeValue(raw).slug || normalizeValue(raw).compact;
  if (!normalized) return false;

  if (
    EXPLICITLY_EXCLUDED_SCHEMES.has(raw) ||
    EXPLICITLY_EXCLUDED_SCHEMES.has(normalized)
  ) {
    return false;
  }
  if (
    EXPLICITLY_ALLOWED_SCHEMES.has(raw) ||
    EXPLICITLY_ALLOWED_SCHEMES.has(normalized)
  ) {
    return true;
  }
  if (raw.startsWith("ms-settings:") || normalized.startsWith("ms-settings-")) {
    return true;
  }
  if (raw.startsWith("explorer.") || normalized.startsWith("explorer-")) {
    return true;
  }
  if (raw.endsWith("file") || normalized.endsWith("file")) return true;
  if (raw.endsWith("provider") || normalized.endsWith("provider")) return true;
  if (raw.endsWith("package") || normalized.endsWith("package")) return true;
  if (
    raw.includes("powershellscript") ||
    normalized.includes("powershellscript")
  )
    return true;
  if (raw.startsWith("application.") || normalized.startsWith("application-")) {
    return true;
  }
  if (raw.startsWith("windows.") || normalized.startsWith("windows-")) {
    return true;
  }
  return false;
}

export function extractWindowsReservedUriSchemes(html) {
  const headingIndex = String(html ?? "")
    .toLowerCase()
    .indexOf("reserved uri scheme names");
  if (headingIndex === -1) return [];

  const tableStart = String(html).indexOf("<table", headingIndex);
  const tableEnd = String(html).indexOf("</table>", tableStart);
  if (tableStart === -1 || tableEnd === -1) return [];

  const tableHtml = String(html).slice(tableStart, tableEnd);
  const cellMatches = tableHtml.match(/<td>[\s\S]*?<\/td>/gi) ?? [];
  const terms = new Set();

  for (const cell of cellMatches) {
    const candidate = stripTags(cell);
    if (!isUsefulReservedUriScheme(candidate)) continue;

    const normalized = normalizeValue(candidate);
    const term = normalized.slug || normalized.compact;
    if (!term || term.length < 3) continue;
    terms.add(term);
  }

  return Array.from(terms).sort((left, right) => left.localeCompare(right));
}

export async function fetchWindowsReservedUriSchemesHtml(fetchImpl = fetch) {
  const response = await fetchImpl(WINDOWS_RESERVED_URI_SCHEMES_PAGE_URL, {
    headers: { "user-agent": "nomsentry/0.3.0" },
  });
  if (!response.ok) {
    throw new Error(
      `Windows reserved URI schemes request failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.text();
}

export async function fetchWindowsReservedUriSchemes(fetchImpl = fetch) {
  const html = await fetchWindowsReservedUriSchemesHtml(fetchImpl);
  const terms = extractWindowsReservedUriSchemes(html);
  if (terms.length === 0) {
    throw new Error("Could not extract any Windows reserved URI schemes");
  }
  return terms;
}

export function buildWindowsReservedUriSchemesSource({
  terms,
  scopes = ["username", "tenantSlug"],
  category = "reservedTechnical",
}) {
  const normalizedTerms = Array.from(
    new Set(
      terms
        .filter((term) => isUsefulReservedUriScheme(term))
        .map((term) => {
          const normalized = normalizeValue(term);
          return normalized.slug || normalized.compact;
        })
        .filter((term) => term && term.length >= 3),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return validateSource({
    id: "imported-windows-reserved-uri-schemes",
    description:
      "Conservative technical subset of Windows reserved URI schemes derived from Microsoft Learn",
    metadata: {
      source: "Microsoft Learn",
      sourceUrl: WINDOWS_RESERVED_URI_SCHEMES_PAGE_URL,
      notes:
        "Filtered to protocol-like and system-handler URI schemes while excluding consumer-brand and common-noun entries.",
    },
    ruleDefaults: {
      category,
      scopes,
      match: "exact",
      normalizationField: "slug",
    },
    rules: normalizedTerms.map((term) => [
      `windows-reserved-uri/${term}`,
      term,
    ]),
  });
}
