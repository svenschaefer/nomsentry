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

- Harden the CLI command flow so invalid commands fail before engine evaluation.
  - Why:
    - [bin/nomsentry.js](/C:/code/nomsentry/bin/nomsentry.js) evaluates the engine before checking whether the command is `check` or `explain`.
    - Invalid commands can therefore surface unrelated engine errors instead of `Unknown command`.
  - Target:
    - validate command and kind before evaluation
    - return stable exit codes for usage, validation, and runtime failures

## P1 Product and policy quality

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
  - Target:
    - measure false positives on realistic identifier corpora
    - document expected behavior for generic English terms and long-tail marks

- Add runtime bundle compatibility checks.
  - Why:
    - [src/loaders/runtime-bundle.js](/C:/code/nomsentry/src/loaders/runtime-bundle.js) validates tuple shape, but not semantic compatibility between bundle version and loader expectations.
    - There is also no manifest-level guarantee that the bundle was built from the current source schema.
  - Target:
    - explicit runtime bundle schema versioning
    - fail-fast on unsupported bundle versions

- Add a documented policy for downstream source extension.
  - Why:
    - The docs state that downstream projects can add their own sources, but there is no documented merge, precedence, or override model for such extensions.
  - Target:
    - define how downstream sources interact with maintained sources, compiled bundles, and allow overrides

## P1 Quality and test coverage

- Add unit tests for negative and malformed runtime bundle cases.
  - Why:
    - Existing tests cover the happy path for `dist/runtime-sources.json`, but not corrupted profile indexes, missing tables, invalid tuple lengths, or unsupported bundle versions.
  - Target:
    - direct tests for `expandRuntimeBundle()` error handling

- Add dedicated CLI tests.
  - Why:
    - The suite currently exercises the engine directly and does a few manual CLI smoke checks, but there is no systematic coverage of CLI usage errors, unknown commands, unknown kinds, or exit codes.
  - Target:
    - test `check`, `explain`, usage output, unknown command handling, and namespace override behavior

- Add fuzz and property-style tests for normalization.
  - Why:
    - [src/core/normalize.js](/C:/code/nomsentry/src/core/normalize.js), [src/unicode/confusables.js](/C:/code/nomsentry/src/unicode/confusables.js), and [src/unicode/latinize.js](/C:/code/nomsentry/src/unicode/latinize.js) are central and high-risk.
    - Current tests are good regression examples but still example-based.
  - Target:
    - fuzz around separators, zero-width characters, mixed normalization forms, and confusable sequences
    - assert stability and idempotence of normalization

- Add coverage for import-script failure modes.
  - Why:
    - The importers themselves are partially tested, but the CLI scripts are not tested for bad arguments, network failures, malformed upstream payloads, or partial writes.
  - Target:
    - tests for `scripts/import-*.js` argument validation
    - tests for upstream fetch failures and malformed HTML/CSV

- Add regression tests for source schema edge cases.
  - Why:
    - The schema tests cover several cases already, but not enough around empty source sets, invalid compact tuples, invalid `ruleDefaults`, and malformed composite rules in compact sources.
  - Target:
    - direct tests for `compactSource()`, `expandSource()`, `serializeSource()`, and `validateSource()`

- Add tests for policy matrix edge cases with `severity`.
  - Why:
    - There is one positive `severity` test, but not enough around missing severities, unknown severities, partial severity maps, or mixed-category interactions.
  - Target:
    - assert stable fallback behavior for incomplete decision matrices

## P2 Engineering hygiene

- Add CI for tests and runtime-bundle build verification.
  - Why:
    - The repo currently relies on local execution only.
  - Target:
    - run `npm test`
    - run `npm run build:runtime-sources`
    - verify no diff after rebuild where appropriate

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
