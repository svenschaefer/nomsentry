# Source Extension Policy

## Scope

This document defines how downstream projects should extend `nomsentry` without modifying the repository's maintained source set.

The maintained repository sources remain the files under `custom/sources/` plus the compiled runtime bundle in `dist/runtime-sources.json.br`.
Downstream extensions are additive project-specific inputs outside that maintained set.

## Core rules

1. Do not modify the maintained repository source artifacts in place for downstream-specific needs.
2. Keep downstream source artifacts in a separate directory owned by the downstream project.
3. Validate downstream sources through the same source schema as maintained sources.
4. Compile one runtime bundle for deployment instead of mixing loose source files with the compiled bundle at runtime.
5. Keep downstream allow overrides explicit and documented instead of hiding them inside silently edited maintained source files.

## Supported extension model

The supported downstream flow is:

1. Start from the maintained repository source artifacts or the maintained compiled bundle.
2. Add downstream-specific source JSON files in a separate directory.
3. Build a downstream runtime bundle from the combined source set.
4. Run the downstream deployment against that compiled bundle.

Recommended layout in a downstream project:

```text
vendor/nomsentry/custom/sources/
custom/nomsentry-sources/
dist/runtime-sources.json.br
```

## Merge semantics

The source model is additive.

- Matching terms from multiple sources may all appear in the final reasons.
- Final decisions are still driven by policy categories and severity handling.
- Source order is not a policy-precedence mechanism.
- If downstream projects need to weaken or suppress maintained matches, they should use documented allow overrides or build a downstream-specific derived source set deliberately.

## CLI and library implications

The repository CLI uses the maintained runtime bundle by default.
For downstream validation against a custom compiled bundle, the CLI now supports:

```bash
nomsentry check tenantSlug value --bundle path\\to\\runtime-sources.json.br
```

The library surface also exposes source and runtime-bundle loaders for downstream build pipelines:

- `loadSourceFromFile`
- `loadSourcesFromDirectory`
- `loadRuntimeBundleFromFile`
- `createEngine`

## Non-goals

This policy does not support:

- editing maintained source artifacts in place as a downstream customization strategy
- loading both a compiled runtime bundle and additional loose source files into the default repository CLI path at the same time
- treating source file ordering as an override mechanism

## Recommended downstream validation

When a downstream project extends the source set, it should at minimum:

1. validate the combined sources
2. rebuild the compiled runtime bundle
3. run its own TP and FP regression fixtures against that bundle
4. document any downstream allow overrides and derived-source filters
