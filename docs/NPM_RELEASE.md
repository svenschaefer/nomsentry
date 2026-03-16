# npm Release Process

This document describes the release process for `nomsentry` as a Node.js package and CLI.

## Scope

This repo ships:

- a library surface through `package.json`
- the `nomsentry` CLI
- a compiled runtime bundle in `dist/runtime-sources.json.br`
- a build provenance manifest in `dist/build-manifest.json`

Every release should validate both code and shipped artifacts.

## Release prerequisites

- clean worktree
- local `main` up to date
- `npm ci` completed
- all maintained source and runtime artifacts intentionally up to date

## Release validation

Run:

```bash
npm run release:check
```

Current release validation includes:

- `npm run ci:check`
- `npm run security:check`
- `npm run attestation:check`
- `npm pack --dry-run`
- `npm run pack:smoke`

Note on provenance:

- `npm publish --provenance` requires an OIDC-capable CI provider context.
- Local shell publishing without CI identity should use `npm publish --access public`.

If any maintained non-package source import changed, refresh `source-integrity-lock.json` before publishing:

```bash
npm run integrity:capture
```

## Release flow

1. Update code, tests, docs, and artifacts.
2. Run `npm run release:check`.
3. Bump the version without creating a tag yet:

```bash
npm version <x.y.z> --no-git-tag-version
```

4. Re-run `npm run release:check`.
5. Commit the release changes.
6. Tag the release on `main`:

```bash
git tag -a v<x.y.z> -m "v<x.y.z>"
git push origin main
git push origin v<x.y.z>
```

7. Publish when intended:

```bash
npm publish --provenance --access public
```

For manual local publishing:

```bash
npm publish --access public
```

For automated publishing, use the checked-in GitHub Actions workflow at `.github/workflows/release-publish.yml`, which requests `id-token: write` and publishes with npm provenance enabled.

## Packaging expectations

Before publishing, verify that the tarball contains the expected public artifacts, especially:

- `bin/nomsentry.js`
- `dist/runtime-sources.json.br`
- `dist/build-manifest.json`
- `custom/sources/README.md` (directory discoverability without shipping maintained source JSON artifacts)
- `README.md`
- `THIRD_PARTY_NOTICES.md`

The package boundary is explicitly controlled through the `package.json` `files` allowlist.

## Rules

- Do not publish from a dirty worktree.
- Do not tag before release validation passes.
- If a release is wrong, ship a new patch release instead of rewriting published history.
