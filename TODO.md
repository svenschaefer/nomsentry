# TODO

## P0 Enterprise readiness

- Replace the current O(n) per-request rule scan with an indexed matcher for runtime use.
  - Why:
    - `createEngine()` in [src/core/evaluate.js](/C:/code/nomsentry/src/core/evaluate.js) materializes all rules into one flat array.
    - `matchRules()` in [src/core/matchers.js](/C:/code/nomsentry/src/core/matchers.js) then scans every rule for every input.
    - With the current runtime bundle size this is acceptable for a CLI, but it is not an enterprise-grade serving path.
  - Target:
    - pre-index by `scope`, `match`, and normalized token
    - keep startup compilation separate from request-time matching

- Add source provenance and reproducibility metadata to the build pipeline.
  - Why:
    - We version imported artifacts, but there is no machine-readable manifest that records import timestamp, upstream version/commit, input URL, local transform version, and runtime bundle build hash.
    - This is a governance and auditability gap for enterprise use.
  - Target:
    - add a build manifest for `custom/sources/` and `dist/runtime-sources.json`
    - include upstream source version and generated-at timestamp

- Add a source refresh policy and staleness checks.
  - Why:
    - The repo currently has import scripts but no freshness policy, no age warning, and no automated check for stale imports.
    - This matters for trademark sources and profanity datasets that change over time.
  - Target:
    - define expected refresh cadence per source family
    - fail CI or warn when source artifacts exceed allowed age

## P1 Product and policy quality

- Expand maintained `reservedTechnical` coverage beyond Windows device names when the product contract expects broader platform or system identifiers.
  - Why:
    - A catalog-based runtime evaluation showed that terms such as `admin`, `root`, `system`, `api`, `mail`, `status`, and `webhook` currently evaluate to `allow`.
    - The maintained repo source set now includes Windows reserved device names plus a conservative GitLab reserved-routes import, but the broader technical-identifier expectation is still only partially met.
  - Target:
    - decide the intended `reservedTechnical` scope explicitly
    - if broader coverage is intended, evaluate whether to add filtered imports from `reserved-usernames`, `github-reserved-names`, and optionally Windows reserved URI scheme names

- Expand maintained `impersonation` coverage beyond the current RFC 2142-centered role set.
  - Why:
    - A catalog-based runtime evaluation showed that `official`, `billing`, `payments`, `verified`, `trust`, `safety`, `account-recovery`, and `password-reset` currently do not match maintained `impersonation` sources.
    - The current maintained `impersonation` set is only 15 rules wide and is heavily centered on RFC 2142 mailbox roles.
    - A follow-up source review did not identify a strong freely redistributable standard source for the modern trust, billing, verification, and recovery vocabulary.
  - Target:
    - define the intended impersonation-role vocabulary
    - ingest the best available free extensions for the RFC 2142 core
    - document where a derived project layer is still required because no strong free source exists

- Split the current broad `profanity` category into more precise policy categories.
  - Why:
    - The repo currently puts profanity, insults, slurs, and extremist references into one top-level category.
    - Even with `severity`, the semantic grouping is still too coarse for explainability, customer policy customization, and compliance review.
  - Target:
    - introduce categories such as `generalProfanity`, `insult`, `slur`, `extremism`
    - keep source-specific evidence while mapping to clearer runtime policy decisions

- Revisit the default USPTO brand-risk derivation with measured false-positive analysis.
  - Why:
    - The current derivation in [src/importers/uspto.js](/C:/code/nomsentry/src/importers/uspto.js) is intentionally structural only.
    - That is defensible, but not yet enterprise-grade from a precision/recall perspective.
    - A catalog-based runtime evaluation showed that short global brands such as `openai`, `paypal`, `google`, and `github` currently evaluate to `allow` under the official-only derived subset.
  - Target:
    - measure false positives on realistic identifier corpora
    - document expected behavior for generic English terms and long-tail marks
    - decide whether the official-source-derived heuristics should also retain short globally sensitive marks
    - evaluate a `derived-wikidata-brand-risk.json` supplement as a free CC0 seed for short global brands alongside the USPTO-derived subset

- Expand maintained `compositeRisk` coverage beyond the current single `security+support` rule if the product expects broader deception-combination coverage.
  - Why:
    - A catalog-based runtime evaluation showed that combinations such as `account-recovery`, `trust-safety`, and `billing-support` are mostly uncovered unless one component independently matches another category.
    - The current runtime bundle contains only one composite rule.
    - A follow-up source review did not identify a strong free third-party source that directly ships these product-relevant composite combinations.
  - Target:
    - define the intended composite vocabulary explicitly
    - generate composite rules from maintained impersonation or recovery vocabularies, or another documented derived source strategy

- Add a documented policy for downstream source extension.
  - Why:
    - The docs state that downstream projects can add their own sources, but there is no documented merge, precedence, or override model for such extensions.
  - Target:
    - define how downstream sources interact with maintained sources, compiled bundles, and allow overrides

## P1 Quality and test coverage

- Expand broad outcome-matrix coverage for true positives, false positives, true negatives, and likely false negatives.
  - Why:
    - The current suite is solid on targeted regressions, but it is still not broad enough as a category-level product matrix.
    - The current coverage is strongest for example-based regressions and weaker for grouped category-level expectations across `reservedTechnical`, `impersonation`, `protectedBrand`, `profanity`, `scriptRisk`, and `compositeRisk`.
  - Target:
    - maintain grouped category fixture suites for true positives and false positives
    - make likely false-negative areas explicit until their underlying source or policy gaps are closed

- Add fuzz and property-style tests for normalization.
  - Why:
    - [src/core/normalize.js](/C:/code/nomsentry/src/core/normalize.js), [src/unicode/confusables.js](/C:/code/nomsentry/src/unicode/confusables.js), and [src/unicode/latinize.js](/C:/code/nomsentry/src/unicode/latinize.js) are central and high-risk.
    - Current tests now include basic generated invariants, but broader fuzz coverage is still missing.
  - Target:
    - fuzz around separators, zero-width characters, mixed normalization forms, and confusable sequences
    - assert stability and idempotence of normalization

- Add coverage for import-script failure modes.
  - Why:
    - The import suite now covers bad arguments and some network or malformed-payload failures, but partial-write paths and broader upstream failure permutations are still lightly tested.
  - Target:
    - expand upstream fetch-failure coverage across the remaining import entrypoints
    - add coverage for partial-write paths during artifact generation

- Add regression tests for source schema edge cases.
  - Why:
    - The schema tests now cover several compact-source and validation edge cases, but there is still no dedicated coverage for stricter compact-override typing and some malformed composite-source combinations.
  - Target:
    - direct tests for `compactSource()`, `expandSource()`, `serializeSource()`, and `validateSource()`

- Add tests for policy matrix edge cases with `severity`.
  - Why:
    - `severity` fallback behavior is now partially covered, but mixed-category escalation and broader matrix interactions are still lightly tested.
  - Target:
    - add deeper mixed-category and multi-rule matrix coverage

- Add regression tests for deterministic maintained source generation.
  - Why:
    - Script-level determinism is checked, but the test suite still does not assert deterministic maintained-source rebuilds inline.
    - That leaves a quality gap around future ordering bugs inside lower-level helpers.
  - Target:
    - test stable ordering of loaded sources
    - test that rebuilding maintained source artifacts from unchanged inputs produces identical serialized output

- Add tests for destructive-script safeguards.
  - Why:
    - [scripts/compact-sources.js](/C:/code/nomsentry/scripts/compact-sources.js) now has guardrails for empty sources and unexpected files, but rollback-path and interruption behavior are still under-tested.
  - Target:
    - test rollback behavior under staged-write or rename failures
    - add deeper path-misuse coverage for destructive maintenance scripts

- Add regression coverage from the curated identifier catalog review.
  - Why:
    - A broad curated catalog was reviewed across `reservedTechnical`, `impersonation`, `protectedBrand`, `profanity`, `scriptRisk`, and `compositeRisk`.
    - The current suite still lacks broad grouped fixtures for positive coverage and nearby false positives such as `supporter`, `securityresearch`, `Scunthorpe`, `Cockburn`, and short-brand variants.
  - Target:
    - split the reviewed catalog into grouped fixture files
    - keep separate positive, obfuscated, mixed-script, composite, and false-positive suites

- Add targeted normalization coverage for compact profanity and technical variants that currently fall through.
  - Why:
    - A catalog-based runtime evaluation showed that variants such as `fck` and `adm1n` currently evaluate to `allow`.
    - Some misses are source-coverage gaps, but some are also normalization and compact-variant expectations that should be made explicit.
  - Target:
    - decide which compact forms are part of the supported detection contract
    - add direct regression tests for the accepted compact-form set

## P2 Engineering hygiene

- Add linting and formatting checks for source and script code.
  - Why:
    - There is no automated static hygiene pass in the repository today.
  - Target:
    - adopt a minimal lint/format setup that does not fight the current code style

- Consider adding TypeScript or JSDoc-based type checking for the source and runtime bundle schemas.
  - Why:
    - The core data model is tuple-heavy and compact by design.
    - That makes static shape validation more valuable than in a simpler object model.

- Add benchmark fixtures for runtime matching and bundle loading.
  - Why:
    - Performance is now a product concern because the runtime artifact is intentionally large and compiled.
  - Target:
    - measure engine startup, bundle load time, and per-request matching latency on representative inputs
