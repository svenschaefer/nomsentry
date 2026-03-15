# Nomsentry

Deterministic identifier policy and deception detection engine.

Nomsentry evaluates identifiers like usernames, tenant slugs, and tenant names against a compiled ruleset and returns:

- `allow`
- `review`
- `reject`

It is designed for signup, workspace creation, and naming workflows where impersonation, reserved technical names, profanity, and brand-risk signals should be handled consistently.

## Install

```bash
npm install nomsentry
```

## CLI quick start

```bash
npx nomsentry check tenantSlug support
npx nomsentry explain tenantName "example value"
```

## Library quick start

```js
import { createEngine, loadRuntimeBundle, defaultPolicy } from "nomsentry";

const bundle = loadRuntimeBundle();
const engine = createEngine({
  sources: [bundle],
  policies: [defaultPolicy],
});

const result = engine.evaluate({ kind: "tenantSlug", value: "support" });
console.log(result.decision);
```

`defaultPolicy` is one strict baseline policy applied to `username`, `tenantSlug`, and `tenantName`.
Meaning:

- technical/reserved, impersonation, profanity-like, and composite risk hits -> `reject`
- protected brand hits -> `review`
- mixed-script/script risk -> `review`

Use `check` for a final decision and `explain` when you need matched reasons for logs or moderation tooling.

## Runtime artifacts

- `dist/runtime-sources.json`: compiled runtime bundle
- `dist/build-manifest.json`: machine-readable provenance manifest

## Validation commands

```bash
npm test
npm run ci:check
npm run release:check
```

## Full documentation

The npm README is intentionally short. Full project documentation is maintained in GitHub:

- Repository: https://github.com/svenschaefer/nomsentry
- Docs index: https://github.com/svenschaefer/nomsentry/tree/main/docs
- Third-party notices: https://github.com/svenschaefer/nomsentry/blob/main/THIRD_PARTY_NOTICES.md
- Security policy: https://github.com/svenschaefer/nomsentry/blob/main/SECURITY.md
