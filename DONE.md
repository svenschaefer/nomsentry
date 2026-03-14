# DONE

## Completed recently

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
