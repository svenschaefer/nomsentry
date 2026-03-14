# DONE

## Completed recently

- Added conservative official GitHub Enterprise and ICANN reserved-name sources.
  - added [src/importers/github-reserved-usernames.js](/C:/code/nomsentry/src/importers/github-reserved-usernames.js)
  - added [scripts/import-github-reserved-usernames.js](/C:/code/nomsentry/scripts/import-github-reserved-usernames.js)
  - added [custom/sources/github-reserved-usernames.json](/C:/code/nomsentry/custom/sources/github-reserved-usernames.json)
  - the maintained default impersonation baseline now includes the additive GitHub Enterprise reserved username `staff`
  - added [src/importers/icann-reserved-names.js](/C:/code/nomsentry/src/importers/icann-reserved-names.js)
  - added [scripts/import-icann-reserved-names.js](/C:/code/nomsentry/scripts/import-icann-reserved-names.js)
  - added [custom/sources/icann-reserved-names.json](/C:/code/nomsentry/custom/sources/icann-reserved-names.json)
  - the maintained default reserved-technical baseline now includes the conservative ICANN .com subset `example`, `gtld-servers`, `iana`, `iana-servers`, `nic`, `rfc-editor`, `root-servers`, and `whois`
  - expanded maintained positive, nearby-negative, obfuscated-positive, and mixed-script fixture coverage for both new sources

- Started the profanity category refinement with an explicit `insult` category.
  - [src/importers/insult-wiki.js](/C:/code/nomsentry/src/importers/insult-wiki.js) now maps `insult.wiki` to `insult` instead of the broad `profanity` bucket
  - [src/policies/username.js](/C:/code/nomsentry/src/policies/username.js), [src/policies/tenantSlug.js](/C:/code/nomsentry/src/policies/tenantSlug.js), and [src/policies/tenantName.js](/C:/code/nomsentry/src/policies/tenantName.js) now carry explicit `insult` decisions
  - [custom/sources/insult-wiki-en.json](/C:/code/nomsentry/custom/sources/insult-wiki-en.json) and [custom/sources/insult-wiki-de.json](/C:/code/nomsentry/custom/sources/insult-wiki-de.json) were regenerated
  - the current refinement is intentionally source-based, so overlapping terms can still surface both `profanity` and `insult` evidence until the broader category split is complete

- Improved the USPTO-derived runtime term normalization by stripping legal-entity suffixes before structural thresholding.
  - [src/importers/uspto.js](/C:/code/nomsentry/src/importers/uspto.js) now collapses terms such as `Harley Davidson Inc.` to `harley davidson` before applying the maintained structural filter
  - [custom/sources/derived-uspto-brand-risk.json](/C:/code/nomsentry/custom/sources/derived-uspto-brand-risk.json) was regenerated with the improved filter-term derivation
  - [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js) now covers repeated suffix stripping and the resulting derived inclusion behavior

- Added conservative derived impersonation and composite-risk layers from the maintained source baseline.
  - added [src/importers/derived-impersonation.js](/C:/code/nomsentry/src/importers/derived-impersonation.js)
  - added [src/importers/derived-composite-risk.js](/C:/code/nomsentry/src/importers/derived-composite-risk.js)
  - added [scripts/derive-impersonation.js](/C:/code/nomsentry/scripts/derive-impersonation.js)
  - added [scripts/derive-composite-risk.js](/C:/code/nomsentry/scripts/derive-composite-risk.js)
  - added [custom/sources/derived-impersonation.json](/C:/code/nomsentry/custom/sources/derived-impersonation.json)
  - added [custom/sources/derived-composite-risk.json](/C:/code/nomsentry/custom/sources/derived-composite-risk.json)
  - the maintained default baseline now lifts conservative exact-token account-access identifiers such as `admin`, `administrator`, `help`, `login`, `oauth`, `profile`, `secure`, `sysadmin`, and `webmail` into `impersonation`
  - the maintained default baseline now derives 26 exact-token composite rules such as `admin-support`, `admin-security`, `login-support`, `login-security`, `oauth-support`, and `profile-security`

- Expanded maintained `reservedTechnical` coverage with a conservative Windows reserved URI-scheme subset.
  - added [src/importers/windows-reserved-uri-schemes.js](/C:/code/nomsentry/src/importers/windows-reserved-uri-schemes.js)
  - added [scripts/import-windows-reserved-uri-schemes.js](/C:/code/nomsentry/scripts/import-windows-reserved-uri-schemes.js)
  - added [custom/sources/windows-reserved-uri-schemes.json](/C:/code/nomsentry/custom/sources/windows-reserved-uri-schemes.json)
  - added maintained positive and nearby-negative coverage for the new Microsoft Learn source in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js) and the grouped maintained fixtures

- Implemented the conservative Wikidata-derived uncovered-brand supplement.
  - added [src/importers/wikidata-brand-risk.js](/C:/code/nomsentry/src/importers/wikidata-brand-risk.js)
  - added [scripts/derive-wikidata-brand-risk.js](/C:/code/nomsentry/scripts/derive-wikidata-brand-risk.js)
  - added [custom/sources/derived-wikidata-brand-risk.json](/C:/code/nomsentry/custom/sources/derived-wikidata-brand-risk.json)
  - added `npm run derive:wikidata-brand-risk` in [package.json](/C:/code/nomsentry/package.json)
  - the maintained default brand profile now includes `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, and `mastercard` from the conservative Wikidata-derived layer
  - ambiguity-prone terms such as `visa`, `amazon`, and `apple` remain intentionally excluded from the maintained default profile

- Added lightweight JSDoc and TypeScript-based shape checking for schema-heavy runtime surfaces.
  - added [tsconfig.typecheck.json](/C:/code/nomsentry/tsconfig.typecheck.json)
  - added `npm run typecheck` in [package.json](/C:/code/nomsentry/package.json) and wired it into `ci:check`
  - added [src/types.js](/C:/code/nomsentry/src/types.js) for shared compact source and runtime-bundle typedefs
  - enabled checked JSDoc coverage for [src/schema/source-format.js](/C:/code/nomsentry/src/schema/source-format.js), [src/schema/validate-source.js](/C:/code/nomsentry/src/schema/validate-source.js), and [src/loaders/runtime-bundle.js](/C:/code/nomsentry/src/loaders/runtime-bundle.js)

- Closed the broader matrix and normalization-fuzz coverage block.
  - added [test/fixtures/catalog-maintained-true-negatives.json](/C:/code/nomsentry/test/fixtures/catalog-maintained-true-negatives.json)
  - expanded the grouped maintained matrix to cover explicit TP, FP, TN, and documented FN suites
  - added a seeded fuzz-style normalization corpus in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js) across separators, invisibles, case mixing, NFD forms, supported leetspeak, supported confusables, and fullwidth ASCII variants

- Defined and tested the current compact-form normalization contract.
  - added [docs/NORMALIZATION_CONTRACT.md](/C:/code/nomsentry/docs/NORMALIZATION_CONTRACT.md)
  - added [test/fixtures/catalog-maintained-compact-contract.json](/C:/code/nomsentry/test/fixtures/catalog-maintained-compact-contract.json)
  - the maintained matrix now distinguishes supported compact-preserving variants from unsupported consonant-dropping shorthand such as `fck`, `pwdrst`, `acctrcvry`, `vrfd`, `srvr`, `admn`, and `arschlch`

- Hardened USPTO artifact rewrite paths and closed the remaining import partial-write coverage gap.
  - [scripts/import-uspto-trademarks.js](/C:/code/nomsentry/scripts/import-uspto-trademarks.js) now replaces the chunk set through a staged swap instead of delete-first writes
  - [scripts/derive-uspto-brand-risk.js](/C:/code/nomsentry/scripts/derive-uspto-brand-risk.js) now preserves the current single derived artifact and only cleans up legacy chunked outputs after a successful write
  - both USPTO scripts now use proper CLI entrypoint guards so their helpers can be imported safely in tests
  - [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js) now covers successful staged replacement, rollback after staged-swap failure, and legacy derived-chunk cleanup behavior

- Expanded the maintained TP/FP/TN matrix further around the reviewed identifier catalog.
  - broadened maintained `reservedTechnical` positives for the filtered `reserved-usernames` baseline, including `auth`, `cache`, `dns`, `smtp`, `ssh`, `wpad`, `xml`, `oauth`, `openid`, `logout`, and `profile`
  - broadened nearby `reservedTechnical` negatives such as `hosted`, `webview`, `wikipedia`, `mailer`, `mailbox`, `oauthify`, `xmlish`, `statuspage`, `hostmastery`, and `serverless`
  - broadened maintained obfuscated positives for reserved-technical and impersonation terms, including dotted or underscored variants of `oauth`, `openid`, `smtp`, `ssh`, `wpad`, `cache`, `dns`, and `support`
  - broadened maintained mixed-script lexical positives for `ssh`, `oauth`, `xml`, `webmaster`, and `server`

- Added a reproducible Wikidata uncovered-brand evaluation path.
  - added [scripts/evaluate-wikidata-brand-supplement.js](/C:/code/nomsentry/scripts/evaluate-wikidata-brand-supplement.js)
  - added [docs/generated/wikidata-brand-gap-report.json](/C:/code/nomsentry/docs/generated/wikidata-brand-gap-report.json)
  - added `npm run evaluate:wikidata-brands` in [package.json](/C:/code/nomsentry/package.json)
  - the evaluator now derives runtime-facing terms without legal suffixes, so pages such as `Visa Inc.` or `Apple Inc.` map to `visa` and `apple`

- Expanded maintained `reservedTechnical` coverage with a conservative `reserved-usernames` import.
  - added [src/importers/reserved-usernames.js](/C:/code/nomsentry/src/importers/reserved-usernames.js)
  - added [scripts/import-reserved-usernames.js](/C:/code/nomsentry/scripts/import-reserved-usernames.js)
  - added [custom/sources/reserved-usernames.json](/C:/code/nomsentry/custom/sources/reserved-usernames.json)
  - expanded maintained fixture coverage so `root`, `system`, `mail`, and `status` are now part of the maintained positive baseline

- Expanded normalization property coverage and artifact-failure cleanup coverage further.
  - added more generated confusable-heavy normalization variants in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js)
  - added upstream transport and parse-failure coverage for dsojevic, insult.wiki, and GitLab import fetch paths
  - added cleanup coverage for `writeTextFileAtomic()` when write or rename fails after temp-file creation

- Added linting and formatting checks for human-maintained files.
  - added [eslint.config.js](/C:/code/nomsentry/eslint.config.js)
  - added [.prettierignore](/C:/code/nomsentry/.prettierignore)
  - added [.prettierrc.json](/C:/code/nomsentry/.prettierrc.json)
  - added `lint:check` and `format:check` in [package.json](/C:/code/nomsentry/package.json)
  - wired both checks into `ci:check`
  - fixed the latent syntax bug in [scripts/import-insult-wiki.js](/C:/code/nomsentry/scripts/import-insult-wiki.js) that the new lint gate surfaced

- Added a documented downstream source-extension policy and a downstream bundle CLI path.
  - added [docs/SOURCE_EXTENSION_POLICY.md](/C:/code/nomsentry/docs/SOURCE_EXTENSION_POLICY.md)
  - [bin/nomsentry.js](/C:/code/nomsentry/bin/nomsentry.js) now accepts `--bundle <path>` so downstream compiled bundles can be validated without editing the maintained runtime artifact
  - added CLI regression coverage for the alternate-bundle path in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js)

- Expanded the grouped maintained-runtime regression matrix further.
  - added more GitLab reserved-route and RFC 2142 positives in the maintained baseline fixtures
  - added maintained `protectedBrand` positives from the current USPTO-derived subset
  - expanded mixed-script fallback review fixtures for uncovered-brand lookalikes
  - expanded nearby false-positive coverage for impersonation, reserved-technical, and brand-adjacent negatives
  - broadened the explicit documented uncovered-brand gap fixture set

- Evaluated Wikidata as a `protectedBrand` supplement source for uncovered brands.
  - added [docs/WIKIDATA_BRAND_EVALUATION.md](/C:/code/nomsentry/docs/WIKIDATA_BRAND_EVALUATION.md)
  - the original gap evaluation confirmed that the official-only derived USPTO runtime still allowed representative globally recognizable brands such as `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, `visa`, `mastercard`, `amazon`, and `apple`
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
