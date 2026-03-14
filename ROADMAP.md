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
   - continue the initial `profanity` split beyond the current source-based `generalProfanity`, `insult`, `slur`, `sexual`, and `shock` refinements
   - expand maintained impersonation coverage beyond the current RFC 2142 plus additive GitHub `staff` plus additive reserved-usernames trust/account terms plus conservative derived account-access baseline, knowing that free source options are limited for modern payments, verification, trust, and safety vocabulary
   - decide whether broader `reservedTechnical` coverage is part of the product contract, then evaluate filtered additions beyond the current Windows device-name plus Windows URI-scheme plus GitLab plus ICANN plus reserved-usernames baseline and, only with stricter filtering, `github-reserved-names`
   - improve the combined USPTO plus Wikidata brand-risk derivation with measured precision and recall analysis, especially around short, numeric, and ambiguity-prone brand forms
   - expand composite-risk coverage beyond the current support/security-anchor derived baseline if that broader contract is intended, likely through a further derived layer rather than a direct free source import
   - document downstream source extension policy
   - Dependency:
     - benefits from provenance work but does not require indexed matching

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
