# Repo Workflows

## Standard change flow

1. Implement the change.
2. Add or adjust tests.
3. Run `npm test`.
4. Run `npm run docs:check` when docs or contracts may be affected.
5. Run `npm run ci:check` before commit.
6. Update `README.md`, `docs/*`, `TODO.md`, `DONE.md`, and `ROADMAP.md` when behavior or project status changed.
7. Commit with a clear message.

## Source and artifact flow

When maintained source artifacts change:

1. Refresh or rebuild the relevant source artifacts in `custom/sources/`.
2. Rebuild `dist/runtime-sources.json`.
3. Run `npm run determinism:check`.
4. Verify the resulting artifacts are intended and documented.

## Rules

- Do not add self-maintained built-in rule lists to the maintained repository source set.
- Keep third-party or normative source provenance explicit.
- Do not bypass the compiled runtime bundle path in normal CLI validation.
- Keep the worktree clean before pushing.
