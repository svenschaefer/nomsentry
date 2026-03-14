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
  - deeper normalization fuzz coverage

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
- The npm package surface is explicitly bounded through the `package.json` `files` allowlist.
- Lint and formatting gates are now in place for human-maintained repository files through:
  - `npm run lint:check`
  - `npm run format:check`
- Grouped category-level baseline fixtures now cover:
  - maintained positives for Windows reserved names, a broader GitLab reserved-route set, a broader RFC 2142 impersonation set, current maintained `protectedBrand` review hits, profanity hits, and mixed-script review fallbacks
  - maintained obfuscated positives for reserved-technical, impersonation, and profanity terms, including additional separator and leetspeak variants from the reviewed catalog
  - maintained mixed-script positives and explicit documented current gaps, including broader fallback review examples and a wider uncovered-brand gap set
  - maintained false-positive baselines for nearby impersonation, composite, profanity, and brand terms, including additional reviewed negatives such as `salesforce`, `userspace`, `mastercardio`, and `dropboxing`
- Wikidata uncovered-brand evaluation status:
  - a documented evaluation now exists in `docs/WIKIDATA_BRAND_EVALUATION.md`
  - the evaluation confirmed that Wikidata has clean candidate pages for several current uncovered-brand examples
  - a future Wikidata supplement still needs explicit ambiguity filters for terms such as `visa`, `amazon`, and `apple`
- Maintenance-script failure coverage now includes:
  - importer argument validation
  - runtime-builder argument validation
  - freshness-check argument and policy validation
  - staged rename rollback restoration for `compact-sources`
  - additional upstream transport and parse-failure coverage for maintained import fetchers
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
  - `docs/SPEC.md`
  - `docs/GUARANTEES.md`
  - `docs/REPO_WORKFLOWS.md`
  - `docs/SOURCE_EXTENSION_POLICY.md`
  - `docs/STATUSQUO.md`
  - `docs/WIKIDATA_BRAND_EVALUATION.md`
  - `docs/BASELINE_TEST_RUN.md`
  - `docs/NPM_RELEASE.md`
  - `docs/RELEASE_NOTES_TEMPLATE.md`
