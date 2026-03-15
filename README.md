# Nomsentry

Deterministic identifier policy and deception detection engine.

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
import { createEngine, loadRuntimeBundle, defaultPolicies } from "nomsentry";

const bundle = loadRuntimeBundle();
const engine = createEngine({
  sources: [bundle],
  policies: [
    defaultPolicies.username,
    defaultPolicies.tenantSlug,
    defaultPolicies.tenantName,
  ],
});

const result = engine.evaluate({ kind: "tenantSlug", value: "support" });
console.log(result.decision);
```

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
