import fs from "node:fs";
import path from "node:path";
import { normalizeValue } from "../core/normalize.js";
import { validateSource } from "../schema/validate-source.js";

export const RESERVED_USERNAMES_SOURCE_URL =
  "https://github.com/mvila/reserved-usernames";

const TECHNICAL_TERM_PATTERN =
  /^(adm|admin|administrator|api|auth|authentication|backup|cache|cgi|config|configuration|db|dns|ftp|hostmaster|hostname|http|https|imap|localhost|login|logout|mail|mailer-daemon|mx|ns([1-9]|10)?|null|oauth|openid|passwd|ping|pop3?|root|search|secure|security|server(-info|-status)?|settings|smtp|ssh|ssl(admin|administrator|webmaster)?|stat|stats|status|sys(admin|administrator)?|system|telnet|tls|tmp|tokenserver|uploads|uptime|vpn|webmail|webmaster|wpad|www|xml|xmpp)$/;

export function getReservedUsernamesDataPath(baseDir = process.cwd()) {
  return path.resolve(
    baseDir,
    "node_modules",
    "reserved-usernames",
    "data.json",
  );
}

export function loadReservedUsernamesTerms(baseDir = process.cwd()) {
  return JSON.parse(
    fs.readFileSync(getReservedUsernamesDataPath(baseDir), "utf8"),
  );
}

export function filterReservedUsernameTerms(terms) {
  return Array.from(
    new Set(
      terms
        .map((term) => {
          const normalized = normalizeValue(term);
          return normalized.slug || normalized.compact;
        })
        .filter(Boolean)
        .filter((term) => term.length >= 2)
        .filter((term) => TECHNICAL_TERM_PATTERN.test(term)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function buildReservedUsernamesSource({
  terms,
  scopes = ["username", "tenantSlug"],
  category = "reservedTechnical",
}) {
  const filteredTerms = filterReservedUsernameTerms(terms);

  return validateSource({
    id: "imported-reserved-usernames",
    description:
      "Conservatively filtered technical and namespace-collision terms derived from reserved-usernames",
    metadata: {
      source: "reserved-usernames",
      license: "MIT",
      sourceUrl: RESERVED_USERNAMES_SOURCE_URL,
      notes:
        "Filtered to technical and namespace-collision terms to avoid importing the package's broader generic reserved-name set directly.",
    },
    ruleDefaults: {
      category,
      scopes,
      match: "token",
      normalizationField: "slug",
    },
    rules: filteredTerms.map((term) => [`reserved-usernames/${term}`, term]),
  });
}
