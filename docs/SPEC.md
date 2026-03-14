# Nomsentry Specification
Version: 0.3

## Pipeline

input
-> normalization
-> rule matching
-> composite risk detection
-> script risk detection
-> provisional decision
-> allow override evaluation
-> final decision

## Decisions

allow
review
reject

## Priority

reject > review > allow

## Runtime inputs

The engine runs against a compiled runtime bundle in `dist/runtime-sources.json`.

That bundle is built from versioned source artifacts in `custom/sources/`, which currently include:

- profanity and insult lexicons
- imported library datasets
- official and normative reserved-name artifacts
- a derived USPTO `protectedBrand` review subset

## Category intent

- `profanity`
  - profanity, abuse, slurs, and insult-oriented terms from third-party lexicons
- `protectedBrand`
  - review-level trademark risk terms derived from official trademark data
- `impersonation`
  - impersonation-relevant role names such as `support`, `security`, `postmaster`, `webmaster`
- `reservedTechnical`
  - technical reserved identifiers such as Windows device names
- `compositeRisk`
  - derived combinations of lower-level signals
- `scriptRisk`
  - mixed-script risk derived from Unicode/script analysis
