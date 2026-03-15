# ROADMAP

## Ordering

This file describes sequencing, expected release groupings, and dependencies.
Task descriptions and detailed rationale belong in [TODO.md](/C:/code/nomsentry/TODO.md).

## Planned sequence

### v0.4.x

1. Completed
   - prebuilt indexed matching replaced the former per-request linear scan
   - runtime benchmarking is in place for bundle load, engine creation, and evaluation latency
   - the build provenance manifest now records deterministic transform versions, refresh-policy linkage, and package-backed upstream versions where available
   - source freshness and determinism gates are in place for the maintained runtime path

### v0.5.x

2. Product policy refinement
   - improve the combined USPTO plus Wikidata brand-risk derivation with measured precision and recall analysis, especially around short, numeric, and ambiguity-prone brand forms
   - Dependency:
     - benefits from provenance work but does not require indexed matching
   - Exit criteria:
     - `protectedBrand`
       - the combined USPTO plus Wikidata derived profile is documented with concrete included and excluded examples
       - the maintained calibration explains how short, numeric, and ambiguity-prone brands are handled

3. Quality expansion
   - completed for the currently planned v0.5 quality gates
   - Dependency:
     - any future quality additions should continue to track the product-policy changes so new semantics are covered once

### v0.6.x

4. Engineering hygiene
   - completed:
     - linting and formatting checks
     - lightweight JSDoc and TypeScript-based type checking for compact source and runtime-bundle schema surfaces
   - Dependency:
     - can proceed incrementally after the higher-risk runtime and policy work
