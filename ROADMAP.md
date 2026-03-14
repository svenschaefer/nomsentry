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
   - split coarse `profanity` handling into more precise categories
   - expand maintained impersonation coverage beyond the RFC 2142-centered baseline, knowing that free source options are limited for modern trust and recovery vocabulary
   - decide whether broader `reservedTechnical` coverage is part of the product contract, then evaluate filtered additions beyond the current Windows plus GitLab baseline, including `reserved-usernames`, `github-reserved-names`, and optional Windows reserved URI scheme names
   - improve USPTO brand-risk derivation with measured precision and recall analysis
   - implement a conservative Wikidata-derived uncovered-brand supplement alongside the USPTO-derived subset as a separate brand-coverage track
   - expand composite-risk coverage beyond the current single-rule baseline if that broader contract is intended, likely through a derived layer rather than a direct free source import
   - document downstream source extension policy
   - Dependency:
     - benefits from provenance work but does not require indexed matching

3. Quality expansion
   - add normalization fuzz and property-style tests
   - turn the reviewed curated identifier catalog into grouped regression fixtures
   - deepen import-failure coverage
   - deepen schema and severity matrix edge-case coverage
   - Dependency:
     - should track the product-policy changes so new semantics are covered once

### v0.6.x

4. Engineering hygiene
   - add linting and formatting checks
   - evaluate JSDoc or TypeScript-based shape checking
   - Dependency:
     - can proceed incrementally after the higher-risk runtime and policy work
