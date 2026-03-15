# TODO

## Ownership

- Product-owner decisions and future scope changes: repository owner / maintainer
- Implementation work for tracked TODO items: unassigned until explicitly added below

## Open items

### Enterprise readiness

- Add upstream integrity capture or verification for non-package external sources.
  - Owner: unassigned
  - Why:
    - the repo now tracks freshness and provenance, but it still does not record or verify upstream response hashes, ETags, or equivalent integrity markers for GitLab, ICANN, Microsoft Learn, insult.wiki, and similar fetched inputs
    - for an enterprise-grade source pipeline, freshness alone is weaker than freshness plus authenticity or tamper-detection signals

- Add release-artifact attestation or signing for published packages.
  - Owner: unassigned
  - Why:
    - the repo currently validates what would be packed, but it does not yet produce signed release metadata or attestations for the published npm artifact
    - enterprise consumers often need stronger provenance than a passing CI run plus a git tag

### Quality and test coverage
