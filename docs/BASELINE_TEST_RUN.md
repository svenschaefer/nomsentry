# Baseline Test Run

Purpose: define the stable local verification baseline for `nomsentry`.

## Stable invariants

- CLI `check` and `explain` work through the compiled runtime bundle
- malformed CLI inputs fail with stable non-zero behavior
- maintained source artifacts rebuild deterministically
- runtime bundle rebuilds deterministically
- docs consistency checks pass

## Recommended baseline

Run:

```bash
npm test
npm run docs:check
npm run determinism:check
npm run ci:check
```

## Asserted contract surface

Prefer asserting:

- decision values such as `allow`, `review`, `reject`
- presence of expected explainability fields
- deterministic artifact equality for maintained sources and runtime bundle
- stable failure for invalid commands and invalid maintenance-script arguments

Avoid over-constraining:

- incidental console wording outside documented errors
- unordered internal details not declared as part of the contract
