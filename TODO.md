# TODO

## Ownership

- Product-owner decisions and future scope changes: repository owner / maintainer
- Implementation work for tracked TODO items: unassigned until explicitly added below

## Open items

### Enterprise readiness

- Add release-artifact attestation or signing for published packages.
  - Owner: unassigned
  - Why:
    - the repo currently validates what would be packed, but it does not yet produce signed release metadata or attestations for the published npm artifact
    - enterprise consumers often need stronger provenance than a passing CI run plus a git tag
