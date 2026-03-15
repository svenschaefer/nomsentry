# ROADMAP

## Ordering

This file describes sequencing, expected release groupings, and dependencies.
Task descriptions and detailed rationale belong in [TODO.md](/C:/code/nomsentry/TODO.md).

## Ownership

- Release-line sequencing and acceptance decisions: repository owner / maintainer
- Implementation ownership for roadmap items: unassigned unless a future roadmap entry says otherwise

## Planned sequence

### v0.4.x

1. Completed
   - prebuilt indexed matching replaced the former per-request linear scan
   - runtime benchmarking is in place for bundle load, engine creation, and evaluation latency
   - the build provenance manifest now records deterministic transform versions, refresh-policy linkage, and package-backed upstream versions where available
   - source freshness and determinism gates are in place for the maintained runtime path

### v0.5.x

2. Completed
   - the combined USPTO plus Wikidata brand-risk derivation is documented with concrete included and excluded examples
   - the maintained calibration now covers accepted review positives, ambiguity-prone allows, numeric and short-brand allows, long-tail official review positives, and brand-adjacent allow negatives
   - the maintained default boundary is now explicit:
     - one-word USPTO marks require at least 11 characters
     - multi-word USPTO marks allow at most two tokens with at least 6 characters each
     - digit-bearing USPTO marks remain out of the maintained default profile
     - ambiguity-prone terms such as `apple`, `amazon`, and `visa` remain out of the default Wikidata supplement
   - Dependency:
     - benefited from provenance and calibration-report work but did not require additional runtime changes beyond the maintained derived profile

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

## Current state

- No open follow-up work is currently tracked.

### Post-v0.6 follow-up

5. Release and source-pipeline hardening
   - completed
   - Owner:
     - unassigned
   - Dependency:
     - builds on the current provenance, freshness, source-integrity, and release-check infrastructure

6. Test-architecture hardening
   - completed
   - Owner:
     - unassigned
   - Dependency:
     - should preserve the current deterministic test gate semantics while improving maintainability and measurability
