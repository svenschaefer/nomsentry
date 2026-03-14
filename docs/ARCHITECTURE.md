# Nomsentry Architecture

## Modules

- `src/core/normalize.js` - deterministic projections
- `src/core/matchers.js` - rule matching
- `src/core/composite.js` - composite pattern detection
- `src/core/script-risk.js` - mixed script detection
- `src/core/decision.js` - provisional decision logic
- `src/core/overrides.js` - final allow overrides
- `src/loaders/source-loader.js` - JSON source loading + validation
- `src/loaders/runtime-bundle.js` - compiled runtime bundle loading
- `src/importers/ldnoobw.js` - external wordlist normalization into source JSON
- `src/importers/toad-profanity.js` - @2toad/profanity normalization into source JSON
- `src/importers/obscenity.js` - obscenity dataset normalization into source JSON
- `src/importers/cuss.js` - cuss normalization into source JSON
- `src/importers/dsojevic-profanity.js` - dsojevic/profanity-list normalization into source JSON
- `src/importers/insult-wiki.js` - insult.wiki HTML list normalization into source JSON
- `src/importers/uspto.js` - USPTO bulk trademark case files into full and derived protectedBrand source JSON
- `scripts/import-*.js` - source-specific import entrypoints
- `scripts/derive-uspto-brand-risk.js` - structural derivation of the runtime USPTO brand subset
- `scripts/build-runtime-sources.js` - compilation of `custom/sources/` into the runtime bundle
- `src/schema/validate-source.js` - source/rule schema validation
- `src/schema/source-format.js` - compact source tuple format
- `src/schema/source-io.js` - compact source serialization and pruning
- `src/policies/*` - policy mapping

## Data flow

raw input
-> normalized projections
-> matched rules
-> derived risk matches
-> provisional decision
-> allow overrides
-> final explainable result

## Source architecture

The repository does not maintain built-in source packs anymore.

Instead it maintains:

- versioned source artifacts in `custom/sources/`
- a compiled runtime bundle in `dist/runtime-sources.json`

`custom/sources/` contains imported or extracted third-party and normative artifacts. The CLI does not scan that directory directly anymore. It loads the compiled runtime bundle from `dist/runtime-sources.json`.

The currently maintained source families are:

- official register or standards sources
  - USPTO
  - RFC 2142
  - Microsoft Windows reserved device names
- direct wordlist or lexicon sources
  - LDNOOBW
  - insult.wiki
  - cuss
  - dsojevic/profanity-list
- library-backed imported datasets
  - @2toad/profanity
  - obscenity

For `protectedBrand`, the strategy is restricted to ingestible official trademark sources. The first implemented source is USPTO bulk data. WIPO is not part of the ingest plan.

`words/profanities` is deliberately excluded from the default maintained source set because the flat list includes many generic low-signal terms that would create avoidable false positives without an additional curation layer.

`RFC 2142` feeds `impersonation`, not `reservedTechnical`, because the imported role mailbox names are modeled as impersonation-relevant identifiers.

USPTO is handled in two layers:

- full official imports live outside the default runtime path in local `data/uspto/full-sources/`
- a derived review-level subset is generated into `custom/sources/derived-uspto-brand-risk.json`

The derivation step is intentionally structural rather than editorial. The repository does not maintain its own brand allow/block list.
