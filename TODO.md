# TODO

## P1 Product and policy quality

The v0.5 policy phase is complete only when each remaining area has both:

- a shipped maintained runtime behavior
- a documented final boundary for what is intentionally still out of scope

- Revisit the default USPTO brand-risk derivation with measured false-positive analysis.
  - Why:
    - The current derivation in [src/importers/uspto.js](/C:/code/nomsentry/src/importers/uspto.js) is intentionally structural only.
    - The maintained profile now strips trailing legal-entity suffixes before thresholding, which improves cases such as `Harley Davidson Inc.` -> `harley davidson`, but the broader calibration problem remains.
    - That is defensible as a first-pass noise filter, but not yet enterprise-grade from a precision/recall perspective.
    - The current thresholds are still too blunt: one-word marks require at least 12 characters, multi-word marks allow at most 2 tokens with at least 6 characters each, and digit-bearing terms are dropped entirely.
    - Those rules reduce noise, but they also exclude many relevant short or otherwise legitimate brand identifiers and are not a clean long-term calibration.
    - The repository now also carries a conservative [custom/sources/derived-wikidata-brand-risk.json](/C:/code/nomsentry/custom/sources/derived-wikidata-brand-risk.json) supplement, which closes `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, and `mastercard`, but intentionally still excludes ambiguity-prone terms such as `apple`, `amazon`, and `visa`.
  - Target:
    - measure false positives on realistic identifier corpora
    - document expected behavior for generic English terms and long-tail marks
    - replace the current blunt structural thresholds with a better-calibrated derived profile
    - decide which short, numeric, and ambiguity-prone brand forms should remain in the maintained default profile

## P2 Engineering hygiene
