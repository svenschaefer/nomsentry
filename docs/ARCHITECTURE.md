# Nomsentry Architecture

## Modules

- `src/core/normalize.js` - deterministic projections
- `src/core/matchers.js` - rule matching
- `src/core/composite.js` - composite pattern detection
- `src/core/script-risk.js` - mixed script detection
- `src/core/decision.js` - provisional decision logic
- `src/core/overrides.js` - final allow overrides
- `src/loaders/source-loader.js` - JSON source loading + validation
- `src/loaders/runtime-bundle.js` - compiled runtime bundle loading + bundle compatibility validation
- `src/importers/ldnoobw.js` - external wordlist normalization into source JSON
- `src/importers/toad-profanity.js` - @2toad/profanity normalization into source JSON
- `src/importers/obscenity.js` - obscenity dataset normalization into source JSON
- `src/importers/cuss.js` - cuss normalization into source JSON
- `src/importers/dsojevic-profanity.js` - dsojevic/profanity-list normalization into source-refined profanity, slur, sexual, and shock JSON
- `src/importers/insult-wiki.js` - insult.wiki HTML list normalization into source JSON
- `src/importers/gitlab-reserved-names.js` - conservative extraction of GitLab reserved project and group names into source JSON
- `src/importers/github-reserved-usernames.js` - conservative extraction of the additive GitHub Enterprise reserved-username impersonation subset into source JSON
- `src/importers/icann-reserved-names.js` - conservative extraction of the additive ICANN .com reserved-name technical subset into source JSON
- `src/importers/reserved-usernames.js` - conservative technical subset derivation from the reserved-usernames package dataset
- `src/importers/reserved-usernames-impersonation.js` - conservative impersonation subset derivation from the reserved-usernames package dataset
- `src/importers/windows-reserved-uri-schemes.js` - conservative technical subset derivation from Microsoft Learn reserved URI schemes
- `src/importers/derived-impersonation.js` - conservative derived impersonation vocabulary from maintained role and account-access sources
- `src/importers/derived-composite-risk.js` - conservative derived composite-risk vocabulary from maintained impersonation terms
- `src/importers/wikidata-brand-risk.js` - conservative Wikidata brand evaluation and derived-source construction
- `src/importers/uspto.js` - USPTO bulk trademark case files into full and derived protectedBrand source JSON
- `scripts/import-*.js` - source-specific import entrypoints
- `scripts/derive-impersonation.js` - conservative build-time derivation of the additive impersonation layer
- `scripts/derive-composite-risk.js` - conservative build-time derivation of the additive composite-risk layer
- `scripts/derive-uspto-brand-risk.js` - structural derivation of the runtime USPTO brand subset
- `scripts/derive-wikidata-brand-risk.js` - conservative build-time derivation of the Wikidata brand supplement
- `scripts/build-runtime-sources.js` - compilation of `custom/sources/` into the runtime bundle
- `scripts/compact-sources.js` - canonical rewrite of `custom/sources/` via stage-and-swap
- `scripts/check-maintained-sources-determinism.js` - reproducibility check for the maintained source artifacts
- `scripts/check-runtime-bundle-determinism.js` - reproducibility check for the compiled runtime bundle
- `src/schema/validate-source.js` - source/rule schema validation
- `src/schema/source-format.js` - compact source tuple format
- `src/schema/source-io.js` - compact source serialization and pruning
- `src/types.js` - shared typedefs for compact sources and runtime bundles
- `src/policies/*` - policy mapping

## Data flow

raw input
-> normalized projections
-> matched rules
-> derived risk matches
-> provisional decision
-> allow overrides
-> final explainable result

## Source architecture

The repository does not maintain built-in source packs anymore.

Instead it maintains:

- versioned source artifacts in `custom/sources/`
- a compiled runtime bundle in `dist/runtime-sources.json`
- a machine-readable build manifest in `dist/build-manifest.json`
- a deterministic source refresh policy in `source-refresh-policy.json`

`custom/sources/` contains imported or extracted third-party and normative artifacts. The CLI does not scan that directory directly anymore. It loads the compiled runtime bundle from `dist/runtime-sources.json` by default, and downstream projects can point it at another compiled bundle with `--bundle`.
The runtime loader rejects unsupported bundle versions and malformed table references before evaluation.
Maintained-source rewrites and runtime-bundle generation use atomic write or stage-and-swap paths to avoid partially-written artifacts on interruption.
The runtime build step also emits `dist/build-manifest.json`, which records the maintained source artifacts, their hashes, deterministic transform versions, matched refresh-policy metadata, package-backed upstream versions where available, and the runtime-bundle hash tied to that exact source artifact set.
The freshness gate uses `source-refresh-policy.json` plus git commit dates for the maintained source artifacts to detect stale imports without introducing nondeterministic timestamps into the versioned manifest.

The currently maintained source families are:

- structured authority, normative, or knowledge sources
  - USPTO
  - Wikidata
  - RFC 2142
  - GitLab reserved names
  - GitHub Enterprise reserved usernames
  - ICANN .com reserved names
  - reserved-usernames
  - Microsoft Windows reserved device names
  - Microsoft Windows reserved URI schemes
- direct wordlist or lexicon sources
  - LDNOOBW
  - insult.wiki
  - cuss
  - dsojevic/profanity-list
- library-backed imported datasets
  - @2toad/profanity
  - obscenity

For `protectedBrand`, the maintained default runtime now combines:

- a derived USPTO review subset from ingestible official trademark bulk data
- a conservative derived Wikidata supplement for uncovered brands

WIPO is not part of the ingest plan.

`words/profanities` is deliberately excluded from the default maintained source set because the flat list includes many generic low-signal terms that would create avoidable false positives without an additional curation layer.

`RFC 2142` feeds `impersonation`, not `reservedTechnical`, because the imported role mailbox names are modeled as impersonation-relevant identifiers.

`reservedTechnical` is currently covered by Windows reserved device names, a conservative Windows reserved URI scheme subset, a conservative GitLab reserved-routes import, a conservative ICANN .com reserved-name subset, and a conservative filtered `reserved-usernames` import. That improves route-collision and system-identifier coverage and now also includes maintained exact terms such as `settings`, but it does not yet settle the broader product-contract question for namespace and platform identifiers.

`impersonation` is currently covered by the RFC 2142 role-mailbox core, a conservative additive GitHub Enterprise reserved-username import for `staff`, a conservative additive `reserved-usernames` impersonation import for `account`, `accounts`, `billing`, `official`, and `password`, and a conservative derived additive layer sourced from maintained GitLab and `reserved-usernames` terms. The maintained baseline now covers exact-token operator, account-access, and limited trust-facing identifiers such as `admin`, `administrator`, `billing`, `help`, `login`, `oauth`, `official`, `password`, `profile`, `secure`, `sysadmin`, and `webmail`, but it still does not solve the modern payments, verification, trust, and safety vocabulary on its own.

`compositeRisk` is currently covered by the RFC 2142 `security+support` rule plus a conservative derived layer that combines maintained impersonation/account-access terms with the maintained `support` and `security` anchors. That closes exact-token combinations such as `admin-support`, `billing-support`, `official-support`, `password-security`, and `login-security`, but broader trust, verification, and recovery combinations remain open.

USPTO is handled in two layers:

- full official imports live outside the default runtime path in local `data/uspto/full-sources/`
- a derived review-level subset is generated into `custom/sources/derived-uspto-brand-risk.json`

The derived USPTO filter now strips trailing legal-entity suffixes such as `Inc.` or `LLC` before the structural thresholds are applied, so the runtime-facing term tracks the brand-facing identifier when the remaining form still fits the maintained conservative profile.

Wikidata is handled as a separate derived layer:

- an evaluation report can be refreshed into `docs/generated/wikidata-brand-gap-report.json`
- a conservative derived supplement is generated into `custom/sources/derived-wikidata-brand-risk.json`

The derived-brand path is still intentionally conservative rather than editorial. The repository does not maintain its own hand-written brand allow/block list, but it now does carry explicit ambiguity exclusions in the Wikidata-derived layer for terms such as `apple`, `amazon`, and `visa`.
