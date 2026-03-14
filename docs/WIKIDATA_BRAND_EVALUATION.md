# Wikidata Brand Supplement Evaluation

## Scope

This evaluation checks whether Wikidata can provide `protectedBrand` coverage for globally recognizable brands that are still not covered by the current derived USPTO subset.

The question is not whether Wikidata should replace USPTO.
The question is whether a conservative Wikidata-derived supplement can close clear runtime gaps while coexisting with the existing USPTO-derived subset.

Overlap with the USPTO-derived subset is acceptable.

The current repo now includes a reproducible evaluation script:

- `npm run evaluate:wikidata-brands`
- generated report: `docs/generated/wikidata-brand-gap-report.json`

## Current runtime gap

The current runtime still evaluates these representative brand terms to `allow`:

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

This is expected under the current structural USPTO derivation, which is intentionally conservative and drops many short globally recognizable brands.

## Method

The evaluation used:

- the current local runtime through `node bin/nomsentry.js explain tenantSlug <brand>`
- the official Wikidata entity search API
- the official Wikidata entity payload API
- the official Wikidata item pages

The goal was to identify whether the uncovered runtime terms have clean, machine-usable Wikidata items that could seed a future derived supplement.

The evaluator now scores candidates from the official API and records:

- candidate page
- label and description
- aliases
- `instance of` identifiers
- a recommended runtime term

For company-style pages, the recommended runtime term strips common legal suffixes.
That means pages such as `Visa Inc.` or `Apple Inc.` are still treated as candidates for the runtime term `visa` or `apple`.

## Result

Wikidata has clean candidate items for the current uncovered-brand examples.

### Strong supplement candidates

These pages are good candidates for a future derived supplement because the item label is the intended brand-facing identifier and the item is not primarily a generic noun or place name.

| Runtime term | Wikidata item                                                      | Why it is useful                                                      |
| ------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `openai`     | `Q21708200` - [OpenAI](https://www.wikidata.org/wiki/Q21708200)    | clean organization label for a globally recognizable technology brand |
| `chatgpt`    | `Q115564437` - [ChatGPT](https://www.wikidata.org/wiki/Q115564437) | clean product label for a globally recognizable digital product       |
| `paypal`     | `Q483959` - [PayPal](https://www.wikidata.org/wiki/Q483959)        | clean payments brand label                                            |
| `google`     | `Q95` - [Google](https://www.wikidata.org/wiki/Q95)                | clean company label used directly as the public brand                 |
| `github`     | `Q364` - [GitHub](https://www.wikidata.org/wiki/Q364)              | clean product or service label used directly as the public brand      |
| `stripe`     | `Q7624104` - [Stripe](https://www.wikidata.org/wiki/Q7624104)      | clean payments brand label                                            |
| `mastercard` | `Q489921` - [Mastercard](https://www.wikidata.org/wiki/Q489921)    | clean financial brand label                                           |

### Useful but ambiguity-prone candidates

These pages can still provide useful brand coverage, but they need stricter extraction rules because the surface form is also a common noun, place name, or person name in broader language use.

| Runtime term | Wikidata item                                                                                                                  | Ambiguity note                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `visa`       | `Q328840` - [Visa Inc.](https://www.wikidata.org/wiki/Q328840)                                                                 | the brand surface `visa` collides with the common immigration term                                                                     |
| `amazon`     | `Q3884` - [Amazon](https://www.wikidata.org/wiki/Q3884)                                                                        | the brand surface collides with the region and river naming space                                                                      |
| `apple`      | `Q312` - [Apple Inc.](https://www.wikidata.org/wiki/Q312) and `Q111046003` - [Apple](https://www.wikidata.org/wiki/Q111046003) | the brand surface collides with the common fruit noun, so the supplement must prefer trademark or company pages over common-noun pages |

## What the relevant Wikidata pages are

The uncovered-brand examples are not limited to one entity class.
The useful pages come from at least these practical classes:

- company or organization pages
  - OpenAI
  - Google
  - Stripe
  - Visa Inc.
  - Mastercard
  - Amazon
  - Apple Inc.
- service or platform pages
  - PayPal
  - GitHub
- product or software pages
  - ChatGPT

That means a future supplement should not be restricted to one narrow class such as only `brand`.
It should evaluate a conservative mix of company, organization, platform, service, product, and software items whose public labels act as brand identifiers.

## Recommended extraction posture

The evaluation result is positive, but it also shows that the supplement should be conservative.

Recommended guardrails:

- treat Wikidata as a supplement, not a replacement, for the USPTO-derived subset
- allow overlap with the USPTO-derived subset
- start from exact English labels plus only clearly brand-safe aliases
- prefer items whose public label is already the brand term
- when a company page label contains a legal suffix such as `Inc.` or `Ltd.`, derive the runtime term without that suffix
- do not blindly import all aliases from an item
- add an ambiguity filter for terms such as `apple`, `amazon`, and `visa`
- keep the output as a separate derived artifact, for example `custom/sources/derived-wikidata-brand-risk.json`

## Recommended extraction mechanics

For this repository, Wikidata should be integrated through a build-step extractor rather than a runtime SDK.

Recommended approach:

- define one or more deterministic SPARQL queries
- fetch JSON results from the Wikidata Query Service during the source-build step
- normalize and filter the returned labels or aliases into a derived source artifact
- compile that derived source artifact into `dist/runtime-sources.json` through the existing runtime-bundle build

Why this fits the repo:

- the repo already treats maintained source generation as a build-time pipeline, not as a runtime network dependency
- the official Wikidata Query Service supports direct SPARQL submission and JSON results
- the official dump path is much larger and is intended for very large traversals or self-hosted query setups rather than a conservative derived supplement

The practical implication is:

- no runtime Wikidata dependency
- no need for a special client SDK just to fetch and parse SPARQL JSON
- deterministic source artifacts can remain versioned in `custom/sources/`

If a future implementation hits Query Service size or stability limits, dump-based filtering can be reconsidered, but it should not be the default first path for this repository.

## Practical implication for the repo

The evaluation shows that a future Wikidata-derived supplement is justified.

It would likely improve coverage for globally recognizable brands that are currently still missed by the official-only structural USPTO subset, especially brands such as:

- `openai`
- `chatgpt`
- `paypal`
- `google`
- `github`
- `stripe`
- `mastercard`

It should, however, be implemented as a filtered derived layer with explicit ambiguity handling rather than as a blind import of every matching Wikidata label.

## Licensing

Wikidata data is available under CC0, which makes it suitable as a freely reusable input for a derived supplement:

- [Wikidata:Licensing](https://www.wikidata.org/wiki/Wikidata:Licensing)
