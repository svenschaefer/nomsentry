# custom/sources

This directory is part of the repository-maintained source pipeline.

In the published npm package, this path is intentionally shipped only as
documentation (this `README.md`) and does not include the maintained
`*.json` source artifacts.

Runtime consumers should use the precompiled bundle in:

- `dist/runtime-sources.json`

If you want to rebuild or extend maintained sources, do that from the repo
root with the import and derive scripts, then rebuild the runtime bundle.
