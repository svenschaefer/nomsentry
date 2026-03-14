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
- [Status Quo](/C:/code/nomsentry/docs/STATUSQUO.md)
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
npm run docs:check
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
npm run import:uspto -- --input-file path\\to\\case_file.csv
npm run derive:uspto-brand-risk
npm run build:runtime-sources
node bin/nomsentry.js check tenantName sh!t
node bin/nomsentry.js explain tenantName mierda
```

## Runtime model

The repository maintains two layers of source artifacts:

- `custom/sources/`
  - versioned build inputs
  - imported or extracted third-party source artifacts
- `dist/runtime-sources.json`
  - compiled single-file runtime bundle
  - default input used by the CLI

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
custom/sources/rfc2142-role-mailboxes.json
custom/sources/windows-reserved-device-names.json
custom/sources/derived-uspto-brand-risk.json
data/uspto/full-sources/imported-uspto-trademarks-<chunk>.json
dist/runtime-sources.json
```

These inputs currently come from three maintained source families plus one compiled runtime artifact:

- official register or standards sources
  - USPTO Trademark Bulk Data
  - RFC 2142 role mailbox names
  - GitLab reserved project and group names
  - Microsoft Windows reserved device names
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
npm run import:uspto -- --input-file path\to\case_file.csv
npm run derive:uspto-brand-risk
npm run build:runtime-sources
```

`protectedBrand` should be fed only from ingestible official trademark sources. The first implemented path is USPTO bulk data. WIPO is intentionally not part of the ingest strategy.

`words/profanities` is intentionally not imported into the default runtime source set. Its flat list contains many generic high-noise terms, so it is not a good policy input without an additional curation layer.

`RFC 2142` currently feeds `impersonation`, not `reservedTechnical`, because the imported role mailbox names are used as impersonation-relevant identifiers such as `abuse`, `security`, `postmaster`, and `webmaster`.

`reservedTechnical` is now sourced from both Microsoft Windows reserved device names and a conservative GitLab reserved-routes import. The broader platform and namespace-collision surface is still not complete, so the remaining scope question stays open in [TODO.md](/C:/code/nomsentry/TODO.md).

For USPTO, the repository now separates:

- full official import snapshots in local `data/uspto/full-sources/`
- derived review-level runtime subsets in `custom/sources/`

The default derived USPTO profile is structural and conservative:

- one-word marks: minimum 12 characters
- multi-word marks: maximum 2 words, each token minimum 6 characters
- terms containing digits are dropped

This keeps the official full set available while limiting default runtime `protectedBrand` noise.

The raw USPTO bulk CSV/ZIP and the local full-import artifacts under `data/uspto/` are intentionally ignored by git because of their size. The derived runtime subset in `custom/sources/` remains the versioned project artifact.

For runtime use, `custom/sources/` is compiled into `dist/runtime-sources.json`, a single flattened bundle that contains only the fields used by the engine.
Maintained-source rewrites and runtime-bundle writes use atomic temp-file or stage-and-swap paths, and `npm run determinism:check` verifies both `custom/sources/` and `dist/runtime-sources.json`.
