import { createEngine } from "./core/evaluate.js";
import * as builtinPolicies from "./policies/index.js";
import { loadRuntimeBundleFromFile } from "./loaders/runtime-bundle.js";

const defaultPolicies = Object.freeze({
  username: builtinPolicies.username(),
  tenantSlug: builtinPolicies.tenantSlug(),
  tenantName: builtinPolicies.tenantName(),
});

function loadRuntimeBundle() {
  return loadRuntimeBundleFromFile(
    new URL("../dist/runtime-sources.json", import.meta.url),
  );
}

export { createEngine };
export { builtinPolicies };
export { defaultPolicies };
export { loadRuntimeBundle };
export { loadSourceFromFile } from "./loaders/source-loader.js";
export { loadSourcesFromDirectory } from "./loaders/source-loader.js";
export { loadRuntimeBundleFromFile } from "./loaders/runtime-bundle.js";
export { validateSource } from "./schema/validate-source.js";
