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
- `src/schema/validate-source.js` - source/rule schema validation
- `src/policies/*` - policy mapping
- `src/sources/*` - built-in rule packs

## Data flow

raw input
-> normalized projections
-> matched rules
-> derived risk matches
-> provisional decision
-> allow overrides
-> final explainable result

External seed lists are imported offline into versioned JSON source files and then loaded through the same source loader path as built-in/custom sources.
