# Status Quo

## Repo status

- Branch target: `main`
- Maintained source strategy:
  - imported or extracted third-party and normative artifacts in `custom/sources/`
  - compiled runtime bundle in `dist/runtime-sources.json`
  - machine-readable provenance manifest in `dist/build-manifest.json`
  - deterministic refresh policy in `source-refresh-policy.json`
- Major open workstreams:
  - broader maintained coverage for impersonation, technical identifiers, brands, and composite risks

## Runtime status

- Working validation path:
  - `node bin/nomsentry.js check <kind> <value>`
  - `node bin/nomsentry.js explain <kind> <value>`
- Working quality gates:
  - `npm test`
  - `npm run benchmark:runtime`
  - `npm run docs:check`
  - `npm run freshness:check`
  - `npm run determinism:check`
  - `npm run ci:check`
  - `npm run release:check`
- CI status:
  - GitHub Actions CI is configured to run `npm run ci:check` on pushes to `main` and on pull requests

## Quality status

- Local deterministic checks are in place for:
  - maintained source artifacts
  - compiled runtime bundle
  - build provenance manifest
- Build provenance now includes:
  - deterministic transform versions per maintained artifact
  - refresh-policy linkage per maintained artifact
  - package-lock-backed upstream versions for package-derived maintained sources
- Runtime matching now uses:
  - a prebuilt indexed matcher instead of a per-request full rule scan
- Runtime benchmarking is available through:
  - `npm run benchmark:runtime`
  - current measurements cover bundle load time, engine creation time, and evaluation latency across maintained fixture inputs
- Source freshness checks are in place for:
  - maintained source artifacts based on git commit dates and `source-refresh-policy.json`
- In-suite determinism coverage now includes:
  - stable source-directory load ordering
  - byte-stable recompaction of unchanged source inputs
- Normalization coverage now includes:
  - generated idempotence checks
  - invisible-character invariants
  - separator-variant invariants
  - deterministic generated corpora for case-mixed, NFD, fullwidth, separator-heavy, and supported-confusable variants
  - generated confusable-heavy variants combined with separators, invisibles, and mixed normalization forms
  - a seeded fuzz-style corpus across supported separators, invisibles, case mixing, NFD forms, leetspeak substitutions, confusable substitutions, and fullwidth ASCII variants
- The npm package surface is explicitly bounded through the `package.json` `files` allowlist.
- Lint and formatting gates are now in place for human-maintained repository files through:
  - `npm run lint:check`
  - `npm run format:check`
- Lightweight type-shape checking is now in place for compact source and runtime-bundle schema surfaces through:
  - `npm run typecheck`
  - shared typedefs in `src/types.js`
  - checked JSDoc on `src/schema/source-format.js`, `src/schema/validate-source.js`, and `src/loaders/runtime-bundle.js`
- Grouped category-level baseline fixtures now cover:
  - maintained positives for Windows reserved names, a conservative Windows reserved URI-scheme subset, a broader GitLab reserved-route set, a conservative ICANN reserved-name subset, broader conservative reserved-usernames technical terms, the RFC 2142 impersonation core, the additive GitHub Enterprise `staff` import, the additive reserved-usernames impersonation subset, the new conservative derived impersonation layer, the new conservative derived composite-risk layer, current maintained `protectedBrand` review hits, profanity hits, and mixed-script review fallbacks
  - explicit true-negative suites for ordinary tenant slugs and tenant names that should stay `allow`
  - maintained obfuscated positives for reserved-technical, impersonation, and profanity terms, including additive separator and leetspeak variants for `admin`, `official`, `billing`, `password`, `payment`, `login`, `oauth`, `profile`, `openid`, `smtp`, `ssh`, `wpad`, `cache`, `dns`, `staff`, `nic`, `whois`, and `support`
  - an explicit compact-form contract matrix that separates supported compact-preserving variants from unsupported consonant-dropping shorthand
  - maintained mixed-script positives and explicit documented current gaps, including additive lexical hits such as `admin`, `official`, `billing`, `login`, `profile`, `ssh`, `oauth`, `xml`, `staff`, `nic`, `whois`, `webmaster`, and `server`, plus a wider uncovered-brand gap set
  - maintained false-positive baselines for nearby impersonation, composite, profanity, and brand terms, including additional reviewed negatives such as `salesforce`, `userspace`, `hosted`, `webview`, `wikipedia`, `serverless`, `mastercardio`, and `dropboxing`
  - together these grouped fixtures now provide explicit TP, FP, TN, and documented FN coverage for the maintained baseline
- Category-refinement status:
  - the first explicit split beyond broad `profanity` is now in place
  - `dsojevic/profanity-list` now maps `general` tagged entries to `generalProfanity`
  - `insult.wiki` now feeds `insult`
  - `dsojevic/profanity-list` now maps `racial`, `religious`, and `lgbtq` tagged entries to `slur`
  - `dsojevic/profanity-list` now also maps `sexual` tagged entries to `sexual`
  - `dsojevic/profanity-list` now also maps `shock` tagged entries to `shock`
  - the current refinement is intentionally source-based, so some overlapping terms can still surface both `profanity` and `generalProfanity` evidence, both `profanity` and `insult` evidence, both `profanity` and `slur` evidence, both `profanity` and `sexual` evidence, or both `profanity` and `shock` evidence
- Wikidata uncovered-brand evaluation status:
  - a documented evaluation now exists in `docs/WIKIDATA_BRAND_EVALUATION.md`
  - a reproducible generated report now exists in `docs/generated/wikidata-brand-gap-report.json`
  - a conservative derived source now exists in `custom/sources/derived-wikidata-brand-risk.json`
  - the current accepted cohort covers `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, and `mastercard`
  - the evaluator and derived-source builder derive runtime-facing brand terms without company suffixes such as `Inc.` or `Ltd.`
  - ambiguity-prone terms such as `visa`, `amazon`, and `apple` remain intentionally excluded from the maintained default profile
- USPTO derived-brand status:
  - the maintained derived USPTO profile now strips trailing legal-entity suffixes such as `Inc.` and `LLC` before structural thresholding
  - this improves brand-facing runtime terms such as `Harley Davidson Inc.` -> `harley davidson`
  - the profile is still intentionally conservative and still needs broader calibration around short, numeric, and ambiguity-prone brands
- Maintenance-script failure coverage now includes:
  - importer argument validation
  - runtime-builder argument validation
  - freshness-check argument and policy validation
  - staged rename rollback restoration for `compact-sources`
  - additional upstream transport and parse-failure coverage for maintained import fetchers
  - staged USPTO chunk-set replacement with rollback on swap failure
  - preservation of the current single-file derived USPTO artifact while cleaning up only legacy chunked outputs
  - atomic write cleanup coverage for `writeTextFileAtomic()` after write and rename failures
- Direct schema edge-case coverage now includes:
  - shared compact default extraction
  - metadata/default merging
  - malformed compact scope overrides
  - malformed composite `allOf` entries
- `severity` matrix coverage now includes:
  - mixed-category review versus reject interactions
  - low/high severity dominance within one category
  - severity retention in explainability reasons
- Known non-flaky baseline:
  - local `npm run ci:check`

## Documentation status

- Core docs currently maintained:
  - `CODEX_CONTEXT.md`
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `docs/NORMALIZATION_CONTRACT.md`
  - `docs/SPEC.md`
  - `docs/GUARANTEES.md`
  - `docs/REPO_WORKFLOWS.md`
  - `docs/SOURCE_EXTENSION_POLICY.md`
  - `docs/STATUSQUO.md`
  - `docs/WIKIDATA_BRAND_EVALUATION.md`
  - `docs/BASELINE_TEST_RUN.md`
  - `docs/NPM_RELEASE.md`
  - `docs/RELEASE_NOTES_TEMPLATE.md`
