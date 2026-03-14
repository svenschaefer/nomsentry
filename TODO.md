# TODO

## P1 Product and policy quality

- Expand maintained `reservedTechnical` coverage beyond Windows device names when the product contract expects broader platform or system identifiers.
  - Why:
    - A catalog-based runtime evaluation originally showed that terms such as `admin`, `root`, `system`, `api`, `mail`, `status`, and `webhook` evaluated to `allow`.
    - The maintained repo source set now includes Windows reserved device names, a conservative GitLab reserved-routes import, and a conservative filtered `reserved-usernames` import, which closes `root`, `system`, `mail`, and `status` but still leaves the broader technical-identifier expectation only partially met.
    - A direct evaluation of `github-reserved-names` against the maintained baseline showed unacceptable noise for the default set, for example `seven-labs` becoming `reject` because of the generic `labs` route term.
  - Target:
    - decide the intended `reservedTechnical` scope explicitly
    - if broader coverage is intended, evaluate whether to add further filtered imports or optional Windows reserved URI scheme names
    - only revisit `github-reserved-names` with a stricter documented derived filter strategy

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
    - That is defensible as a first-pass noise filter, but not yet enterprise-grade from a precision/recall perspective.
    - The current thresholds are still too blunt: one-word marks require at least 12 characters, multi-word marks allow at most 2 tokens with at least 6 characters each, and digit-bearing terms are dropped entirely.
    - Those rules reduce noise, but they also exclude many relevant short or otherwise legitimate brand identifiers and are not a clean long-term calibration.
  - Target:
    - measure false positives on realistic identifier corpora
    - document expected behavior for generic English terms and long-tail marks
    - replace the current blunt structural thresholds with a better-calibrated derived profile
    - decide which short, numeric, and ambiguous brand forms should remain in the maintained default profile

- Implement a conservative `derived-wikidata-brand-risk.json` supplement for uncovered brands.
  - Why:
    - A catalog-based runtime evaluation showed that globally recognizable brands such as `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, `visa`, `mastercard`, `amazon`, and `apple` currently evaluate to `allow` under the official-only derived subset.
    - The Wikidata evaluation in [docs/WIKIDATA_BRAND_EVALUATION.md](/C:/code/nomsentry/docs/WIKIDATA_BRAND_EVALUATION.md) and [docs/generated/wikidata-brand-gap-report.json](/C:/code/nomsentry/docs/generated/wikidata-brand-gap-report.json) confirmed that clean candidate item pages exist for the uncovered-brand examples.
    - The same evaluation also showed that some pages are ambiguity-prone, especially `visa`, `amazon`, and `apple`, so the supplement must be filtered rather than imported blindly.
  - Target:
    - implement the supplement as a build-step extractor, not as a runtime dependency
    - prefer deterministic SPARQL JSON extraction over full dump parsing unless Query Service limits become the blocker
    - implement a conservative extractor for brand-relevant Wikidata items
    - allow overlap with the USPTO-derived subset instead of forcing a strict non-overlap rule
    - derive runtime-facing brand terms without legal suffixes such as `Inc.` or `Ltd.`
    - define allowed item classes and ambiguity filters explicitly
    - document how the Wikidata-derived subset coexists with the USPTO-derived subset
    - add grouped TP and FP coverage for the first accepted Wikidata-derived brand cohort

- Expand maintained `compositeRisk` coverage beyond the current single `security+support` rule if the product expects broader deception-combination coverage.
  - Why:
    - A catalog-based runtime evaluation showed that combinations such as `account-recovery`, `trust-safety`, and `billing-support` are mostly uncovered unless one component independently matches another category.
    - The current runtime bundle contains only one composite rule.
    - A follow-up source review did not identify a strong free third-party source that directly ships these product-relevant composite combinations.
  - Target:
    - define the intended composite vocabulary explicitly
    - generate composite rules from maintained impersonation or recovery vocabularies, or another documented derived source strategy

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
    - Current tests now include broader deterministic generated invariants, but a fuller fuzz/property harness is still missing.
  - Target:
    - fuzz around separators, zero-width characters, mixed normalization forms, and confusable sequences
    - assert stability and idempotence of normalization

- Add coverage for import-script failure modes.
  - Why:
    - The import suite now covers bad arguments and some network or malformed-payload failures, but partial-write paths and broader upstream failure permutations are still lightly tested.
  - Target:
    - expand upstream fetch-failure coverage across the remaining import entrypoints
    - add coverage for partial-write paths during artifact generation

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

- Consider adding TypeScript or JSDoc-based type checking for the source and runtime bundle schemas.
  - Why:
    - The core data model is tuple-heavy and compact by design.
    - That makes static shape validation more valuable than in a simpler object model.
