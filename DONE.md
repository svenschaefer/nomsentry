# DONE

## Completed recently

- Hardened the CLI command flow in [bin/nomsentry.js](/C:/code/nomsentry/bin/nomsentry.js).
  - Unknown commands are rejected before engine evaluation.
  - Unknown kinds are rejected before engine evaluation.
  - The CLI now returns stable exit codes for usage, validation, and runtime failures.

- Added direct CLI regression coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - usage handling
  - unknown command handling
  - unknown kind handling
  - valid `check` flow
  - valid `explain` flow with namespace override behavior

- Added automated docs consistency checks in [scripts/check-docs-consistency.js](/C:/code/nomsentry/scripts/check-docs-consistency.js).
  - wired into `npm run docs:check`
  - included in `npm run ci:check`

- Adopted selected repository conventions from the local Node.js template.
  - `.editorconfig`
  - `.gitattributes`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `engines.node`
  - `ci:check`

- Added runtime bundle compatibility validation in [src/loaders/runtime-bundle.js](/C:/code/nomsentry/src/loaders/runtime-bundle.js).
  - unsupported bundle versions now fail fast
  - broken table references now fail fast before evaluation

- Added negative runtime-bundle fixtures and regression coverage in [test/run-tests.js](/C:/code/nomsentry/test/run-tests.js).
  - unsupported runtime bundle version
  - malformed runtime profile indexes

- Added deterministic runtime-bundle verification in [scripts/check-runtime-bundle-determinism.js](/C:/code/nomsentry/scripts/check-runtime-bundle-determinism.js).
  - wired into `npm run determinism:check`
  - included in `npm run ci:check`
  - reuses the same runtime-bundle builder as the main build path
