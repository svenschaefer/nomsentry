# Nomsentry Guarantees

## Core guarantees

- Deterministic evaluation:
  - identical input, kind, context, maintained sources, and versioned runtime bundle produce identical decisions within the same project version
- Fail-fast validation:
  - malformed sources, malformed runtime bundles, and invalid CLI inputs are rejected explicitly
- Clear artifact authority:
  - `custom/sources/` and `dist/runtime-sources.json.br` are authoritative project artifacts
  - derived CLI output and local rebuild logs are non-authoritative views
- Explicit policy surface:
  - decisions are produced from documented categories, policies, derived risks, and allow overrides
- Stable non-zero failure behavior for CLI and maintenance scripts:
  - invalid usage or validation failures do not silently continue

## Non-goals

Nomsentry does not implicitly guarantee:

- perfect or complete coverage of all abusive, deceptive, or trademarked identifiers
- automatic repair of invalid inputs or corrupted artifacts
- hidden retries or silent fallback to alternate data sources
- undocumented mutation of source artifacts from read-only evaluation commands

## Design rule

If a behavior matters for correctness or downstream integration, it should be either:

- documented as part of the repo contract
- or covered by deterministic tests and validation checks
