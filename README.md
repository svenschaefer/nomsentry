# Nomsentry

Deterministic identifier policy and deception detection engine.

## v0.3 highlights

- normalization pipeline
- rule schema validation
- third-party JSON source loading
- fixture based tests
- explicit allow overrides
- `check` and `explain` CLI commands
- explainable result model
- composite risk detection
- script risk detection
- importable external wordlists

## Commands

```bash
npm test
npm run import:ldnoobw
npm run import:2toad
npm run import:obscenity
npm run import:uspto -- --input-file path\\to\\case_file.csv
node bin/nomsentry.js check tenantName sh!t
node bin/nomsentry.js explain tenantName mierda
```

## Fixture tests

Fixtures live in:

```text
test/fixtures/allow.json
test/fixtures/reject.json
test/fixtures/review.json
```

## Source model

The project ships only imported third-party source files in `custom/sources/`. The CLI loads all `*.json` files from that directory.

Downstream projects can add their own sources separately, but they are not part of the maintained source set in this repository.

## External seed lists

Imported snapshots stay versioned in-repo as JSON sources. Current third-party imports include:

```text
custom/sources/ldnoobw-<language>.json
custom/sources/2toad-profanity-<language>.json
custom/sources/obscenity-en.json
custom/sources/uspto-trademarks.json
```

Refresh imports with:

```bash
npm run import:ldnoobw
npm run import:2toad
npm run import:obscenity
npm run import:uspto -- --input-file path\to\case_file.csv
```

`protectedBrand` should be fed only from ingestible official trademark sources. The first implemented path is USPTO bulk data. WIPO is intentionally not part of the ingest strategy.
