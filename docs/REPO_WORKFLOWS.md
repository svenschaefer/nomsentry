# Repo Workflows

## Standard change flow

1. Implement the change.
2. Add or adjust tests.
3. Run `npm test`.
4. Run `npm run docs:check` when docs or contracts may be affected.
5. Run `npm run security:check` when dependency or release-surface changes may be affected.
6. Run `npm run coverage:check` when changing critical runtime, loader, schema, or maintained-build logic.
7. Run `npm run benchmark:check` when runtime performance-sensitive paths changed.
8. Run `npm run ci:check` before commit.
9. Update `README.md`, `docs/*`, `TODO.md`, `DONE.md`, and `ROADMAP.md` when behavior or project status changed.
10. Commit with a clear message.

The repository CI workflow runs the same `npm run ci:check` gate on pushes to `main` and on pull requests across Ubuntu and Windows.

## Source and artifact flow

When maintained source artifacts change:

1. Refresh or rebuild the relevant source artifacts in `custom/sources/`.
2. Rebuild `dist/runtime-sources.json`.
3. Run `npm run determinism:check`.
4. Verify the resulting artifacts are intended and documented.

## Downstream extension flow

When a downstream project extends the source set:

1. Keep downstream sources outside the maintained `custom/sources/` tree.
2. Build a downstream compiled runtime bundle from the maintained and downstream source directories.
3. Validate the downstream bundle with downstream fixtures.
4. Use the CLI `--bundle` option when validating against that downstream bundle locally.

## Rules

- Do not add self-maintained built-in rule lists to the maintained repository source set.
- Keep third-party or normative source provenance explicit.
- Do not bypass the compiled runtime bundle path in normal CLI validation.
- Keep the worktree clean before pushing.
