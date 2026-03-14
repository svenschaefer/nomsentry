# Security Policy

## Reporting a Vulnerability

Report vulnerabilities privately via GitHub Security Advisories for this repository.

Include:

- affected version or commit
- reproduction steps
- expected vs actual behavior
- potential security impact
- whether the issue affects the CLI, import pipeline, runtime bundle, or source artifacts

## Scope

Security-relevant issues for this project include:

- identifier policy bypasses
- normalization or confusable-handling bypasses
- reserved-name or impersonation detection bypasses
- unsafe source-import behavior
- corrupted runtime-bundle acceptance
- dependency or supply-chain risks in the import and build flow

## Out of scope

- source-data disagreements where the engine behaves as designed
- false-positive tuning requests without a concrete security impact
- upstream source quality issues that do not create a bypass in `nomsentry`
