# Nomsentry

Deterministic identifier policy and deception detection engine.

## v0.3 highlights

- normalization pipeline
- rule schema validation
- custom JSON source loading
- fixture based tests
- explicit allow overrides
- `check` and `explain` CLI commands
- explainable result model
- reserved / impersonation / profanity / product categories
- composite risk detection
- script risk detection

## Commands

```bash
npm test
node bin/nomsentry.js check tenantSlug adm1n-support
node bin/nomsentry.js explain tenantSlug support --namespace internal
```

## Fixture tests

Fixtures live in:

```text
test/fixtures/allow.json
test/fixtures/reject.json
test/fixtures/review.json
```

## Custom sources

Place JSON files in `custom/sources/` and load them via `loadSourceFromFile(...)`.
