# ROADMAP

## Ordering

This file describes sequencing, expected release groupings, and dependencies.
Task descriptions and detailed rationale belong in [TODO.md](/C:/code/nomsentry/TODO.md).

## Planned sequence

### v0.4.x

1. Runtime performance foundation
   - replace linear rule scans with indexed matching
   - add benchmark fixtures for bundle load and request latency
   - Dependency:
     - none

2. Build provenance and freshness
   - add source provenance and reproducibility metadata
   - add source refresh policy and staleness checks
   - Dependency:
     - can proceed independently of indexed matching

### v0.5.x

3. Product policy refinement
   - split coarse `profanity` handling into more precise categories
   - improve USPTO brand-risk derivation with measured precision and recall analysis
   - document downstream source extension policy
   - Dependency:
     - benefits from provenance work but does not require indexed matching

4. Quality expansion
   - add normalization fuzz and property-style tests
   - deepen import-failure coverage
   - deepen schema and severity matrix edge-case coverage
   - deepen rollback-path and path-misuse coverage for destructive maintenance scripts
   - Dependency:
     - should track the product-policy changes so new semantics are covered once

### v0.6.x

5. Engineering hygiene
   - add CI beyond local-only validation
   - add linting and formatting checks
   - define the npm package boundary explicitly
   - evaluate JSDoc or TypeScript-based shape checking
   - Dependency:
     - can proceed incrementally after the higher-risk runtime and policy work
