# TODO

## Ownership

- Product-owner decisions and future scope changes: repository owner / maintainer
- Implementation work for tracked TODO items: unassigned until explicitly added below
- Current execution role for this delivery cycle: Codex agent (implementation and validation), with final acceptance by repository owner / maintainer

## Open items

- Define and approve the `v1.1.x` policy expansion boundary.
  - Owner: repository owner / maintainer
  - Scope: decide whether to keep the current conservative default boundary or accept targeted expansions for `reservedTechnical`, `impersonation`, and `compositeRisk`
- Add a reproducible npm provenance publish path for tagged releases.
  - Owner: implementation unassigned, approval by repository owner / maintainer
  - Scope: make CI-based publish with provenance the default documented path; keep local publish guidance as fallback
- Review and tighten package-size budget for runtime bundle growth.
  - Owner: implementation unassigned, acceptance by repository owner / maintainer
  - Scope: add explicit size budget thresholds and failure policy for `dist/runtime-sources.json.br` and packed tarball size
- Define and implement a separate short-brand policy path for 2-character brands.
  - Owner: product-owner decision required, implementation unassigned
  - Scope: decide whether terms such as `3m` should stay out of default coverage or be included via a dedicated short-brand profile with strict precision controls, rather than broad USPTO threshold relaxation
