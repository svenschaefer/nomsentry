# npm Release Process

This document describes the release process for `nomsentry` as a Node.js package and CLI.

## Scope

This repo ships:

- a library surface through `package.json`
- the `nomsentry` CLI
- versioned maintained source artifacts
- a compiled runtime bundle in `dist/runtime-sources.json`

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
- `npm pack --dry-run`

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
npm publish --access public
```

## Packaging expectations

Before publishing, verify that the tarball contains the expected public artifacts, especially:

- `bin/nomsentry.js`
- `dist/runtime-sources.json`
- current documentation files that should ship with the package

## Rules

- Do not publish from a dirty worktree.
- Do not tag before release validation passes.
- If a release is wrong, ship a new patch release instead of rewriting published history.
