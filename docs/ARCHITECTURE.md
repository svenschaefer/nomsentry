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
- `src/importers/uspto.js` - USPTO bulk trademark case files into full and derived protectedBrand source JSON
- `src/schema/validate-source.js` - source/rule schema validation
- `src/policies/*` - policy mapping

## Data flow

raw input
-> normalized projections
-> matched rules
-> derived risk matches
-> provisional decision
-> allow overrides
-> final explainable result

External third-party lists are imported offline into versioned JSON source files and then loaded through the same source loader path at runtime. The repository does not maintain built-in source packs anymore.
External third-party lists are imported offline into versioned JSON source files. Those source artifacts are then compiled into `dist/runtime-sources.json`, which is the default runtime input for the CLI.

For `protectedBrand`, the strategy is restricted to ingestible official trademark sources. The first implemented source is USPTO bulk data. WIPO is not part of the ingest plan.

USPTO is handled in two layers:

- full official imports live outside the default runtime path in local `data/uspto/full-sources/`
- a derived review-level subset is generated into `custom/sources/derived-uspto-brand-risk.json`

The derivation step is intentionally structural rather than editorial. The repository does not maintain its own brand allow/block list.
