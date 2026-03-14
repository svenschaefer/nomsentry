# Nomsentry

Deterministic identifier policy and deception detection engine.

Third-party source and attribution details are listed in [THIRD_PARTY_NOTICES.md](/C:/code/nomsentry/THIRD_PARTY_NOTICES.md).
Contribution guidance is in [CONTRIBUTING.md](/C:/code/nomsentry/CONTRIBUTING.md). Security reporting guidance is in [SECURITY.md](/C:/code/nomsentry/SECURITY.md).
Persistent project context for repository-wide assumptions is in [CODEX_CONTEXT.md](/C:/code/nomsentry/CODEX_CONTEXT.md).
Additional project docs:

- [Architecture](/C:/code/nomsentry/docs/ARCHITECTURE.md)
- [Specification](/C:/code/nomsentry/docs/SPEC.md)
- [Guarantees](/C:/code/nomsentry/docs/GUARANTEES.md)
- [Repo Workflows](/C:/code/nomsentry/docs/REPO_WORKFLOWS.md)
- [Source Extension Policy](/C:/code/nomsentry/docs/SOURCE_EXTENSION_POLICY.md)
- [Normalization Contract](/C:/code/nomsentry/docs/NORMALIZATION_CONTRACT.md)
- [Status Quo](/C:/code/nomsentry/docs/STATUSQUO.md)
- [Wikidata Brand Evaluation](/C:/code/nomsentry/docs/WIKIDATA_BRAND_EVALUATION.md)
- [Baseline Test Run](/C:/code/nomsentry/docs/BASELINE_TEST_RUN.md)
- [npm Release Process](/C:/code/nomsentry/docs/NPM_RELEASE.md)
- [Release Notes Template](/C:/code/nomsentry/docs/RELEASE_NOTES_TEMPLATE.md)

## v0.3 highlights

- normalization pipeline
- rule schema validation
- compiled runtime bundle loading
- offline import pipeline for third-party and normative source artifacts
- fixture based tests
- explicit allow overrides
- `check` and `explain` CLI commands
- explainable result model
- composite risk detection
- script risk detection
- importable third-party source artifacts

## Commands

```bash
npm test
npm run lint:check
npm run format:check
npm run typecheck
npm run benchmark:runtime
npm run docs:check
npm run freshness:check
npm run determinism:check
npm run ci:check
npm run release:check
npm run import:ldnoobw
npm run import:2toad
npm run import:obscenity
npm run import:cuss
npm run import:dsojevic
npm run import:insult-wiki
npm run import:gitlab-reserved
npm run import:github-reserved-usernames
npm run import:icann-reserved-names
npm run import:reserved-usernames
npm run import:windows-reserved-uri-schemes
npm run derive:impersonation
npm run derive:composite-risk
npm run evaluate:wikidata-brands
npm run derive:wikidata-brand-risk
npm run import:uspto -- --input-file path\\to\\case_file.csv
npm run derive:uspto-brand-risk
npm run build:runtime-sources
node bin/nomsentry.js check tenantName sh!t
node bin/nomsentry.js explain tenantName mierda
node bin/nomsentry.js check tenantSlug support --bundle path\\to\\runtime-sources.json
```

`npm run benchmark:runtime` prints a small JSON summary for:

- runtime-bundle load time
- engine creation time
- per-request evaluation latency across maintained fixture inputs

## Runtime model

The repository maintains two layers of source artifacts:

- `custom/sources/`
  - versioned build inputs
  - imported or extracted third-party source artifacts
- `dist/runtime-sources.json`
  - compiled single-file runtime bundle
  - default input used by the CLI
- `dist/build-manifest.json`
  - machine-readable provenance manifest for maintained source artifacts and the compiled runtime bundle
- `source-refresh-policy.json`
  - deterministic refresh-cadence policy used by the staleness check

Downstream projects can add their own sources separately, but they are not part of the maintained source set in this repository.

## Fixture tests

Fixtures live in:

```text
test/fixtures/allow.json
test/fixtures/reject.json
test/fixtures/review.json
```

## Maintained source set

The maintained source set is intentionally limited to imported or extracted third-party and normative artifacts. The repository does not maintain its own built-in rule lists.

Current maintained source artifacts include:

```text
custom/sources/ldnoobw-<language>.json
custom/sources/2toad-profanity-<language>.json
custom/sources/obscenity-en.json
custom/sources/cuss-<language>.json
custom/sources/dsojevic-profanity-<language>.json
custom/sources/insult-wiki-<language>.json
custom/sources/gitlab-reserved-names.json
custom/sources/github-reserved-usernames.json
custom/sources/icann-reserved-names.json
custom/sources/reserved-usernames.json
custom/sources/reserved-usernames-impersonation.json
custom/sources/rfc2142-role-mailboxes.json
custom/sources/windows-reserved-device-names.json
custom/sources/windows-reserved-uri-schemes.json
custom/sources/derived-impersonation.json
custom/sources/derived-composite-risk.json
custom/sources/derived-uspto-brand-risk.json
custom/sources/derived-wikidata-brand-risk.json
data/uspto/full-sources/imported-uspto-trademarks-<chunk>.json
dist/runtime-sources.json
dist/build-manifest.json
source-refresh-policy.json
```

These inputs currently come from three maintained source families plus one compiled runtime artifact:

- structured authority, normative, or knowledge sources
  - USPTO Trademark Bulk Data
  - Wikidata
  - RFC 2142 role mailbox names
  - GitHub Enterprise reserved usernames
  - GitLab reserved project and group names
  - ICANN .com reserved names
  - reserved-usernames
  - Microsoft Windows reserved device names
  - Microsoft Windows reserved URI schemes
- direct wordlist or lexicon sources
  - LDNOOBW
  - insult.wiki
  - words/cuss
  - dsojevic/profanity-list
- library-backed imported datasets
  - @2toad/profanity
  - obscenity
- compiled runtime artifact
  - `dist/runtime-sources.json`

Refresh maintained source inputs with:

```bash
npm run import:ldnoobw
npm run import:2toad
npm run import:obscenity
npm run import:cuss
npm run import:dsojevic
npm run import:insult-wiki
npm run import:gitlab-reserved
npm run import:github-reserved-usernames
npm run import:icann-reserved-names
npm run import:reserved-usernames
npm run import:reserved-usernames-impersonation
npm run import:windows-reserved-uri-schemes
npm run derive:impersonation
npm run derive:composite-risk
npm run evaluate:wikidata-brands
npm run derive:wikidata-brand-risk
npm run import:uspto -- --input-file path\to\case_file.csv
npm run derive:uspto-brand-risk
npm run build:runtime-sources
```

`protectedBrand` is currently fed from two maintained derived sources:

- `custom/sources/derived-uspto-brand-risk.json`
- `custom/sources/derived-wikidata-brand-risk.json`

The USPTO subset remains the official trademark path. The Wikidata supplement is a conservative build-time uncovered-brand layer that allows overlap with the USPTO subset. WIPO is intentionally not part of the ingest strategy.

`words/profanities` is intentionally not imported into the default runtime source set. Its flat list contains many generic high-noise terms, so it is not a good policy input without an additional curation layer.

`RFC 2142` currently feeds `impersonation`, not `reservedTechnical`, because the imported role mailbox names are used as impersonation-relevant identifiers such as `abuse`, `security`, `postmaster`, and `webmaster`.

`reservedTechnical` is now sourced from Microsoft Windows reserved device names, a conservative Microsoft Windows reserved URI scheme subset, a conservative GitLab reserved-routes import, a conservative ICANN reserved-name subset, and a conservative filtered `reserved-usernames` import. That maintained baseline now also includes exact technical namespace-collision terms such as `settings`. The broader platform and namespace-collision surface is still not complete, so the remaining scope question stays open in [TODO.md](/C:/code/nomsentry/TODO.md).

`impersonation` is now fed by the RFC 2142 core, a conservative GitHub Enterprise reserved-username import, a conservative additive `reserved-usernames` impersonation import, and a conservative derived additive layer in `custom/sources/derived-impersonation.json`. That maintained additive baseline now covers identifiers such as `staff`, `account`, `accounts`, `admin`, `administrator`, `billing`, `help`, `login`, `oauth`, `official`, `password`, `profile`, `secure`, `sysadmin`, and `webmail` without introducing a hand-maintained project wordlist.

`compositeRisk` is now fed by the RFC 2142 `security+support` rule plus a conservative derived support/security-anchor layer in `custom/sources/derived-composite-risk.json`. That layer covers exact-token combinations such as `admin-support`, `admin-security`, `billing-support`, `login-support`, `login-security`, `oauth-support`, `official-support`, `password-security`, and `profile-security`, while broader trust, verification, and recovery combinations remain an explicit open product-policy question.

The first explicit profanity-category refinements are now in place as well: `insult.wiki` feeds `insult`, and `dsojevic/profanity-list` now maps `racial`, `religious`, and `lgbtq` tagged entries to `slur` plus `sexual` tagged entries to `sexual` instead of leaving them all in the broad `profanity` bucket. This is intentionally source-based for now, so some overlapping terms can still surface both `profanity` and `insult` evidence, both `profanity` and `slur` evidence, or both `profanity` and `sexual` evidence until the broader category refinement is completed.

For USPTO, the repository now separates:

- full official import snapshots in local `data/uspto/full-sources/`
- derived review-level runtime subsets in `custom/sources/`

The default derived USPTO profile is structural and conservative:

- one-word marks: minimum 12 characters
- multi-word marks: maximum 2 words, each token minimum 6 characters
- terms containing digits are dropped

Trailing legal-entity suffixes such as `Inc.` or `LLC` are stripped before those structural thresholds are applied, so runtime-facing terms collapse to the brand-facing identifier when that still fits the maintained default profile.

This keeps the official full set available while limiting default runtime `protectedBrand` noise.

The current Wikidata supplement is intentionally conservative. It closes representative uncovered brands such as `openai`, `chatgpt`, `paypal`, `google`, `github`, `stripe`, and `mastercard`, while still leaving ambiguity-prone terms such as `apple`, `amazon`, and `visa` out of the maintained default profile.

The raw USPTO bulk CSV/ZIP and the local full-import artifacts under `data/uspto/` are intentionally ignored by git because of their size. The derived runtime subset in `custom/sources/` remains the versioned project artifact.

For runtime use, `custom/sources/` is compiled into `dist/runtime-sources.json`, a single flattened bundle that contains only the fields used by the engine.
The same build step also emits `dist/build-manifest.json`, a stable provenance manifest that records maintained source artifacts, their hashes, deterministic transform versions, matched refresh-policy metadata, package-backed upstream versions where available, and the runtime bundle hash for that exact source set.
The repository also carries `source-refresh-policy.json`, which defines expected refresh cadences per maintained source family. `npm run freshness:check` resolves each maintained source artifact to its last git commit date and fails when an artifact exceeds its configured age limit.
Maintained-source rewrites and runtime-bundle writes use atomic temp-file or stage-and-swap paths, and `npm run determinism:check` verifies `custom/sources/`, `dist/runtime-sources.json`, and `dist/build-manifest.json`.
