# DONE

## Completed recently

- Expanded the maintained Wikidata-derived `protectedBrand` supplement and aligned USPTO/Wikidata brand thresholds.
  - updated Wikidata seed/evaluation inputs to include `bmw`, `sap`, and `mercedes`
  - expanded the accepted Wikidata-derived cohort so `bmw`, `sap`, and `mercedes` resolve to `review` in the default runtime
  - increased Wikidata search breadth from `limit=10` to `limit=50` to surface high-signal brand entities like `Mercedes-Benz` for ambiguous labels
  - lowered USPTO noise for short names by setting the derived one-word threshold to 5 characters
  - kept numeric short-brand non-goals such as `3m`, `7eleven`, `formula1`, and `playstation5` outside the maintained default profile

- Added first-class runtime helpers to the public package API.
  - `src/index.js` now exports `loadRuntimeBundle()` for default in-package runtime loading
  - `src/index.js` now exports one strict materialized `defaultPolicy` plus `defaultKind`
  - default evaluation no longer requires an explicit `kind` when `defaultPolicy` is used
  - CLI default flow now accepts value-only usage (`nomsentry check <value>` / `nomsentry explain <value>`) with optional `--kind`
  - package smoke validation now verifies the simplified default API path
  - public API contract fixtures now cover `defaultPolicy` and `loadRuntimeBundle`

- Published `nomsentry@1.0.0` to npm and aligned the CLI bin metadata.
  - package is now available on npm under the maintainer account
  - `package.json` `bin.nomsentry` is now `bin/nomsentry.js` (without `./`) to avoid npm auto-correction on publish
  - release tag `v1.0.0` remains pushed on `main`

- Reduced npm package payload to runtime-focused artifacts.
  - replaced `custom/sources/` in the npm `files` allowlist with [custom/sources/README.md](/custom/sources/README.md) in [package.json](/package.json)
  - the published tarball now keeps the `custom/sources` path discoverable without shipping maintained `custom/sources/*.json` artifacts
  - runtime artifacts continue to ship from `dist/`, while maintained source generation remains available through repository scripts
  - removed `docs/*.md`, `source-refresh-policy.json`, and `source-integrity-lock.json` from the npm package payload
  - package documentation in the tarball is now intentionally limited to `README.md` and `THIRD_PARTY_NOTICES.md`
  - validated via `npm run pack:check` and `npm run pack:smoke`

- Added release artifact attestation baseline checks and provenance-ready publish workflow.
  - added [.github/workflows/release-publish.yml](/.github/workflows/release-publish.yml) with `id-token: write` and `npm publish --provenance --access public`
  - added [scripts/check-release-attestation.js](/scripts/check-release-attestation.js)
  - added `npm run attestation:check` in [package.json](/package.json)
  - wired the attestation check into `npm run ci:check`
  - added regression coverage for release-attestation workflow evaluation and argument parsing

- Added upstream source-integrity capture and verification for non-package external sources.
  - added [source-integrity-lock.json](/source-integrity-lock.json)
  - added [scripts/source-integrity.js](/scripts/source-integrity.js)
  - added [scripts/capture-source-integrity.js](/scripts/capture-source-integrity.js)
  - added [scripts/check-source-integrity.js](/scripts/check-source-integrity.js)
  - added `npm run integrity:check` and `npm run integrity:capture` in [package.json](/package.json)
  - wired `npm run integrity:check` into the main local validation gate
  - extended [source-refresh-policy.json](/source-refresh-policy.json) with `requiresUpstreamIntegrity` flags for fetched non-package sources
  - extended [dist/build-manifest.json](/dist/build-manifest.json) to record the checked-in integrity-lock hash and attach captured upstream integrity metadata to covered source artifacts
  - added regression coverage for integrity target selection, lock validation, manifest integration, and gate evaluation

- Split the monolithic test entrypoint into focused suites while keeping the deterministic gate stable.
  - [test/run-tests.js](/test/run-tests.js) is now a small orchestrator
  - added [test/run-tests-fixtures.js](/test/run-tests-fixtures.js)
  - added [test/run-tests-scripts.js](/test/run-tests-scripts.js)
  - added [test/run-tests-normalization.js](/test/run-tests-normalization.js)
  - the suite remains compatible with `npm test`, `npm run coverage:check`, and the existing deterministic CI gates

- Added coverage thresholds for critical modules and a dedicated adversarial security-regression corpus.
  - added [coverage-thresholds.json](/coverage-thresholds.json)
  - added [scripts/check-coverage-thresholds.js](/scripts/check-coverage-thresholds.js)
  - added `npm run coverage:check` in [package.json](/package.json) and wired it into `ci:check`
  - added [test/fixtures/adversarial-security-regression.json](/test/fixtures/adversarial-security-regression.json)
  - [test/run-tests.js](/test/run-tests.js) now keeps a separate adversarial corpus for bypass-sensitive mixed-script, profanity, brand, and boundary cases

- Added packaged runtime-bundle compatibility regression coverage.
  - added [test/fixtures/runtime-bundle-compatible-v1.json](/test/fixtures/runtime-bundle-compatible-v1.json)
  - [test/run-tests.js](/test/run-tests.js) now asserts that the valid compatibility fixture remains loadable and executable by the engine
  - the runtime bundle integration surface now has both valid and invalid compatibility fixtures in the suite

- Added maintained runtime benchmark budgets and a regression gate.
  - added [benchmark-budget.json](/benchmark-budget.json)
  - added [scripts/check-runtime-benchmark-budget.js](/scripts/check-runtime-benchmark-budget.js)
  - added `npm run benchmark:check` in [package.json](/package.json) and wired it into `ci:check`
  - the repo now fails locally when maintained bundle-load, engine-creation, or evaluation-latency metrics exceed the accepted budget

- Added multi-platform CI validation and a dependency-security/SBOM baseline.
  - [/.github/workflows/ci.yml](/.github/workflows/ci.yml) now runs `npm run ci:check` on both Ubuntu and Windows
  - added [scripts/check-security-baseline.js](/scripts/check-security-baseline.js)
  - added `npm run security:check` in [package.json](/package.json) and wired it into `ci:check`
  - the repo now validates a production `npm audit --json --omit=dev` run and CycloneDX SBOM generation from the locked dependency graph

- Added packaged-artifact smoke validation and explicit public API/CLI contract coverage.
  - added [scripts/check-package-smoke.js](/scripts/check-package-smoke.js)
  - added `npm run pack:smoke` in [package.json](/package.json) and wired it into `release:check`
  - the release path now installs the packed tarball in a temporary directory, verifies the installed library surface, and smoke-tests the installed CLI
  - added [test/fixtures/public-api-contract.json](/test/fixtures/public-api-contract.json)
  - added explicit contract assertions in [test/run-tests.js](/test/run-tests.js) for `src/index.js` exports, builtin policy exports, CLI usage lines, and the top-level JSON shape of `explain`

- Fixed the general exact-technical-identifier normalization gap for Windows reserved device names.
  - added the `technicalExact` normalization projection in [src/core/normalize.js](/src/core/normalize.js)
  - switched [custom/sources/windows-reserved-device-names.json](/custom/sources/windows-reserved-device-names.json) to `technicalExact`
  - completed the maintained Windows device list with `clock$`
  - added direct regression coverage in [test/run-tests.js](/test/run-tests.js) so `clock$`, `com1`, and `lpt1` still reject while nearby non-reserved lookalikes such as `comi` and `lpti` stay `allow`
  - regenerated [dist/runtime-sources.json](/dist/runtime-sources.json) and [dist/build-manifest.json](/dist/build-manifest.json)

- Refined the curated identifier catalog into explicit maintained baseline, negative, and boundary layers.
  - expanded `catalog-maintained-positives` with more current-scope reserved, impersonation, profanity, composite, and brand cases
  - expanded current negative fixtures with additional nearby false positives from the reviewed catalog
  - replaced the old documented-gap fixture with `catalog-documented-non-goals-and-future-gaps.json` so the repo now separates current baseline from explicit non-goals and future-candidate coverage

- Completed the v0.5 `protectedBrand` calibration block and closed the remaining tracked policy work for this phase.
  - raised the maintained USPTO one-word threshold calibration from `>= 12` to `>= 11`, which now admits `playstation` without opening the default profile to numeric brand forms
  - expanded the maintained brand calibration corpus to explicit accepted review positives, ambiguity-prone allows, numeric and short-brand allows, long-tail official review positives, and brand-adjacent allow negatives
  - regenerated the maintained USPTO-derived source, runtime bundle, provenance manifest, and brand calibration report

- Added a reproducible combined brand-profile calibration report for the maintained USPTO plus Wikidata baseline.
  - added [scripts/evaluate-brand-profile.js](/scripts/evaluate-brand-profile.js)
  - added [test/fixtures/brand-profile-calibration.json](/test/fixtures/brand-profile-calibration.json)
  - added [docs/generated/brand-profile-calibration-report.json](/docs/generated/brand-profile-calibration-report.json)
  - the current maintained sample corpus reports `0` mismatches across accepted review positives, documented ambiguity-prone allows, documented numeric and short-brand allows, documented long-tail official review positives, and brand-adjacent allow negatives

- Closed the v0.5 `impersonation` and `compositeRisk` scope at the current conservative maintained baseline.
  - `impersonation` now explicitly accepts the current account-access and operator-facing default profile while leaving `verified`, `trust`, and `safety` as documented v0.5 non-goals
  - `compositeRisk` now explicitly accepts the current support/security-anchor default profile while leaving broader combinations such as `trust-safety`, `customer-recovery`, and `privacy-team` as documented v0.5 non-goals

- Closed the v0.5 `reservedTechnical` scope at the current conservative maintained baseline.
  - the accepted default baseline is now explicitly documented as Windows device names plus Windows URI schemes plus GitLab reserved routes plus ICANN reserved names plus filtered `reserved-usernames`
  - broader generic nouns such as `webhook`, `gateway`, `proxy`, `internal`, `private`, `public`, `service`, and `client` are now explicitly documented as non-goals for the maintained default profile

- Broadened the conservative `reserved-usernames` impersonation subset with the exact-token alias `payments`.
  - [src/importers/reserved-usernames-impersonation.js](/src/importers/reserved-usernames-impersonation.js) now adds only the conservative plural alias `payments` when the maintained token `payment` is present
  - [custom/sources/reserved-usernames-impersonation.json](/custom/sources/reserved-usernames-impersonation.json) and [dist/runtime-sources.json](/dist/runtime-sources.json) were regenerated
  - grouped maintained positive, obfuscated-positive, and documented-gap fixtures were updated so the remaining impersonation gap is narrowed to `verified`, `trust`, and `safety`

- Closed the v0.5 profanity-split scope for this phase by documenting the accepted maintained boundary at `generalProfanity`, `insult`, `slur`, `sexual`, and `shock`, with `extremism` explicitly deferred.

- Extended the profanity-category refinement with a source-backed `generalProfanity` category.
  - [src/importers/dsojevic-profanity.js](/src/importers/dsojevic-profanity.js) now maps `general` tagged entries from `dsojevic/profanity-list` to `generalProfanity`
  - [src/policies/username.js](/src/policies/username.js), [src/policies/tenantSlug.js](/src/policies/tenantSlug.js), and [src/policies/tenantName.js](/src/policies/tenantName.js) now carry explicit `generalProfanity` decisions
  - [custom/sources/dsojevic-profanity-en.json](/custom/sources/dsojevic-profanity-en.json) and [dist/runtime-sources.json](/dist/runtime-sources.json) were regenerated
  - the current refinement remains intentionally source-based, so overlapping terms can still surface both `profanity` and `generalProfanity` evidence until the broader category split is complete

- Broadened the conservative `reserved-usernames` impersonation subset with `payment` and `reset` forms.
  - [src/importers/reserved-usernames-impersonation.js](/src/importers/reserved-usernames-impersonation.js) now keeps additive exact-token terms `payment`, `reset`, and `reset-password`
  - [custom/sources/reserved-usernames-impersonation.json](/custom/sources/reserved-usernames-impersonation.json) was regenerated
  - [custom/sources/derived-composite-risk.json](/custom/sources/derived-composite-risk.json) was regenerated and now also covers additive combinations such as `payment-support` and `reset-security`
  - grouped maintained positive coverage was updated to reflect the narrower remaining impersonation gap

- Extended the profanity-category refinement with a source-backed `shock` category.
  - [src/importers/dsojevic-profanity.js](/src/importers/dsojevic-profanity.js) now maps `shock` tagged entries from `dsojevic/profanity-list` to `shock`
  - [src/policies/username.js](/src/policies/username.js), [src/policies/tenantSlug.js](/src/policies/tenantSlug.js), and [src/policies/tenantName.js](/src/policies/tenantName.js) now carry explicit `shock` decisions
  - [custom/sources/dsojevic-profanity-en.json](/custom/sources/dsojevic-profanity-en.json) and [dist/runtime-sources.json](/dist/runtime-sources.json) were regenerated
  - the current refinement remains intentionally source-based, so overlapping terms can still surface both `profanity` and `shock` evidence until the broader category split is complete

- Extended the profanity-category refinement with a source-backed `sexual` category.
  - [src/importers/dsojevic-profanity.js](/src/importers/dsojevic-profanity.js) now maps `sexual` tagged entries from `dsojevic/profanity-list` to `sexual`
  - [src/policies/username.js](/src/policies/username.js), [src/policies/tenantSlug.js](/src/policies/tenantSlug.js), and [src/policies/tenantName.js](/src/policies/tenantName.js) now carry explicit `sexual` decisions
  - [custom/sources/dsojevic-profanity-en.json](/custom/sources/dsojevic-profanity-en.json) and [dist/runtime-sources.json](/dist/runtime-sources.json) were regenerated
  - the current refinement remains intentionally source-based, so overlapping terms can still surface both `profanity` and `sexual` evidence until the broader category split is complete

- Added a conservative `reserved-usernames` impersonation import and widened the derived composite baseline.
  - added [src/importers/reserved-usernames-impersonation.js](/src/importers/reserved-usernames-impersonation.js)
  - added [scripts/import-reserved-usernames-impersonation.js](/scripts/import-reserved-usernames-impersonation.js)
  - added [custom/sources/reserved-usernames-impersonation.json](/custom/sources/reserved-usernames-impersonation.json)
  - the maintained impersonation baseline now includes additive exact-token terms `account`, `accounts`, `billing`, `official`, and `password`
  - [custom/sources/derived-composite-risk.json](/custom/sources/derived-composite-risk.json) was regenerated and now also covers additive combinations such as `billing-support`, `official-support`, and `password-security`
  - grouped maintained positive, obfuscated-positive, mixed-script, and documented-gap fixtures were updated to reflect the narrower remaining impersonation and composite gaps

- Broadened the conservative `reserved-usernames` technical subset with `settings`.
  - [src/importers/reserved-usernames.js](/src/importers/reserved-usernames.js) now treats `settings` as part of the maintained technical namespace-collision profile
  - [custom/sources/reserved-usernames.json](/custom/sources/reserved-usernames.json) and [dist/runtime-sources.json](/dist/runtime-sources.json) were regenerated
  - grouped maintained positive and nearby-negative fixture coverage now includes `settings` and `settingslab`

- Extended the profanity-category refinement with a source-backed `slur` category.
  - [src/importers/dsojevic-profanity.js](/src/importers/dsojevic-profanity.js) now maps `racial`, `religious`, and `lgbtq` tagged entries from `dsojevic/profanity-list` to `slur`
  - [src/policies/username.js](/src/policies/username.js), [src/policies/tenantSlug.js](/src/policies/tenantSlug.js), and [src/policies/tenantName.js](/src/policies/tenantName.js) now carry explicit `slur` decisions
  - [custom/sources/dsojevic-profanity-en.json](/custom/sources/dsojevic-profanity-en.json) and [dist/runtime-sources.json](/dist/runtime-sources.json) were regenerated
  - the current refinement remains intentionally source-based, so overlapping terms can still surface both `profanity` and `slur` evidence until the broader category split is complete

- Added conservative official GitHub Enterprise and ICANN reserved-name sources.
  - added [src/importers/github-reserved-usernames.js](/src/importers/github-reserved-usernames.js)
  - added [scripts/import-github-reserved-usernames.js](/scripts/import-github-reserved-usernames.js)
  - added [custom/sources/github-reserved-usernames.json](/custom/sources/github-reserved-usernames.json)
  - the maintained default impersonation baseline now includes the additive GitHub Enterprise reserved username `staff`
  - added [src/importers/icann-reserved-names.js](/src/importers/icann-reserved-names.js)
  - added [scripts/import-icann-reserved-names.js](/scripts/import-icann-reserved-names.js)
  - added [custom/sources/icann-reserved-names.json](/custom/sources/icann-reserved-names.json)
  - the maintained default reserved-technical baseline now includes the conservative ICANN .com subset `example`, `gtld-servers`, `iana`, `iana-servers`, `nic`, `rfc-editor`, `root-servers`, and `whois`
  - expanded maintained positive, nearby-negative, obfuscated-positive, and mixed-script fixture coverage for both new sources

- Started the profanity category refinement with an explicit `insult` category.
  - [src/importers/insult-wiki.js](/src/importers/insult-wiki.js) now maps `insult.wiki` to `insult` instead of the broad `profanity` bucket
  - [src/policies/username.js](/src/policies/username.js), [src/policies/tenantSlug.js](/src/policies/tenantSlug.js), and [src/policies/tenantName.js](/src/policies/tenantName.js) now carry explicit `insult` decisions
  - [custom/sources/insult-wiki-en.json](/custom/sources/insult-wiki-en.json) and [custom/sources/insult-wiki-de.json](/custom/sources/insult-wiki-de.json) were regenerated
  - the current refinement is intentionally source-based, so overlapping terms can still surface both `profanity` and `insult` evidence until the broader category split is complete

- Improved the USPTO-derived runtime term normalization by stripping legal-entity suffixes before structural thresholding.
  - [src/importers/uspto.js](/src/importers/uspto.js) now collapses terms such as `Harley Davidson Inc.` to `harley davidson` before applying the maintained structural filter
  - [custom/sources/derived-uspto-brand-risk.json](/custom/sources/derived-uspto-brand-risk.json) was regenerated with the improved filter-term derivation
  - [test/run-tests.js](/test/run-tests.js) now covers repeated suffix stripping and the resulting derived inclusion behavior

- Added conservative derived impersonation and composite-risk layers from the maintained source baseline.
  - added [src/importers/derived-impersonation.js](/src/importers/derived-impersonation.js)
  - added [src/importers/derived-composite-risk.js](/src/importers/derived-composite-risk.js)
  - added [scripts/derive-impersonation.js](/scripts/derive-impersonation.js)
  - added [scripts/derive-composite-risk.js](/scripts/derive-composite-risk.js)
  - added [custom/sources/derived-impersonation.json](/custom/sources/derived-impersonation.json)
  - added [custom/sources/derived-composite-risk.json](/custom/sources/derived-composite-risk.json)
  - the maintained default baseline now lifts conservative exact-token account-access identifiers such as `admin`, `administrator`, `help`, `login`, `oauth`, `profile`, `secure`, `sysadmin`, and `webmail` into `impersonation`
  - the maintained default baseline originally derived 26 exact-token composite rules such as `admin-support`, `admin-security`, `login-support`, `login-security`, `oauth-support`, and `profile-security`

- Expanded maintained `reservedTechnical` coverage with a conservative Windows reserved URI-scheme subset.
  - added [src/importers/windows-reserved-uri-schemes.js](/src/importers/windows-reserved-uri-schemes.js)
  - added [scripts/import-windows-reserved-uri-schemes.js](/scripts/import-windows-reserved-uri-schemes.js)
  - added [custom/sources/windows-reserved-uri-schemes.json](/custom/sources/windows-reserved-uri-schemes.json)
  - added maintained positive and nearby-negative coverage for the new Microsoft Learn source in [test/run-tests.js](/test/run-tests.js) and the grouped maintained fixtures

- Implemented the conservative Wikidata-derived uncovered-brand supplement.
  - added [src/importers/wikidata-brand-risk.js](/src/importers/wikidata-brand-risk.js)
  - added [scripts/derive-wikidata-brand-risk.js](/scripts/derive-wikidata-brand-risk.js)
  - added [custom/sources/derived-wikidata-brand-risk.json](/custom/sources/derived-wikidata-brand-risk.json)
  - added `npm run derive:wikidata-brand-risk` in [package.json](/package.json)
  - the maintained default brand profile now includes `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, and `mastercard` from the conservative Wikidata-derived layer
  - ambiguity-prone terms such as `visa`, `amazon`, and `apple` remain intentionally excluded from the maintained default profile

- Added lightweight JSDoc and TypeScript-based shape checking for schema-heavy runtime surfaces.
  - added [tsconfig.typecheck.json](/tsconfig.typecheck.json)
  - added `npm run typecheck` in [package.json](/package.json) and wired it into `ci:check`
  - added [src/types.js](/src/types.js) for shared compact source and runtime-bundle typedefs
  - enabled checked JSDoc coverage for [src/schema/source-format.js](/src/schema/source-format.js), [src/schema/validate-source.js](/src/schema/validate-source.js), and [src/loaders/runtime-bundle.js](/src/loaders/runtime-bundle.js)

- Closed the broader matrix and normalization-fuzz coverage block.
  - added [test/fixtures/catalog-maintained-true-negatives.json](/test/fixtures/catalog-maintained-true-negatives.json)
  - expanded the grouped maintained matrix to cover explicit TP, FP, TN, and documented FN suites
  - added a seeded fuzz-style normalization corpus in [test/run-tests.js](/test/run-tests.js) across separators, invisibles, case mixing, NFD forms, supported leetspeak, supported confusables, and fullwidth ASCII variants

- Defined and tested the current compact-form normalization contract.
  - added [docs/NORMALIZATION_CONTRACT.md](/docs/NORMALIZATION_CONTRACT.md)
  - added [test/fixtures/catalog-maintained-compact-contract.json](/test/fixtures/catalog-maintained-compact-contract.json)
  - the maintained matrix now distinguishes supported compact-preserving variants from unsupported consonant-dropping shorthand such as `fck`, `pwdrst`, `acctrcvry`, `vrfd`, `srvr`, `admn`, and `arschlch`

- Hardened USPTO artifact rewrite paths and closed the remaining import partial-write coverage gap.
  - [scripts/import-uspto-trademarks.js](/scripts/import-uspto-trademarks.js) now replaces the chunk set through a staged swap instead of delete-first writes
  - [scripts/derive-uspto-brand-risk.js](/scripts/derive-uspto-brand-risk.js) now preserves the current single derived artifact and only cleans up legacy chunked outputs after a successful write
  - both USPTO scripts now use proper CLI entrypoint guards so their helpers can be imported safely in tests
  - [test/run-tests.js](/test/run-tests.js) now covers successful staged replacement, rollback after staged-swap failure, and legacy derived-chunk cleanup behavior

- Expanded the maintained TP/FP/TN matrix further around the reviewed identifier catalog.
  - broadened maintained `reservedTechnical` positives for the filtered `reserved-usernames` baseline, including `auth`, `cache`, `dns`, `smtp`, `ssh`, `wpad`, `xml`, `oauth`, `openid`, `logout`, and `profile`
  - broadened nearby `reservedTechnical` negatives such as `hosted`, `webview`, `wikipedia`, `mailer`, `mailbox`, `oauthify`, `xmlish`, `statuspage`, `hostmastery`, and `serverless`
  - broadened maintained obfuscated positives for reserved-technical and impersonation terms, including dotted or underscored variants of `oauth`, `openid`, `smtp`, `ssh`, `wpad`, `cache`, `dns`, and `support`
  - broadened maintained mixed-script lexical positives for `ssh`, `oauth`, `xml`, `webmaster`, and `server`

- Added a reproducible Wikidata uncovered-brand evaluation path.
  - added [scripts/evaluate-wikidata-brand-supplement.js](/scripts/evaluate-wikidata-brand-supplement.js)
  - added [docs/generated/wikidata-brand-gap-report.json](/docs/generated/wikidata-brand-gap-report.json)
  - added `npm run evaluate:wikidata-brands` in [package.json](/package.json)
  - the evaluator now derives runtime-facing terms without legal suffixes, so pages such as `Visa Inc.` or `Apple Inc.` map to `visa` and `apple`

- Expanded maintained `reservedTechnical` coverage with a conservative `reserved-usernames` import.
  - added [src/importers/reserved-usernames.js](/src/importers/reserved-usernames.js)
  - added [scripts/import-reserved-usernames.js](/scripts/import-reserved-usernames.js)
  - added [custom/sources/reserved-usernames.json](/custom/sources/reserved-usernames.json)
  - expanded maintained fixture coverage so `root`, `system`, `mail`, and `status` are now part of the maintained positive baseline

- Expanded normalization property coverage and artifact-failure cleanup coverage further.
  - added more generated confusable-heavy normalization variants in [test/run-tests.js](/test/run-tests.js)
  - added upstream transport and parse-failure coverage for dsojevic, insult.wiki, and GitLab import fetch paths
  - added cleanup coverage for `writeTextFileAtomic()` when write or rename fails after temp-file creation

- Added linting and formatting checks for human-maintained files.
  - added [eslint.config.js](/eslint.config.js)
  - added [.prettierignore](/.prettierignore)
  - added [.prettierrc.json](/.prettierrc.json)
  - added `lint:check` and `format:check` in [package.json](/package.json)
  - wired both checks into `ci:check`
  - fixed the latent syntax bug in [scripts/import-insult-wiki.js](/scripts/import-insult-wiki.js) that the new lint gate surfaced

- Added a documented downstream source-extension policy and a downstream bundle CLI path.
  - added [docs/SOURCE_EXTENSION_POLICY.md](/docs/SOURCE_EXTENSION_POLICY.md)
  - [bin/nomsentry.js](/bin/nomsentry.js) now accepts `--bundle <path>` so downstream compiled bundles can be validated without editing the maintained runtime artifact
  - added CLI regression coverage for the alternate-bundle path in [test/run-tests.js](/test/run-tests.js)

- Expanded the grouped maintained-runtime regression matrix further.
  - added more GitLab reserved-route and RFC 2142 positives in the maintained baseline fixtures
  - added maintained `protectedBrand` positives from the current USPTO-derived subset
  - expanded mixed-script fallback review fixtures for uncovered-brand lookalikes
  - expanded nearby false-positive coverage for impersonation, reserved-technical, and brand-adjacent negatives
  - broadened the explicit documented uncovered-brand gap fixture set

- Evaluated Wikidata as a `protectedBrand` supplement source for uncovered brands.
  - added [docs/WIKIDATA_BRAND_EVALUATION.md](/docs/WIKIDATA_BRAND_EVALUATION.md)
  - the original gap evaluation confirmed that the official-only derived USPTO runtime still allowed representative globally recognizable brands such as `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, `visa`, `mastercard`, `amazon`, and `apple`
  - confirmed that Wikidata has clean candidate item pages for the main uncovered-brand examples
  - documented the ambiguity risk for pages behind `visa`, `amazon`, and `apple`

- Expanded the deterministic normalization property corpus.
  - [test/run-tests.js](/test/run-tests.js) now covers broader generated normalization variants across case-mixing, NFD forms, fullwidth ASCII, separator-heavy forms, and supported confusable substitutions
  - the added corpus distinguishes `compact`-preserving variants from stricter `slug`-preserving variants so the tests match the actual normalization contract

- Expanded the grouped maintained-runtime regression matrix.
  - [test/fixtures/catalog-maintained-obfuscated-positives.json](/test/fixtures/catalog-maintained-obfuscated-positives.json) now covers more separator, leetspeak, and compact obfuscation variants
  - [test/fixtures/catalog-maintained-mixed-script.json](/test/fixtures/catalog-maintained-mixed-script.json) now covers more mixed-script fallback review examples
  - [test/fixtures/catalog-maintained-false-positives.json](/test/fixtures/catalog-maintained-false-positives.json) now covers more nearby negatives from the reviewed catalog

- Expanded destructive-script safeguard coverage for `compact-sources`.
  - [scripts/compact-sources.js](/scripts/compact-sources.js) now supports injected filesystem behavior for failure simulation in tests
  - [test/run-tests.js](/test/run-tests.js) now covers rollback after a staged swap failure and verifies restoration of the original source directory

- Enriched the build provenance manifest with deterministic transform and refresh metadata.
  - [dist/build-manifest.json](/dist/build-manifest.json) now records deterministic transform versions per maintained artifact
  - the manifest now carries matched refresh-policy metadata per maintained artifact
  - package-derived maintained sources now record their exact upstream versions from [package-lock.json](/package-lock.json)
  - the manifest now records the hashes of its deterministic provenance inputs
  - [test/run-tests.js](/test/run-tests.js) now asserts the enriched manifest schema directly

- Added a lightweight runtime benchmark harness.
  - added [scripts/benchmark-runtime.js](/scripts/benchmark-runtime.js)
  - added `npm run benchmark:runtime` in [package.json](/package.json)
  - benchmark coverage includes runtime-bundle load time, engine creation time, and evaluation latency over maintained fixture inputs
  - added direct benchmark argument and summary coverage in [test/run-tests.js](/test/run-tests.js)

- Replaced the linear runtime matcher with a prebuilt indexed matcher.
  - [src/core/matchers.js](/src/core/matchers.js) now builds and queries a rule index keyed by scope, normalization field, match type, and token candidates
  - [src/core/evaluate.js](/src/core/evaluate.js) now compiles the index once at engine creation time
  - added direct regression coverage for indexed concatenated-token and multi-token sequence matching in [test/run-tests.js](/test/run-tests.js)

- Added a source refresh policy and staleness gate.
  - added [source-refresh-policy.json](/source-refresh-policy.json)
  - added [scripts/check-source-freshness.js](/scripts/check-source-freshness.js)
  - wired `npm run freshness:check` into [package.json](/package.json) and [ci:check](/package.json)
  - added direct refresh-policy and staleness-assessment coverage in [test/run-tests.js](/test/run-tests.js)
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
  - added [scripts/build-provenance-manifest.js](/scripts/build-provenance-manifest.js)
  - [scripts/build-runtime-sources.js](/scripts/build-runtime-sources.js) now writes [dist/build-manifest.json](/dist/build-manifest.json)
  - [scripts/check-runtime-bundle-determinism.js](/scripts/check-runtime-bundle-determinism.js) now verifies the manifest alongside the runtime bundle
  - [test/run-tests.js](/test/run-tests.js) now checks the manifest structure and atomic write path

- Expanded maintained `reservedTechnical` coverage with a conservative GitLab source import.
  - added [src/importers/gitlab-reserved-names.js](/src/importers/gitlab-reserved-names.js)
  - added [scripts/import-gitlab-reserved-names.js](/scripts/import-gitlab-reserved-names.js)
  - added [custom/sources/gitlab-reserved-names.json](/custom/sources/gitlab-reserved-names.json)
  - rebuilt [dist/runtime-sources.json](/dist/runtime-sources.json)

- Expanded regression coverage for the new GitLab reserved-name path.
  - parser coverage for conservative Markdown extraction
  - fetch-failure and fetch-success coverage for the GitLab import path
  - baseline fixture coverage for maintained reserved-technical positives and nearby false positives

- Expanded the grouped catalog-based quality matrix around the maintained runtime baseline.
  - added maintained-only grouped fixtures for obfuscated positives and mixed-script positives
  - added a grouped fixture for documented current coverage gaps so expected misses stay explicit
  - stopped routing grouped catalog fixtures through the synthetic helper source set

- Added basic generated normalization property coverage in [test/run-tests.js](/test/run-tests.js).
  - idempotence checks for `latinFolded`, `compact`, and `slug`
  - generated invisible-character invariants
  - generated separator-variant invariants

- Added in-suite determinism coverage for maintained source generation.
  - directory loading order is now tested explicitly
  - repeated compaction of unchanged source inputs is now tested for byte-stable output

- Made maintained-source and runtime-bundle writes crash-safer.
  - [src/schema/source-io.js](/src/schema/source-io.js) now writes files atomically through temporary files plus rename.
  - [scripts/build-runtime-sources.js](/scripts/build-runtime-sources.js) now uses the same atomic write path for `dist/runtime-sources.json`.
  - [scripts/compact-sources.js](/scripts/compact-sources.js) now stages rewritten source files in a temporary directory and swaps them into place only after success.

- Added regression coverage for artifact-generation safeguards in [test/run-tests.js](/test/run-tests.js).
  - atomic source-file writes
  - atomic runtime-bundle writes
  - `compact-sources` stage/swap behavior
  - stable `insult.wiki` filename mapping during source compaction

- Added destructive-script guardrails to [scripts/compact-sources.js](/scripts/compact-sources.js).
  - refuses empty source sets
  - refuses to replace source directories containing unexpected non-JSON entries
  - covered by dedicated regression tests in [test/run-tests.js](/test/run-tests.js)

- Hardened import-script error handling across the maintained source pipeline.
  - the import entrypoints now report concise argument and runtime errors without stack traces
  - `test/run-tests.js` now covers representative bad-argument paths for USPTO, obscenity, and cuss imports

- Expanded `severity` decision-matrix coverage in [test/run-tests.js](/test/run-tests.js).
  - missing severity falls back to category default
  - unknown severity falls back to category default
  - partial severity maps without `default` fall back to review

- Adopted selected documentation patterns from the local Node.js project template.
  - added [docs/GUARANTEES.md](/docs/GUARANTEES.md)
  - added [docs/REPO_WORKFLOWS.md](/docs/REPO_WORKFLOWS.md)
  - added [docs/STATUSQUO.md](/docs/STATUSQUO.md)
  - added [docs/BASELINE_TEST_RUN.md](/docs/BASELINE_TEST_RUN.md)
  - linked the new docs from [README.md](/README.md)

- Added release-oriented documentation and persistent project context.
  - added [docs/NPM_RELEASE.md](/docs/NPM_RELEASE.md)
  - added [docs/RELEASE_NOTES_TEMPLATE.md](/docs/RELEASE_NOTES_TEMPLATE.md)
  - added [CODEX_CONTEXT.md](/CODEX_CONTEXT.md)
  - added `pack:check` and `release:check` to [package.json](/package.json)

- Recorded the curated catalog gap analysis in the persistent planning docs.
  - updated [TODO.md](/TODO.md) with runtime-coverage gaps for `reservedTechnical`, `impersonation`, `protectedBrand`, `compositeRisk`, and compact-form normalization
  - updated [ROADMAP.md](/ROADMAP.md) to sequence those gaps into the product-policy and quality tracks
  - updated [CODEX_CONTEXT.md](/CODEX_CONTEXT.md) with the latest catalog-based coverage findings

- Added grouped category-level regression fixtures for the current maintained runtime baseline.
  - added [test/fixtures/catalog-maintained-positives.json](/test/fixtures/catalog-maintained-positives.json)
  - added [test/fixtures/catalog-maintained-false-positives.json](/test/fixtures/catalog-maintained-false-positives.json)
  - wired them into [test/run-tests.js](/test/run-tests.js)

- Defined the npm package boundary explicitly in [package.json](/package.json).
  - added a `files` allowlist for the published tarball
  - removed the previous `.gitignore` fallback warning from `npm pack --dry-run`
  - made the published package surface explicit and reviewable through `npm run pack:check`

- Expanded direct source-schema edge-case coverage in [test/run-tests.js](/test/run-tests.js).
  - empty source-set validation
  - malformed compact tuple rejection
  - missing `ruleDefaults` values for compact rules
  - malformed composite-rule scopes
  - stored-artifact metadata pruning through `serializeSource()`

- Added repository CI in [ci.yml](/.github/workflows/ci.yml).
  - runs on pushes to `main` and on pull requests
  - installs dependencies with `npm ci`
  - executes the existing local gate through `npm run ci:check`

- Expanded networked importer failure-path coverage in [test/run-tests.js](/test/run-tests.js).
  - LDNOOBW upstream HTTP failures and payload normalization
  - dsojevic upstream HTTP failures and JSON payload handling
  - insult.wiki upstream HTTP failures and malformed upstream markup

- Hardened the CLI command flow in [bin/nomsentry.js](/bin/nomsentry.js).
  - Unknown commands are rejected before engine evaluation.
  - Unknown kinds are rejected before engine evaluation.
  - The CLI now returns stable exit codes for usage, validation, and runtime failures.

- Added direct CLI regression coverage in [test/run-tests.js](/test/run-tests.js).
  - usage handling
  - unknown command handling
  - unknown kind handling
  - valid `check` flow
  - valid `explain` flow with namespace override behavior

- Added automated docs consistency checks in [scripts/check-docs-consistency.js](/scripts/check-docs-consistency.js).
  - wired into `npm run docs:check`
  - included in `npm run ci:check`

- Adopted selected repository conventions from the local Node.js template.
  - `.editorconfig`
  - `.gitattributes`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `engines.node`
  - `ci:check`

- Added runtime bundle compatibility validation in [src/loaders/runtime-bundle.js](/src/loaders/runtime-bundle.js).
  - unsupported bundle versions now fail fast
  - broken table references now fail fast before evaluation

- Added negative runtime-bundle fixtures and regression coverage in [test/run-tests.js](/test/run-tests.js).
  - unsupported runtime bundle version
  - malformed runtime profile indexes

- Added deterministic runtime-bundle verification in [scripts/check-runtime-bundle-determinism.js](/scripts/check-runtime-bundle-determinism.js).
  - wired into `npm run determinism:check`
  - included in `npm run ci:check`
  - reuses the same runtime-bundle builder as the main build path

- Added deterministic maintained-source verification in [scripts/check-maintained-sources-determinism.js](/scripts/check-maintained-sources-determinism.js).
  - verifies the rebuilt `custom/sources/` file set and file contents are byte-stable
  - wired into `npm run determinism:check`
  - included in `npm run ci:check`
