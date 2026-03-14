# Codex Context

## Project identity

- Name: `nomsentry`
- Type: deterministic identifier policy and deception detection engine
- Primary interfaces:
  - `nomsentry` CLI
  - library/runtime evaluation through the source and runtime-bundle pipeline

## Authoritative artifact model

- Maintained source artifacts live in `custom/sources/`.
- The compiled runtime artifact lives in `dist/runtime-sources.json`.
- Local full USPTO imports live under `data/uspto/full-sources/` and are intentionally ignored by git.
- The CLI should validate against the compiled runtime bundle, not scan `custom/sources/` directly.

## Maintained source strategy

- No self-maintained built-in rule packs in the repository default source set
- Maintained sources are limited to imported or extracted third-party and normative artifacts
- Current maintained source families:
  - official register or standards sources
    - USPTO Trademark Bulk Data
    - RFC 2142 role mailbox names
    - Microsoft Windows reserved device names
  - direct wordlist or lexicon sources
    - LDNOOBW
    - insult.wiki
    - words/cuss
    - dsojevic/profanity-list
  - library-backed imported datasets
    - @2toad/profanity
    - obscenity

## Source strategy constraints

- `protectedBrand` should only be fed from ingestible official trademark sources.
- WIPO is intentionally not part of the ingest strategy.
- `words/profanities` is intentionally excluded from the default maintained source set because of high-noise generic terms.
- RFC 2142 currently feeds `impersonation`, not `reservedTechnical`.
- Windows reserved device names currently feed `reservedTechnical`.

## Runtime and build guarantees

- Maintained source rewrites use stage-and-swap or atomic write paths.
- Runtime bundle writes use atomic write paths.
- `npm run determinism:check` validates both maintained source determinism and runtime-bundle determinism.
- `npm run ci:check` is the main local validation gate.

## Current repo docs

- `README.md`
- `THIRD_PARTY_NOTICES.md`
- `TODO.md`
- `DONE.md`
- `ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/SPEC.md`
- `docs/GUARANTEES.md`
- `docs/REPO_WORKFLOWS.md`
- `docs/STATUSQUO.md`
- `docs/BASELINE_TEST_RUN.md`
- `docs/NPM_RELEASE.md`
- `docs/RELEASE_NOTES_TEMPLATE.md`

## Current major open areas

- indexed runtime matching instead of linear rule scans
- source provenance and freshness metadata
- policy-category refinement beyond broad `profanity`
- deeper normalization fuzzing and maintenance-script failure coverage

## Recent catalog-based gap findings

- The current maintained `reservedTechnical` coverage is narrow and mostly limited to Windows device names.
- The current maintained `impersonation` coverage is narrow and mostly centered on RFC 2142 mailbox roles.
- The current official-only derived USPTO subset misses many short global brands such as `openai`, `paypal`, `google`, and `github`.
- The current runtime bundle contains only one composite rule, so broader deceptive combinations are mostly uncovered.
