import { normalizeValue } from "../core/normalize.js";
import { validateSource } from "../schema/validate-source.js";
import { RESERVED_USERNAMES_SOURCE_URL } from "./reserved-usernames.js";

const IMPERSONATION_TERM_PATTERN =
  /^(account|accounts|billing|official|password|payment|reset|reset-password|resetpassword)$/;

function addConservativeAliases(terms) {
  const expanded = new Set(terms);
  if (expanded.has("payment")) expanded.add("payments");
  return Array.from(expanded);
}

export function filterReservedUsernameImpersonationTerms(terms) {
  return Array.from(
    new Set(
      addConservativeAliases(
        terms
          .map((term) => {
            const normalized = normalizeValue(term);
            return normalized.slug || normalized.compact;
          })
          .filter(Boolean)
          .filter((term) => term.length >= 2)
          .filter((term) => IMPERSONATION_TERM_PATTERN.test(term)),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function buildReservedUsernamesImpersonationSource({
  terms,
  scopes = ["username", "tenantSlug", "tenantName"],
  category = "impersonation",
}) {
  const filteredTerms = filterReservedUsernameImpersonationTerms(terms);

  return validateSource({
    id: "imported-reserved-usernames-impersonation",
    description:
      "Conservatively filtered account-access and trust-facing terms derived from reserved-usernames",
    metadata: {
      source: "reserved-usernames",
      license: "MIT",
      sourceUrl: RESERVED_USERNAMES_SOURCE_URL,
      notes:
        "Filtered to exact account-access and trust-facing identifiers to avoid importing the package's broader generic reserved-name set directly. Adds only the conservative plural alias `payments` when the maintained exact token `payment` is present.",
    },
    ruleDefaults: {
      category,
      scopes,
      match: "token",
      normalizationField: "confusableSkeleton",
    },
    rules: filteredTerms.map((term) => [
      `reserved-usernames-impersonation/${term}`,
      term,
    ]),
  });
}
