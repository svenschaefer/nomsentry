# Status Quo

## Repo status

- Branch target: `main`
- Maintained source strategy:
  - imported or extracted third-party and normative artifacts in `custom/sources/`
  - compiled runtime bundle in `dist/runtime-sources.json`
- Major open workstreams:
  - indexed runtime matching
  - source provenance and freshness metadata
  - broader maintained coverage for impersonation, technical identifiers, brands, and composite risks
  - deeper normalization fuzz coverage

## Runtime status

- Working validation path:
  - `node bin/nomsentry.js check <kind> <value>`
  - `node bin/nomsentry.js explain <kind> <value>`
- Working quality gates:
  - `npm test`
  - `npm run docs:check`
  - `npm run determinism:check`
  - `npm run ci:check`
  - `npm run release:check`

## Quality status

- Local deterministic checks are in place for:
  - maintained source artifacts
  - compiled runtime bundle
- Grouped category-level baseline fixtures now cover:
  - maintained positives for Windows reserved names, RFC 2142 impersonation terms, profanity hits, and mixed-script review fallbacks
  - maintained false-positive baselines for nearby impersonation, composite, profanity, and brand terms
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
