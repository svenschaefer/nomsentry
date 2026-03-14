import { normalizeValue } from "../core/normalize.js";
import { validateSource } from "../schema/validate-source.js";

export const GITLAB_RESERVED_NAMES_PAGE_URL =
  "https://docs.gitlab.com/user/reserved_names/";
export const GITLAB_RESERVED_NAMES_RAW_URL =
  "https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/user/reserved_names.md";

const SECTION_HEADINGS = ["Reserved project names", "Reserved group names"];

function extractSection(markdown, heading) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const headingLine = `## ${heading}`;
  const startIndex = lines.findIndex((line) => line.trim() === headingLine);
  if (startIndex === -1) return "";

  const sectionLines = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) break;
    sectionLines.push(lines[index]);
  }

  return sectionLines.join("\n");
}

function isUsefulReservedName(rawTerm) {
  const term = String(rawTerm ?? "").trim();
  if (!term || term === "\\-") return false;
  if (term.includes("/")) return false;
  if (term.startsWith(".")) return false;
  if (/\.(?:html|png|ico|txt|xml|gz)$/i.test(term)) return false;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(term)) return false;
  if (term.length < 3) return false;
  return true;
}

export function extractGitLabReservedNames(markdown) {
  const terms = new Set();

  for (const heading of SECTION_HEADINGS) {
    const section = extractSection(markdown, heading);
    const bulletPattern = /^\s*-\s+`([^`]+)`/gm;
    let match;

    while ((match = bulletPattern.exec(section)) !== null) {
      const candidate = match[1].trim();
      if (!isUsefulReservedName(candidate)) continue;

      const normalized = normalizeValue(candidate);
      const term = normalized.slug || normalized.compact;
      if (!term || term.length < 3) continue;
      terms.add(term);
    }
  }

  return Array.from(terms).sort((left, right) => left.localeCompare(right));
}

export async function fetchGitLabReservedNamesMarkdown(fetchImpl = fetch) {
  const response = await fetchImpl(GITLAB_RESERVED_NAMES_RAW_URL);
  if (!response.ok) {
    throw new Error(
      `GitLab reserved names request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

export async function fetchGitLabReservedNames(fetchImpl = fetch) {
  const markdown = await fetchGitLabReservedNamesMarkdown(fetchImpl);
  const terms = extractGitLabReservedNames(markdown);
  if (terms.length === 0) {
    throw new Error("Could not extract any GitLab reserved names");
  }
  return terms;
}

export function buildGitLabReservedNamesSource({
  terms,
  scopes = ["username", "tenantSlug"],
  category = "reservedTechnical",
}) {
  const normalizedTerms = Array.from(
    new Set(
      terms
        .filter((term) => isUsefulReservedName(term))
        .map((term) => {
          const normalized = normalizeValue(term);
          return normalized.slug || normalized.compact;
        })
        .filter((term) => term && term.length >= 3),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return validateSource({
    id: "imported-gitlab-reserved-names",
    description:
      "Reserved project and group names extracted conservatively from GitLab documentation",
    metadata: {
      source: "GitLab Docs",
      license: "CC-BY-SA-4.0",
      sourceUrl: GITLAB_RESERVED_NAMES_PAGE_URL,
      notes:
        "Filtered to route-like reserved identifiers that are plausible generic namespace conflicts.",
    },
    ruleDefaults: {
      category,
      scopes,
      match: "token",
      normalizationField: "slug",
    },
    rules: normalizedTerms.map((term) => [`gitlab-reserved/${term}`, term]),
  });
}
