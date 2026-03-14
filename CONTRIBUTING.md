# Contributing

## Requirements

- Node.js `>=20`
- npm

## Setup

```bash
npm ci
```

## Validate before PR

```bash
npm run ci:check
```

## Expectations

- Keep changes scoped and reviewable.
- Add or update tests for behavior changes.
- Update docs when source strategy, runtime contracts, CLI behavior, or policy behavior changes.
- Preserve deterministic behavior unless the change explicitly redefines a documented contract.
- Do not add self-maintained source lists to the maintained repository source set.
- Keep third-party and normative source provenance explicit.
