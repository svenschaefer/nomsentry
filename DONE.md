# DONE

## Completed recently

- Evaluated Wikidata as a `protectedBrand` supplement source for uncovered brands.
  - added [docs/WIKIDATA_BRAND_EVALUATION.md](/C:/code/nomsentry/docs/WIKIDATA_BRAND_EVALUATION.md)
  - confirmed that the current runtime still allows representative globally recognizable brands such as `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, `visa`, `mastercard`, `amazon`, and `apple`
  - confirmed that Wikidata has clean candidate item pages for the main uncovered-brand examples
  - documented the ambiguity risk for pages behind `visa`, `amazon`, and `apple`

- Expanded the deterministic normalization property corpus.
  - [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js) now covers broader generated normalization variants across case-mixing, NFD forms, fullwidth ASCII, separator-heavy forms, and supported confusable substitutions
  - the added corpus distinguishes `compact`-preserving variants from stricter `slug`-preserving variants so the tests match the actual normalization contract

- Expanded the grouped maintained-runtime regression matrix.
  - [test/fixtures/catalog-maintained-obfuscated-positives.json](/C:/code/nomsentry/test/fixtures/catalog-maintained-obfuscated-positives.json) now covers more separator, leetspeak, and compact obfuscation variants
  - [test/fixtures/catalog-maintained-mixed-script.json](/C:/code/nomsentry/test/fixtures/catalog-maintained-mixed-script.json) now covers more mixed-script fallback review examples
  - [test/fixtures/catalog-maintained-false-positives.json](/C:/code/nomsentry/test/fixtures/catalog-maintained-false-positives.json) now covers more nearby negatives from the reviewed catalog

- Expanded destructive-script safeguard coverage for `compact-sources`.
  - [scripts/compact-sources.js](/C:/code/nomsentry/scripts/compact-sources.js) now supports injected filesystem behavior for failure simulation in tests
  - [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js) now covers rollback after a staged swap failure and verifies restoration of the original source directory

- Enriched the build provenance manifest with deterministic transform and refresh metadata.
  - [dist/build-manifest.json](/C:/code/nomsentry/dist/build-manifest.json) now records deterministic transform versions per maintained artifact
  - the manifest now carries matched refresh-policy metadata per maintained artifact
  - package-derived maintained sources now record their exact upstream versions from [package-lock.json](/C:/code/nomsentry/package-lock.json)
  - the manifest now records the hashes of its deterministic provenance inputs
  - [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js) now asserts the enriched manifest schema directly

- Added a lightweight runtime benchmark harness.
  - added [scripts/benchmark-runtime.js](/C:/code/nomsentry/scripts/benchmark-runtime.js)
  - added `npm run benchmark:runtime` in [package.json](/C:/code/nomsentry/package.json)
  - benchmark coverage includes runtime-bundle load time, engine creation time, and evaluation latency over maintained fixture inputs
  - added direct benchmark argument and summary coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js)

- Replaced the linear runtime matcher with a prebuilt indexed matcher.
  - [src/core/matchers.js](/C:/code/nomsentry/src/core/matchers.js) now builds and queries a rule index keyed by scope, normalization field, match type, and token candidates
  - [src/core/evaluate.js](/C:/code/nomsentry/src/core/evaluate.js) now compiles the index once at engine creation time
  - added direct regression coverage for indexed concatenated-token and multi-token sequence matching in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js)

- Added a source refresh policy and staleness gate.
  - added [source-refresh-policy.json](/C:/code/nomsentry/source-refresh-policy.json)
  - added [scripts/check-source-freshness.js](/C:/code/nomsentry/scripts/check-source-freshness.js)
  - wired `npm run freshness:check` into [package.json](/C:/code/nomsentry/package.json) and [ci:check](/C:/code/nomsentry/package.json)
  - added direct refresh-policy and staleness-assessment coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js)
  - freshness checks now evaluate the current `custom/sources/` state by default instead of relying on a prebuilt manifest

- Expanded maintenance-script failure coverage.
  - added argument validation coverage for GitLab import, 2toad import, and runtime-bundle build entrypoints
  - added invalid-date and invalid-policy coverage for the freshness check entrypoint

- Expanded direct source-schema edge-case coverage further.
  - shared default extraction for compact sources is now asserted explicitly
  - compact metadata/default merging is now asserted explicitly
  - malformed compact scope overrides are now covered
  - malformed composite `allOf` entries are now covered

- Expanded `severity` policy-matrix coverage further.
  - mixed-category review-plus-reject interactions are now covered
  - same-category low/high severity dominance is now covered
  - severity evidence retention in final reasons is now covered

- Added a machine-readable build provenance manifest.
  - added [scripts/build-provenance-manifest.js](/C:/code/nomsentry/scripts/build-provenance-manifest.js)
  - [scripts/build-runtime-sources.js](/C:/code/nomsentry/scripts/build-runtime-sources.js) now writes [dist/build-manifest.json](/C:/code/nomsentry/dist/build-manifest.json)
  - [scripts/check-runtime-bundle-determinism.js](/C:/code/nomsentry/scripts/check-runtime-bundle-determinism.js) now verifies the manifest alongside the runtime bundle
  - [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js) now checks the manifest structure and atomic write path

- Expanded maintained `reservedTechnical` coverage with a conservative GitLab source import.
  - added [src/importers/gitlab-reserved-names.js](/C:/code/nomsentry/src/importers/gitlab-reserved-names.js)
  - added [scripts/import-gitlab-reserved-names.js](/C:/code/nomsentry/scripts/import-gitlab-reserved-names.js)
  - added [custom/sources/gitlab-reserved-names.json](/C:/code/nomsentry/custom/sources/gitlab-reserved-names.json)
  - rebuilt [dist/runtime-sources.json](/C:/code/nomsentry/dist/runtime-sources.json)

- Expanded regression coverage for the new GitLab reserved-name path.
  - parser coverage for conservative Markdown extraction
  - fetch-failure and fetch-success coverage for the GitLab import path
  - baseline fixture coverage for maintained reserved-technical positives and nearby false positives

- Expanded the grouped catalog-based quality matrix around the maintained runtime baseline.
  - added maintained-only grouped fixtures for obfuscated positives and mixed-script positives
  - added a grouped fixture for documented current coverage gaps so expected misses stay explicit
  - stopped routing grouped catalog fixtures through the synthetic helper source set

- Added basic generated normalization property coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - idempotence checks for `latinFolded`, `compact`, and `slug`
  - generated invisible-character invariants
  - generated separator-variant invariants

- Added in-suite determinism coverage for maintained source generation.
  - directory loading order is now tested explicitly
  - repeated compaction of unchanged source inputs is now tested for byte-stable output

- Made maintained-source and runtime-bundle writes crash-safer.
  - [src/schema/source-io.js](/C:/code/nomsentry/src/schema/source-io.js) now writes files atomically through temporary files plus rename.
  - [scripts/build-runtime-sources.js](/C:/code/nomsentry/scripts/build-runtime-sources.js) now uses the same atomic write path for `dist/runtime-sources.json`.
  - [scripts/compact-sources.js](/C:/code/nomsentry/scripts/compact-sources.js) now stages rewritten source files in a temporary directory and swaps them into place only after success.

- Added regression coverage for artifact-generation safeguards in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - atomic source-file writes
  - atomic runtime-bundle writes
  - `compact-sources` stage/swap behavior
  - stable `insult.wiki` filename mapping during source compaction

- Added destructive-script guardrails to [scripts/compact-sources.js](/C:/code/nomsentry/scripts/compact-sources.js).
  - refuses empty source sets
  - refuses to replace source directories containing unexpected non-JSON entries
  - covered by dedicated regression tests in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js)

- Hardened import-script error handling across the maintained source pipeline.
  - the import entrypoints now report concise argument and runtime errors without stack traces
  - `test/run-tests.js` now covers representative bad-argument paths for USPTO, obscenity, and cuss imports

- Expanded `severity` decision-matrix coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - missing severity falls back to category default
  - unknown severity falls back to category default
  - partial severity maps without `default` fall back to review

- Adopted selected documentation patterns from the local Node.js project template.
  - added [docs/GUARANTEES.md](/C:/code/nomsentry/docs/GUARANTEES.md)
  - added [docs/REPO_WORKFLOWS.md](/C:/code/nomsentry/docs/REPO_WORKFLOWS.md)
  - added [docs/STATUSQUO.md](/C:/code/nomsentry/docs/STATUSQUO.md)
  - added [docs/BASELINE_TEST_RUN.md](/C:/code/nomsentry/docs/BASELINE_TEST_RUN.md)
  - linked the new docs from [README.md](/C:/code/nomsentry/README.md)

- Added release-oriented documentation and persistent project context.
  - added [docs/NPM_RELEASE.md](/C:/code/nomsentry/docs/NPM_RELEASE.md)
  - added [docs/RELEASE_NOTES_TEMPLATE.md](/C:/code/nomsentry/docs/RELEASE_NOTES_TEMPLATE.md)
  - added [CODEX_CONTEXT.md](/C:/code/nomsentry/CODEX_CONTEXT.md)
  - added `pack:check` and `release:check` to [package.json](/C:/code/nomsentry/package.json)

- Recorded the curated catalog gap analysis in the persistent planning docs.
  - updated [TODO.md](/C:/code/nomsentry/TODO.md) with runtime-coverage gaps for `reservedTechnical`, `impersonation`, `protectedBrand`, `compositeRisk`, and compact-form normalization
  - updated [ROADMAP.md](/C:/code/nomsentry/ROADMAP.md) to sequence those gaps into the product-policy and quality tracks
  - updated [CODEX_CONTEXT.md](/C:/code/nomsentry/CODEX_CONTEXT.md) with the latest catalog-based coverage findings

- Added grouped category-level regression fixtures for the current maintained runtime baseline.
  - added [test/fixtures/catalog-maintained-positives.json](/C:/code/nomsentry/test/fixtures/catalog-maintained-positives.json)
  - added [test/fixtures/catalog-maintained-false-positives.json](/C:/code/nomsentry/test/fixtures/catalog-maintained-false-positives.json)
  - wired them into [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js)

- Defined the npm package boundary explicitly in [package.json](/C:/code/nomsentry/package.json).
  - added a `files` allowlist for the published tarball
  - removed the previous `.gitignore` fallback warning from `npm pack --dry-run`
  - made the published package surface explicit and reviewable through `npm run pack:check`

- Expanded direct source-schema edge-case coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - empty source-set validation
  - malformed compact tuple rejection
  - missing `ruleDefaults` values for compact rules
  - malformed composite-rule scopes
  - stored-artifact metadata pruning through `serializeSource()`

- Added repository CI in [ci.yml](/C:/code/nomsentry/.github/workflows/ci.yml).
  - runs on pushes to `main` and on pull requests
  - installs dependencies with `npm ci`
  - executes the existing local gate through `npm run ci:check`

- Expanded networked importer failure-path coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - LDNOOBW upstream HTTP failures and payload normalization
  - dsojevic upstream HTTP failures and JSON payload handling
  - insult.wiki upstream HTTP failures and malformed upstream markup

- Hardened the CLI command flow in [bin/nomsentry.js](/C:/code/nomsentry/bin/nomsentry.js).
  - Unknown commands are rejected before engine evaluation.
  - Unknown kinds are rejected before engine evaluation.
  - The CLI now returns stable exit codes for usage, validation, and runtime failures.

- Added direct CLI regression coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - usage handling
  - unknown command handling
  - unknown kind handling
  - valid `check` flow
  - valid `explain` flow with namespace override behavior

- Added automated docs consistency checks in [scripts/check-docs-consistency.js](/C:/code/nomsentry/scripts/check-docs-consistency.js).
  - wired into `npm run docs:check`
  - included in `npm run ci:check`

- Adopted selected repository conventions from the local Node.js template.
  - `.editorconfig`
  - `.gitattributes`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `engines.node`
  - `ci:check`

- Added runtime bundle compatibility validation in [src/loaders/runtime-bundle.js](/C:/code/nomsentry/src/loaders/runtime-bundle.js).
  - unsupported bundle versions now fail fast
  - broken table references now fail fast before evaluation

- Added negative runtime-bundle fixtures and regression coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - unsupported runtime bundle version
  - malformed runtime profile indexes

- Added deterministic runtime-bundle verification in [scripts/check-runtime-bundle-determinism.js](/C:/code/nomsentry/scripts/check-runtime-bundle-determinism.js).
  - wired into `npm run determinism:check`
  - included in `npm run ci:check`
  - reuses the same runtime-bundle builder as the main build path

- Added deterministic maintained-source verification in [scripts/check-maintained-sources-determinism.js](/C:/code/nomsentry/scripts/check-maintained-sources-determinism.js).
  - verifies the rebuilt `custom/sources/` file set and file contents are byte-stable
  - wired into `npm run determinism:check`
  - included in `npm run ci:check`
