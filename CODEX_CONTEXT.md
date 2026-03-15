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
  - structured authority, normative, or knowledge sources
    - USPTO Trademark Bulk Data
    - Wikidata
    - RFC 2142 role mailbox names
    - GitLab reserved project and group names
    - GitHub Enterprise reserved usernames
    - ICANN .com reserved names
    - reserved-usernames
    - Microsoft Windows reserved device names
    - Microsoft Windows reserved URI schemes
  - direct wordlist or lexicon sources
    - LDNOOBW
    - insult.wiki
    - words/cuss
    - dsojevic/profanity-list
  - library-backed imported datasets
    - @2toad/profanity
    - obscenity

## Source strategy constraints

- The current maintained `protectedBrand` runtime is fed from a derived USPTO subset plus a conservative derived Wikidata supplement.
- WIPO is intentionally not part of the ingest strategy.
- `words/profanities` is intentionally excluded from the default maintained source set because of high-noise generic terms.
- The first explicit category split beyond broad `profanity` is now in place: `insult.wiki` feeds `insult`.
- The next explicit source-backed refinement is now in place as well: `dsojevic/profanity-list` maps `general` tagged entries to `generalProfanity`.
- The next explicit source-backed refinement is now in place as well: `dsojevic/profanity-list` maps `racial`, `religious`, and `lgbtq` tagged entries to `slur`.
- The next source-backed refinement after that is now in place as well: `dsojevic/profanity-list` maps `sexual` tagged entries to `sexual`.
- The next source-backed refinement after that is now in place as well: `dsojevic/profanity-list` maps `shock` tagged entries to `shock`.
- RFC 2142 currently feeds `impersonation`, not `reservedTechnical`.
- `reservedTechnical` currently draws from Windows reserved device names, a conservative Windows reserved URI-scheme subset, a conservative GitLab reserved-routes import, a conservative ICANN .com reserved-name subset, and a conservative filtered reserved-usernames import.
- The filtered `reserved-usernames` subset now also includes `settings` as a maintained technical namespace-collision term.
- `impersonation` currently draws from the RFC 2142 core, an additive GitHub Enterprise reserved-username import for `staff`, an additive reserved-usernames impersonation import for `account`, `accounts`, `billing`, `official`, `password`, `payment`, `reset`, and `reset-password`, and a conservative derived additive layer sourced from maintained GitLab and reserved-usernames terms.
- `compositeRisk` currently draws from the RFC 2142 `security+support` rule plus a conservative derived support/security-anchor layer built from the maintained impersonation baseline.

## Runtime and build guarantees

- Maintained source rewrites use stage-and-swap or atomic write paths.
- The current USPTO full-import rewrite path now replaces chunk files through a staged swap with rollback instead of delete-first writes.
- The current derived USPTO rewrite path preserves the single-file artifact and only removes legacy chunked outputs after a successful write.
- Runtime bundle writes use atomic write paths.
- The runtime build step emits a deterministic provenance manifest for maintained source artifacts and the runtime bundle.
- The provenance manifest now includes deterministic transform versions, refresh-policy linkage, and package-lock-backed upstream versions for package-derived maintained sources.
- Source freshness is checked against git commit dates plus the deterministic refresh policy file.
- Runtime rule matching now uses a prebuilt index instead of a per-request full scan.
- A lightweight runtime benchmark harness exists for bundle load, engine creation, and evaluation latency over maintained fixture inputs.
- Lint and formatting gates now exist for human-maintained files through ESLint and Prettier, and they are part of `npm run ci:check`.
- A lightweight type-checking gate now exists through `npm run typecheck`, focused on compact source and runtime-bundle schema surfaces.
- `npm run determinism:check` validates both maintained source determinism and runtime-bundle determinism.
- `npm run ci:check` is the main local validation gate.

## Test-model notes

- Grouped catalog fixtures should use the maintained source baseline, not the synthetic helper source set.
- Synthetic helper sources are still valid for focused engine and policy tests, but they must not be used to overstate maintained runtime coverage.
- The grouped maintained-runtime matrix now covers a broader slice of the reviewed catalog for reserved-route positives, conservative reserved-usernames technical positives, RFC 2142 positives, derived impersonation and composite positives, maintained protected-brand positives, mixed-script lexical hits and fallback reviews, plus nearby false positives, but it is still not the full reviewed catalog.
- The grouped maintained-runtime matrix now includes explicit TP, FP, TN, and documented FN suites for the maintained baseline.
- The compact-form contract is now explicit: supported compact behavior covers deterministic folding that preserves the original letters, while consonant-dropping shorthand such as `fck`, `pwdrst`, `acctrcvry`, `vrfd`, `srvr`, `admn`, and `arschlch` is not part of the maintained default contract.
- Normalization tests now include deterministic generated property coverage for idempotence, invisibles, separator-heavy variants, case-mixed and NFD forms, fullwidth ASCII forms, and supported confusable substitutions, but they still do not constitute full fuzzing.
- Normalization tests now also cover generated confusable-heavy variants combined with separators, invisibles, and mixed normalization forms, but they still do not constitute full fuzzing.
- Normalization tests now also include a seeded fuzz-style corpus across supported separators, invisibles, case mixing, NFD forms, supported leetspeak substitutions, supported confusable substitutions, and fullwidth ASCII variants.
- Determinism is now covered both by standalone check scripts and by direct in-suite tests for loader ordering and byte-stable maintained-source recompaction.
- Direct schema tests now cover compact default extraction, metadata/default merging, malformed compact scope overrides, and malformed composite `allOf` entries.
- `severity` tests now cover mixed-category review/reject interactions, same-category severity dominance, and severity retention in final reasons.
- Artifact-generation tests now cover cleanup after atomic write failures during both the write and rename phases.
- Import-script failure coverage now also includes staged USPTO chunk replacement rollback, preservation of existing chunk content on swap failure, and legacy derived USPTO chunk cleanup without deleting the current single-file artifact.

## Current repo docs

- `README.md`
- `THIRD_PARTY_NOTICES.md`
- `TODO.md`
- `DONE.md`
- `ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/NORMALIZATION_CONTRACT.md`
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
- `tsconfig.typecheck.json`

## Current major open areas

- broader maintained source coverage for impersonation, technical identifiers, brands, and composite risks
- v0.5 should not be treated as open-ended exploration anymore. The exit bar is:
  - each remaining policy area must end with shipped maintained behavior
  - each remaining policy area must also end with an explicit documented scope boundary for what stays out of scope

## Recent catalog-based gap findings

- The current maintained `reservedTechnical` coverage is improved by the Windows reserved URI-scheme subset, the GitLab reserved-routes import, and a conservative filtered reserved-usernames import, but it is still narrower than a fully broad platform or namespace-identifier contract.
- The current maintained `reservedTechnical` coverage is also improved by a conservative ICANN .com reserved-name subset that adds `example`, `iana`, `nic`, `rfc-editor`, `root-servers`, and `whois` style technical namespace identifiers.
- The current maintained `impersonation` coverage is broader than the original RFC 2142-only baseline because the repo now adds the GitHub Enterprise reserved username `staff`, additive reserved-usernames account-access terms such as `account`, `billing`, `official`, `password`, `payment`, `reset`, and `reset-password`, and derives additive exact-token account-access terms such as `admin`, `login`, `oauth`, `profile`, `secure`, `sysadmin`, and `webmail`.
- The current official USPTO-derived subset still misses many short global brands on its own, which is why the repo now carries a conservative separate Wikidata supplement.
- The current default USPTO-derived thresholds are only a stopgap noise filter. The one-word `>= 12`, two-token `>= 6`, and digit-drop rules are useful for shrinking the official set, but they are too blunt as a long-term maintained calibration.
- The maintained USPTO-derived profile now strips trailing legal-entity suffixes such as `Inc.` and `LLC` before structural thresholding, which improves brand-facing filter terms without yet solving the broader short-brand calibration problem.
- The open brand-calibration work is now about the combined USPTO plus Wikidata maintained profile, not about whether to add Wikidata at all.
- The current runtime bundle now carries the RFC 2142 `security+support` rule plus a conservative derived support/security-anchor composite layer, which now closes additive combinations such as `billing-support`, `official-support`, `payment-support`, and `reset-security`, but broader deceptive combinations such as trust, privacy, verification, and recovery pairs are still mostly uncovered.
- The current test suite is strong on targeted regressions but still too narrow as a full TP/FP/TN/FN product matrix.
- The current category refinement is still source-based, so overlapping terms can legitimately surface both `profanity` and `generalProfanity` evidence, both `profanity` and `insult` evidence, both `profanity` and `slur` evidence, both `profanity` and `sexual` evidence, or both `profanity` and `shock` evidence.
- The v0.5 profanity split boundary is now considered complete for this phase: `generalProfanity`, `insult`, `slur`, `sexual`, and `shock` are maintained and policy-backed, while a separate `extremism` category is intentionally deferred because the current freely redistributable structured sources do not provide a clean maintained split axis.

## Recent source-research findings

- `reservedTechnical` is the easiest current gap to improve with free third-party sources.
- The most promising currently identified `reservedTechnical` additions are:
  - `github-reserved-names`
  - optionally Windows reserved URI scheme names if the product scope wants URI-scheme coverage
- Early review suggested `reserved-usernames` and `github-reserved-names` were materially noisier than GitLab reserved names and should be added only with explicit filtering criteria.
- Microsoft Learn reserved URI schemes are now part of the maintained baseline through a conservative exact-match subset that keeps protocol-like and system-handler scheme names while excluding consumer-brand and common-noun entries.
- `reserved-usernames` is now part of the maintained baseline through a conservative filtered import that keeps only clearly technical and namespace-collision terms.
- A follow-up inspection of the remaining obvious `reserved-usernames` raw candidates found only generic additions such as `client`, `clients`, `private`, `public`, `service`, and `services`, so those were intentionally not promoted into the maintained default baseline.
- `reserved-usernames` is now also part of the maintained impersonation baseline through a separate conservative additive import that keeps only `account`, `accounts`, `billing`, `official`, and `password`.
- GitHub Enterprise reserved usernames are now part of the maintained baseline through a conservative additive import that keeps only the impersonation-relevant term `staff`.
- ICANN .com reserved names are now part of the maintained baseline through a conservative technical subset that keeps clearly namespace- and registry-oriented identifiers.
- A direct default-baseline evaluation of `github-reserved-names` confirmed that concern: importing it conservatively but broadly still produced unacceptable false positives such as `seven-labs` because of generic route terms like `labs`.
- `protectedBrand` is now supplemented by a conservative free Wikidata-derived uncovered-brand seed set.
- The Wikidata supplement track explicitly allows overlap with the USPTO-derived subset.
- The repo now contains a reproducible Wikidata uncovered-brand evaluation script, a derived source builder, a generated report, and a versioned `custom/sources/derived-wikidata-brand-risk.json` artifact.
- The evaluator and derived-source builder derive runtime-facing brand terms without company suffixes such as `Inc.` or `Ltd.`.
- The current accepted Wikidata cohort covers `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, and `mastercard`.
- The current Wikidata supplement still excludes ambiguity-prone terms such as `visa`, `amazon`, and `apple`, so those remain an explicit calibration question rather than an unnoticed gap.
- The current implementation uses official Wikidata entity APIs at build time, not a runtime dependency.
- Downstream source extension is now documented as an additive build-time model with separate downstream source directories and a downstream compiled bundle, not as in-place editing of the maintained source set.
- The CLI now accepts `--bundle <path>` for downstream validation against an alternate compiled runtime bundle.
- `impersonation` does not currently have a strong freely redistributable modern standard source for many trust, billing, verification, and recovery terms.
- `compositeRisk` appears least likely to be solved by direct third-party imports alone and will probably require a documented derived layer.
- The current derived impersonation layer is intentionally conservative and additive. It is not intended to solve modern trust, billing, verification, or recovery vocabulary by itself.
