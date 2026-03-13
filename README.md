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
npm run import:cuss
npm run import:dsojevic
npm run import:uspto -- --input-file path\\to\\case_file.csv
npm run derive:uspto-brand-risk
npm run build:runtime-sources
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

The project ships only imported third-party source files in `custom/sources/`. These files are build inputs. The CLI loads the compiled runtime bundle in `dist/runtime-sources.json`.

Downstream projects can add their own sources separately, but they are not part of the maintained source set in this repository.

## External seed lists

Imported snapshots stay versioned in-repo as JSON sources. Current third-party imports include:

```text
custom/sources/ldnoobw-<language>.json
custom/sources/2toad-profanity-<language>.json
custom/sources/obscenity-en.json
custom/sources/cuss-<language>.json
custom/sources/dsojevic-profanity-<language>.json
custom/sources/derived-uspto-brand-risk.json
data/uspto/full-sources/imported-uspto-trademarks-<chunk>.json
dist/runtime-sources.json
```

Refresh imports with:

```bash
npm run import:ldnoobw
npm run import:2toad
npm run import:obscenity
npm run import:cuss
npm run import:dsojevic
npm run import:uspto -- --input-file path\to\case_file.csv
npm run derive:uspto-brand-risk
npm run build:runtime-sources
```

`protectedBrand` should be fed only from ingestible official trademark sources. The first implemented path is USPTO bulk data. WIPO is intentionally not part of the ingest strategy.

For USPTO, the repository now separates:

- full official import snapshots in local `data/uspto/full-sources/`
- derived review-level runtime subsets in `custom/sources/`

The default derived USPTO profile is structural and conservative:

- one-word marks: minimum 12 characters
- multi-word marks: maximum 2 words, each token minimum 6 characters
- terms containing digits are dropped

This keeps the official full set available while limiting default runtime `protectedBrand` noise.

The raw USPTO bulk CSV/ZIP and the local full-import artifacts under `data/uspto/` are intentionally ignored by git because of their size. The derived runtime subset in `custom/sources/` remains the versioned project artifact.

For runtime use, `custom/sources/` is compiled into `dist/runtime-sources.json`, a single flattened bundle that contains only the fields used by the engine.
