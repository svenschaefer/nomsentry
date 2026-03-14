# Status Quo

## Repo status

- Branch target: `main`
- Maintained source strategy:
  - imported or extracted third-party and normative artifacts in `custom/sources/`
  - compiled runtime bundle in `dist/runtime-sources.json`
  - machine-readable provenance manifest in `dist/build-manifest.json`
  - deterministic refresh policy in `source-refresh-policy.json`
- Major open workstreams:
  - indexed runtime matching
  - upstream provenance enrichment and freshness metadata
  - broader maintained coverage for impersonation, technical identifiers, brands, and composite risks
  - deeper normalization fuzz coverage

## Runtime status

- Working validation path:
  - `node bin/nomsentry.js check <kind> <value>`
  - `node bin/nomsentry.js explain <kind> <value>`
- Working quality gates:
  - `npm test`
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
- Source freshness checks are in place for:
  - maintained source artifacts based on git commit dates and `source-refresh-policy.json`
- In-suite determinism coverage now includes:
  - stable source-directory load ordering
  - byte-stable recompaction of unchanged source inputs
- Normalization coverage now includes:
  - generated idempotence checks
  - invisible-character invariants
  - separator-variant invariants
- The npm package surface is explicitly bounded through the `package.json` `files` allowlist.
- Grouped category-level baseline fixtures now cover:
  - maintained positives for Windows reserved names, GitLab reserved-route names, RFC 2142 impersonation terms, profanity hits, and mixed-script review fallbacks
  - maintained obfuscated positives for reserved-technical, impersonation, and profanity terms
  - maintained mixed-script positives and explicit documented current gaps
  - maintained false-positive baselines for nearby impersonation, composite, profanity, and brand terms
- Maintenance-script failure coverage now includes:
  - importer argument validation
  - runtime-builder argument validation
  - freshness-check argument and policy validation
- Direct schema edge-case coverage now includes:
  - shared compact default extraction
  - metadata/default merging
  - malformed compact scope overrides
  - malformed composite `allOf` entries
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
  - `docs/STATUSQUO.md`
  - `docs/BASELINE_TEST_RUN.md`
  - `docs/NPM_RELEASE.md`
  - `docs/RELEASE_NOTES_TEMPLATE.md`
