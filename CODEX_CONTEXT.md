# Codex Context

## Project identity

- Name: `nomsentry`
- Type: deterministic identifier policy and deception detection engine
- Primary interfaces:
  - `nomsentry` CLI
  - library/runtime evaluation through the source and runtime-bundle pipeline

## Authoritative artifact model

- Maintained source artifacts live in `custom/sources/`.
- The compiled runtime artifact lives in `dist/runtime-sources.json`.
- The machine-readable provenance manifest lives in `dist/build-manifest.json`.
- The deterministic source refresh policy lives in `source-refresh-policy.json`.
- Local full USPTO imports live under `data/uspto/full-sources/` and are intentionally ignored by git.
- The CLI should validate against the compiled runtime bundle, not scan `custom/sources/` directly.

## Maintained source strategy

- No self-maintained built-in rule packs in the repository default source set
- Maintained sources are limited to imported or extracted third-party and normative artifacts
- Current maintained source families:
  - official register or standards sources
    - USPTO Trademark Bulk Data
    - RFC 2142 role mailbox names
    - GitLab reserved project and group names
    - Microsoft Windows reserved device names
  - direct wordlist or lexicon sources
    - LDNOOBW
    - insult.wiki
    - words/cuss
    - dsojevic/profanity-list
  - library-backed imported datasets
    - @2toad/profanity
    - obscenity

## Source strategy constraints

- `protectedBrand` should only be fed from ingestible official trademark sources.
- WIPO is intentionally not part of the ingest strategy.
- `words/profanities` is intentionally excluded from the default maintained source set because of high-noise generic terms.
- RFC 2142 currently feeds `impersonation`, not `reservedTechnical`.
- `reservedTechnical` currently draws from Windows reserved device names plus a conservative GitLab reserved-routes import.

## Runtime and build guarantees

- Maintained source rewrites use stage-and-swap or atomic write paths.
- Runtime bundle writes use atomic write paths.
- The runtime build step emits a deterministic provenance manifest for maintained source artifacts and the runtime bundle.
- The provenance manifest now includes deterministic transform versions, refresh-policy linkage, and package-lock-backed upstream versions for package-derived maintained sources.
- Source freshness is checked against git commit dates plus the deterministic refresh policy file.
- Runtime rule matching now uses a prebuilt index instead of a per-request full scan.
- A lightweight runtime benchmark harness exists for bundle load, engine creation, and evaluation latency over maintained fixture inputs.
- `npm run determinism:check` validates both maintained source determinism and runtime-bundle determinism.
- `npm run ci:check` is the main local validation gate.

## Test-model notes

- Grouped catalog fixtures should use the maintained source baseline, not the synthetic helper source set.
- Synthetic helper sources are still valid for focused engine and policy tests, but they must not be used to overstate maintained runtime coverage.
- The grouped maintained-runtime matrix now covers a broader slice of the reviewed catalog for obfuscated positives, mixed-script fallback reviews, and nearby false positives, but it is still not the full reviewed catalog.
- Normalization tests now include deterministic generated property coverage for idempotence, invisibles, separator-heavy variants, case-mixed and NFD forms, fullwidth ASCII forms, and supported confusable substitutions, but they still do not constitute full fuzzing.
- Determinism is now covered both by standalone check scripts and by direct in-suite tests for loader ordering and byte-stable maintained-source recompaction.
- Direct schema tests now cover compact default extraction, metadata/default merging, malformed compact scope overrides, and malformed composite `allOf` entries.
- `severity` tests now cover mixed-category review/reject interactions, same-category severity dominance, and severity retention in final reasons.

## Current repo docs

- `README.md`
- `THIRD_PARTY_NOTICES.md`
- `TODO.md`
- `DONE.md`
- `ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/SPEC.md`
- `docs/GUARANTEES.md`
- `docs/REPO_WORKFLOWS.md`
- `docs/STATUSQUO.md`
- `docs/BASELINE_TEST_RUN.md`
- `docs/NPM_RELEASE.md`
- `docs/RELEASE_NOTES_TEMPLATE.md`

## Current major open areas

- policy-category refinement beyond broad `profanity`
- deeper normalization fuzzing and maintenance-script failure coverage
- broader maintained source coverage for impersonation, technical identifiers, brands, and composite risks

## Recent catalog-based gap findings

- The current maintained `reservedTechnical` coverage is improved by the GitLab reserved-routes import, but it is still narrower than a fully broad platform or namespace-identifier contract.
- The current maintained `impersonation` coverage is narrow and mostly centered on RFC 2142 mailbox roles.
- The current official-only derived USPTO subset misses many short global brands such as `openai`, `paypal`, `google`, and `github`.
- The current runtime bundle contains only one composite rule, so broader deceptive combinations are mostly uncovered.
- The current test suite is strong on targeted regressions but still too narrow as a full TP/FP/TN/FN product matrix.

## Recent source-research findings

- `reservedTechnical` is the easiest current gap to improve with free third-party sources.
- The most promising currently identified `reservedTechnical` additions are:
  - `reserved-usernames`
  - `github-reserved-names`
  - optionally Windows reserved URI scheme names if the product scope wants URI-scheme coverage
- Early review suggests `reserved-usernames` and `github-reserved-names` are materially noisier than GitLab reserved names and should be added only with explicit filtering criteria.
- A direct default-baseline evaluation of `github-reserved-names` confirmed that concern: importing it conservatively but broadly still produced unacceptable false positives such as `seven-labs` because of generic route terms like `labs`.
- `protectedBrand` can plausibly be improved by supplementing the USPTO-derived subset with a free Wikidata-derived short-brand seed set.
- `impersonation` does not currently have a strong freely redistributable modern standard source for many trust, billing, verification, and recovery terms.
- `compositeRisk` appears least likely to be solved by direct third-party imports alone and will probably require a documented derived layer.
