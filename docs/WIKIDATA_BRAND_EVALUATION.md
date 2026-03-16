# Wikidata Brand Evaluation

## Purpose

This document records the current Wikidata role in `protectedBrand`.

Wikidata does not replace the USPTO-derived subset.
It supplements it conservatively for uncovered globally recognizable brands that the current structural USPTO profile still misses.

## Current repo state

The repo now contains both:

- a reproducible evaluation path:
  - `npm run evaluate:wikidata-brands`
  - generated report: `docs/generated/wikidata-brand-gap-report.json`
- a reproducible combined brand-profile calibration path:
  - `npm run evaluate:brand-profile`
  - generated report: `docs/generated/brand-profile-calibration-report.json`
- a maintained derived source:
  - `npm run derive:wikidata-brand-risk`
  - artifact: `custom/sources/derived-wikidata-brand-risk.json`

The current accepted Wikidata-derived cohort is:

- `amazon`
- `bmw`
- `openai`
- `chatgpt`
- `paypal`
- `google`
- `github`
- `sap`
- `mercedes`
- `stripe`
- `mastercard`
- `visa`

## Why the supplement exists

The original official-only runtime gap showed that the structural USPTO-derived subset still allowed representative globally recognizable brands such as:

- `openai`
- `chatgpt`
- `paypal`
- `google`
- `github`
- `stripe`
- `visa`
- `mastercard`
- `amazon`
- `apple`

That gap came from the current USPTO derivation being intentionally structural and conservative, not from a failure of the runtime engine itself.

## Source mechanics

The current Wikidata path uses:

- the official Wikidata entity search API
- the official Wikidata entity payload API
- build-time extraction only

The repo does not use Wikidata at runtime.

The evaluator and derived-source builder:

- score exact label, alias, and legal-suffix matches
- look at English labels, descriptions, aliases, and `instance of` classes
- derive runtime-facing brand terms without legal suffixes such as `Inc.` or `Ltd.`
- require positive brand-facing evidence
- do not apply default named exclusions; optional exclusions are available via `excludedTerms` if a stricter downstream profile is needed

Overlap with the USPTO-derived subset is allowed.

## Current acceptance posture

The current maintained supplement is intentionally conservative.

Accepted by default:

- clean brand-facing labels such as `OpenAI`, `ChatGPT`, `Google`, `GitHub`, `Stripe`, and `Mastercard`
- company or service pages whose public brand term is exposed directly, including legal-suffix pages when the suffix can be stripped safely

Rejected from the maintained default cohort for now:

- terms that fail the current score and evidence gates, for example ambiguity-prone labels without strong enough supporting entity evidence (for example `apple` in the current build)

This means the current Wikidata layer is not trying to maximize recall.
It is trying to close obvious missed brands without importing broad common-noun collisions into the maintained default runtime.

## Practical implication

The combined default `protectedBrand` strategy is now:

- `custom/sources/derived-uspto-brand-risk.json`
- `custom/sources/derived-wikidata-brand-risk.json`

This improves default runtime coverage for several globally recognizable brands while keeping the remaining ambiguity problem explicit.

The maintained default is now explicitly:

- USPTO-derived review positives for structurally stronger official marks, with trailing legal suffixes stripped first
- a conservative Wikidata supplement for uncovered globally recognizable brands such as `amazon`, `bmw`, `openai`, `google`, `paypal`, `github`, `sap`, `mercedes`, `stripe`, `mastercard`, and `visa`
- explicit default non-goals for numeric or short numeric forms such as `3m`, `7eleven`, `formula1`, and `playstation5`

## Licensing

Wikidata data is available under CC0:

- [Wikidata:Licensing](https://www.wikidata.org/wiki/Wikidata:Licensing)
