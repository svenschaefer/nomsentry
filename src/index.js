import { createEngine } from "./core/evaluate.js";
import * as builtinPolicies from "./policies/index.js";
import { loadRuntimeBundleFromFile } from "./loaders/runtime-bundle.js";

const defaultPolicy = Object.freeze(builtinPolicies.defaultPolicy());

function loadRuntimeBundle() {
  return loadRuntimeBundleFromFile(
    new URL("../dist/runtime-sources.json", import.meta.url),
  );
}

export { createEngine };
export { builtinPolicies };
export { defaultPolicy };
export { loadRuntimeBundle };
export { loadSourceFromFile } from "./loaders/source-loader.js";
export { loadSourcesFromDirectory } from "./loaders/source-loader.js";
export { loadRuntimeBundleFromFile } from "./loaders/runtime-bundle.js";
export { validateSource } from "./schema/validate-source.js";
