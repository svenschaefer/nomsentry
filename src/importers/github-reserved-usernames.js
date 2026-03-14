import { validateSource } from "../schema/validate-source.js";
import { normalizeValue } from "../core/normalize.js";

export const GITHUB_RESERVED_USERNAMES_PAGE_URL =
  "https://docs.github.com/en/enterprise-server%403.19/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/about-reserved-usernames-for-github-enterprise-server";

const ADDITIVE_IMPERSONATION_TERMS = new Set(["staff"]);

export function extractGitHubReservedUsernames(html) {
  const listMatch = html.match(
    /the following words are reserved:<\/p>\s*<ul>([\s\S]*?)<\/ul>/i,
  );
  if (!listMatch) {
    throw new Error("Could not find GitHub reserved usernames list markup");
  }

  const terms = [];
  const itemPattern = /<li>\s*<code>([^<]+)<\/code>\s*<\/li>/gi;
  let match;

  while ((match = itemPattern.exec(listMatch[1])) !== null) {
    const term = String(match[1] ?? "")
      .trim()
      .toLowerCase();
    if (!term) continue;
    terms.push(term);
  }

  return Array.from(new Set(terms)).sort((left, right) =>
    left.localeCompare(right),
  );
}

export async function fetchGitHubReservedUsernames(fetchImpl = fetch) {
  const response = await fetchImpl(GITHUB_RESERVED_USERNAMES_PAGE_URL);
  if (!response.ok) {
    throw new Error(
      `GitHub reserved usernames request failed: ${response.status} ${response.statusText}`,
    );
  }

  const terms = extractGitHubReservedUsernames(await response.text());
  if (terms.length === 0) {
    throw new Error("Could not extract any GitHub reserved usernames");
  }
  return terms;
}

export function buildGitHubReservedUsernamesSource({
  terms,
  scopes = ["username", "tenantSlug", "tenantName"],
  category = "impersonation",
}) {
  const filteredTerms = Array.from(
    new Set(
      terms
        .map((term) => normalizeValue(term).latinFolded)
        .filter(Boolean)
        .filter((term) => ADDITIVE_IMPERSONATION_TERMS.has(term)),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return validateSource({
    id: "imported-github-reserved-usernames",
    description:
      "Conservative additive impersonation terms extracted from GitHub Enterprise reserved usernames",
    metadata: {
      source: "GitHub Docs",
      sourceUrl: GITHUB_RESERVED_USERNAMES_PAGE_URL,
      notes:
        "Filtered to additive impersonation terms from the published GitHub Enterprise reserved-username examples. Duplicates and generic route terms are intentionally excluded.",
    },
    ruleDefaults: {
      category,
      scopes,
      match: "token",
      normalizationField: "confusableSkeleton",
      idPrefix: "github-reserved-usernames/",
    },
    rules: filteredTerms.map((term) => [term, term]),
  });
}
