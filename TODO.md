# TODO

## P1 Product and policy quality

- Expand maintained `reservedTechnical` coverage beyond Windows device names when the product contract expects broader platform or system identifiers.
  - Why:
    - A catalog-based runtime evaluation originally showed that terms such as `admin`, `root`, `system`, `api`, `mail`, `status`, and `webhook` evaluated to `allow`.
    - The maintained repo source set now includes Windows reserved device names, a conservative Windows reserved URI-scheme subset, a conservative GitLab reserved-routes import, a conservative ICANN .com reserved-name subset, and a conservative filtered `reserved-usernames` import, which closes `root`, `system`, `mail`, `status`, `settings`, `nic`, and `whois` but still leaves the broader technical-identifier expectation only partially met.
    - A direct evaluation of `github-reserved-names` against the maintained baseline showed unacceptable noise for the default set, for example `seven-labs` becoming `reject` because of the generic `labs` route term.
  - Target:
    - decide the intended `reservedTechnical` scope explicitly
    - if broader coverage is intended, evaluate whether to add further filtered imports or optional Windows reserved URI scheme names
    - only revisit `github-reserved-names` with a stricter documented derived filter strategy

- Expand maintained `impersonation` coverage beyond the current RFC 2142-centered role set.
  - Why:
    - A conservative additive GitHub Enterprise reserved-username import now contributes `staff`, a conservative additive `reserved-usernames` impersonation import now contributes `account`, `accounts`, `billing`, `official`, and `password`, and a conservative derived impersonation layer now supplements the RFC 2142 core with exact-token account-access and operator-facing identifiers such as `admin`, `administrator`, `help`, `login`, `oauth`, `profile`, `secure`, `sysadmin`, and `webmail`.
    - A catalog-based runtime evaluation now closes `official`, `billing`, `account-recovery`, and `password-reset`, but still shows that `payments`, `verified`, `trust`, and `safety` do not match maintained `impersonation` sources.
    - The maintained set is no longer only RFC 2142, but it is still materially narrower than a modern payments, verification, trust, and safety vocabulary.
    - A follow-up source review did not identify a strong freely redistributable standard source for the modern trust, billing, verification, and recovery vocabulary.
  - Target:
    - define the intended impersonation-role vocabulary
    - preserve the current conservative derived operator/account-access layer
    - ingest any additional free extensions that can be justified without turning the default set into a noisy project-maintained list
    - document where a derived project layer is still required because no strong free source exists

- Continue splitting the current broad `profanity` handling into more precise policy categories.
  - Why:
    - The first explicit refinements are now in place: `insult.wiki` feeds `insult`, and `dsojevic/profanity-list` maps `racial`, `religious`, and `lgbtq` tagged entries to `slur`, `sexual` tagged entries to `sexual`, and `shock` tagged entries to `shock`.
    - The remaining maintained sources still put general profanity and extremist references into broad buckets.
    - The current refinement is still source-based, so some overlapping terms can surface both `profanity` and `insult` evidence, both `profanity` and `slur` evidence, both `profanity` and `sexual` evidence, or both `profanity` and `shock` evidence.
    - Even with `severity`, the semantic grouping is still too coarse for explainability, customer policy customization, and compliance review.
  - Target:
    - continue toward categories such as `generalProfanity`, `insult`, `slur`, `sexual`, `shock`, and `extremism`
    - decide how overlapping source evidence should be represented when the same term appears in multiple finer categories
    - keep source-specific evidence while mapping to clearer runtime policy decisions

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

- Expand maintained `compositeRisk` coverage beyond the current support/security-anchor derived layer if the product expects broader deception-combination coverage.
  - Why:
    - The current runtime bundle now carries the RFC 2142 `security+support` rule plus a conservative derived support/security-anchor layer, which closes combinations such as `admin-support`, `admin-security`, `billing-support`, `login-support`, `login-security`, `official-support`, `oauth-support`, `password-security`, and `profile-security`.
    - A catalog-based runtime evaluation still shows that combinations such as `trust-safety`, `customer-recovery`, and `privacy-team` remain uncovered unless one component independently matches another category.
    - A follow-up source review did not identify a strong free third-party source that directly ships these product-relevant composite combinations.
  - Target:
    - define the intended composite vocabulary explicitly
    - preserve the current conservative derived support/security-anchor layer
    - decide whether to expand into trust, billing, privacy, verification, and recovery combinations through a further documented derived strategy

## P2 Engineering hygiene
