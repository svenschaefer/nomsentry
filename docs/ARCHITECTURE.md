# Nomsentry Architecture

## Modules

- `src/core/normalize.js` - deterministic projections
- `src/core/matchers.js` - rule matching
- `src/core/composite.js` - composite pattern detection
- `src/core/script-risk.js` - mixed script detection
- `src/core/decision.js` - provisional decision logic
- `src/core/overrides.js` - final allow overrides
- `src/loaders/source-loader.js` - JSON source loading + validation
- `src/importers/ldnoobw.js` - external wordlist normalization into source JSON
- `src/importers/toad-profanity.js` - @2toad/profanity normalization into source JSON
- `src/importers/obscenity.js` - obscenity dataset normalization into source JSON
- `src/importers/uspto.js` - USPTO bulk trademark case files into protectedBrand source JSON
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

For `protectedBrand`, the strategy is restricted to ingestible official trademark sources. The first implemented source is USPTO bulk data. WIPO is not part of the ingest plan.
