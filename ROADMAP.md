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
   - extend the new build provenance manifest with upstream version and transform metadata
   - add source refresh policy and staleness checks
   - Dependency:
     - can proceed independently of indexed matching

### v0.5.x

3. Product policy refinement
   - split coarse `profanity` handling into more precise categories
   - expand maintained impersonation coverage beyond the RFC 2142-centered baseline, knowing that free source options are limited for modern trust and recovery vocabulary
   - decide whether broader `reservedTechnical` coverage is part of the product contract, then evaluate filtered additions beyond the current Windows plus GitLab baseline, including `reserved-usernames`, `github-reserved-names`, and optional Windows reserved URI scheme names
   - improve USPTO brand-risk derivation with measured precision and recall analysis
   - evaluate a Wikidata-derived short-brand supplement alongside the USPTO-derived subset
   - expand composite-risk coverage beyond the current single-rule baseline if that broader contract is intended, likely through a derived layer rather than a direct free source import
   - document downstream source extension policy
   - Dependency:
     - benefits from provenance work but does not require indexed matching

4. Quality expansion
   - add normalization fuzz and property-style tests
   - turn the reviewed curated identifier catalog into grouped regression fixtures
   - deepen import-failure coverage
   - deepen schema and severity matrix edge-case coverage
   - deepen rollback-path and path-misuse coverage for destructive maintenance scripts
   - Dependency:
     - should track the product-policy changes so new semantics are covered once

### v0.6.x

5. Engineering hygiene
   - add linting and formatting checks
   - evaluate JSDoc or TypeScript-based shape checking
   - Dependency:
     - can proceed incrementally after the higher-risk runtime and policy work
