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
    - reserved-usernames
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

- The current maintained `protectedBrand` runtime is fed only from the derived official USPTO source.
- WIPO is intentionally not part of the ingest strategy.
- `words/profanities` is intentionally excluded from the default maintained source set because of high-noise generic terms.
- RFC 2142 currently feeds `impersonation`, not `reservedTechnical`.
- `reservedTechnical` currently draws from Windows reserved device names, a conservative GitLab reserved-routes import, and a conservative filtered reserved-usernames import.

## Runtime and build guarantees

- Maintained source rewrites use stage-and-swap or atomic write paths.
- Runtime bundle writes use atomic write paths.
- The runtime build step emits a deterministic provenance manifest for maintained source artifacts and the runtime bundle.
- The provenance manifest now includes deterministic transform versions, refresh-policy linkage, and package-lock-backed upstream versions for package-derived maintained sources.
- Source freshness is checked against git commit dates plus the deterministic refresh policy file.
- Runtime rule matching now uses a prebuilt index instead of a per-request full scan.
- A lightweight runtime benchmark harness exists for bundle load, engine creation, and evaluation latency over maintained fixture inputs.
- Lint and formatting gates now exist for human-maintained files through ESLint and Prettier, and they are part of `npm run ci:check`.
- `npm run determinism:check` validates both maintained source determinism and runtime-bundle determinism.
- `npm run ci:check` is the main local validation gate.

## Test-model notes

- Grouped catalog fixtures should use the maintained source baseline, not the synthetic helper source set.
- Synthetic helper sources are still valid for focused engine and policy tests, but they must not be used to overstate maintained runtime coverage.
- The grouped maintained-runtime matrix now covers a broader slice of the reviewed catalog for reserved-route positives, conservative reserved-usernames technical positives, RFC 2142 positives, maintained protected-brand positives, mixed-script lexical hits and fallback reviews, plus nearby false positives, but it is still not the full reviewed catalog.
- Normalization tests now include deterministic generated property coverage for idempotence, invisibles, separator-heavy variants, case-mixed and NFD forms, fullwidth ASCII forms, and supported confusable substitutions, but they still do not constitute full fuzzing.
- Normalization tests now also cover generated confusable-heavy variants combined with separators, invisibles, and mixed normalization forms, but they still do not constitute full fuzzing.
- Determinism is now covered both by standalone check scripts and by direct in-suite tests for loader ordering and byte-stable maintained-source recompaction.
- Direct schema tests now cover compact default extraction, metadata/default merging, malformed compact scope overrides, and malformed composite `allOf` entries.
- `severity` tests now cover mixed-category review/reject interactions, same-category severity dominance, and severity retention in final reasons.
- Artifact-generation tests now cover cleanup after atomic write failures during both the write and rename phases.

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
- `docs/SOURCE_EXTENSION_POLICY.md`
- `docs/STATUSQUO.md`
- `docs/WIKIDATA_BRAND_EVALUATION.md`
- `docs/generated/wikidata-brand-gap-report.json`
- `docs/BASELINE_TEST_RUN.md`
- `docs/NPM_RELEASE.md`
- `docs/RELEASE_NOTES_TEMPLATE.md`

## Current major open areas

- policy-category refinement beyond broad `profanity`
- deeper normalization fuzzing and maintenance-script failure coverage
- broader maintained source coverage for impersonation, technical identifiers, brands, and composite risks

## Recent catalog-based gap findings

- The current maintained `reservedTechnical` coverage is improved by the GitLab reserved-routes import and a conservative filtered reserved-usernames import, but it is still narrower than a fully broad platform or namespace-identifier contract.
- The current maintained `impersonation` coverage is narrow and mostly centered on RFC 2142 mailbox roles.
- The current official-only derived USPTO subset misses many short global brands such as `openai`, `paypal`, `google`, and `github`.
- The current default USPTO-derived thresholds are only a stopgap noise filter. The one-word `>= 12`, two-token `>= 6`, and digit-drop rules are useful for shrinking the official set, but they are too blunt as a long-term maintained calibration.
- The USPTO-derived brand-risk work and a possible Wikidata-derived uncovered-brand supplement are separate open tracks and should stay separated in planning.
- The current runtime bundle contains only one composite rule, so broader deceptive combinations are mostly uncovered.
- The current test suite is strong on targeted regressions but still too narrow as a full TP/FP/TN/FN product matrix.

## Recent source-research findings

- `reservedTechnical` is the easiest current gap to improve with free third-party sources.
- The most promising currently identified `reservedTechnical` additions are:
  - `github-reserved-names`
  - optionally Windows reserved URI scheme names if the product scope wants URI-scheme coverage
- Early review suggested `reserved-usernames` and `github-reserved-names` were materially noisier than GitLab reserved names and should be added only with explicit filtering criteria.
- `reserved-usernames` is now part of the maintained baseline through a conservative filtered import that keeps only clearly technical and namespace-collision terms.
- A direct default-baseline evaluation of `github-reserved-names` confirmed that concern: importing it conservatively but broadly still produced unacceptable false positives such as `seven-labs` because of generic route terms like `labs`.
- `protectedBrand` can plausibly be improved by supplementing the USPTO-derived subset with a free Wikidata-derived uncovered-brand seed set.
- The Wikidata supplement track explicitly allows overlap with the USPTO-derived subset.
- A direct Wikidata evaluation confirmed that clean candidate item pages exist for currently uncovered brands such as `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, and `mastercard`.
- The same Wikidata evaluation also showed that some valuable brand pages are ambiguity-prone, especially `visa`, `amazon`, and `apple`, so a future supplement must be filtered rather than imported blindly.
- The repo now contains a reproducible Wikidata uncovered-brand evaluation script and generated report, and the evaluator derives runtime-facing brand terms without company suffixes such as `Inc.` or `Ltd.`.
- If implemented, the Wikidata supplement should use a build-step SPARQL extractor that emits versioned derived source artifacts, not a runtime SDK dependency or a first-pass full-dump pipeline.
- Downstream source extension is now documented as an additive build-time model with separate downstream source directories and a downstream compiled bundle, not as in-place editing of the maintained source set.
- The CLI now accepts `--bundle <path>` for downstream validation against an alternate compiled runtime bundle.
- `impersonation` does not currently have a strong freely redistributable modern standard source for many trust, billing, verification, and recovery terms.
- `compositeRisk` appears least likely to be solved by direct third-party imports alone and will probably require a documented derived layer.
