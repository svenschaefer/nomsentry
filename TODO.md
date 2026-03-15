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

- Add automated coverage reporting and minimum thresholds for critical modules.
  - Owner: unassigned
  - Why:
    - the suite is broad, but there is still no measured coverage floor for `src/core/`, `src/loaders/`, `src/schema/`, and the maintained-source build scripts
    - this leaves blind spots hard to quantify as the codebase evolves

- Split the monolithic `test/run-tests.js` into focused suites or modules.
  - Owner: unassigned
  - Why:
    - current coverage is concentrated in one very large test entrypoint
    - this makes failures harder to localize and raises maintenance cost for future policy or source changes

- Add a dedicated adversarial security-regression corpus.
  - Owner: unassigned
  - Why:
    - the suite has broad maintained fixtures and normalization/property coverage, but it does not yet maintain a clearly separated security-bypass corpus for adversarial lookalikes, mixed-script evasions, and category-boundary abuse cases
    - keeping those cases in a dedicated corpus would make future bypass regressions easier to review and expand without overloading the maintained baseline fixtures
