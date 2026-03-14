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
That bundle is versioned and validated for structural compatibility before runtime evaluation.

That bundle is built from versioned source artifacts in `custom/sources/`, which currently include:

- profanity and insult lexicons
- imported library datasets
- official and normative identifier artifacts
- derived impersonation and composite-risk artifacts
- a derived USPTO `protectedBrand` review subset

## Category intent

- `profanity`
  - general profanity and abuse-oriented terms from third-party lexicons
- `insult`
  - source-backed insult-oriented terms, currently led by `insult.wiki`
- `protectedBrand`
  - review-level trademark risk terms derived from official trademark data
- `impersonation`
  - impersonation-relevant role and account-access names such as `support`, `security`, `postmaster`, `webmaster`, `admin`, `login`, and `oauth`
- `reservedTechnical`
  - technical reserved identifiers such as Windows device names and reserved URI schemes
- `compositeRisk`
  - derived combinations of lower-level signals such as support/security-anchor combinations with maintained impersonation or account-access terms
- `scriptRisk`
  - mixed-script risk derived from Unicode/script analysis
