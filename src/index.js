import { createEngine } from "./core/evaluate.js";
import * as builtinPolicies from "./policies/index.js";
import { loadDefaultRuntimeBundle } from "./loaders/runtime-bundle-auto.js";

const defaultKind = builtinPolicies.DEFAULT_KIND;
const defaultPolicy = Object.freeze(builtinPolicies.defaultPolicy());

function loadRuntimeBundle() {
  return loadDefaultRuntimeBundle({
    baseDir: new URL("../dist/", import.meta.url),
  });
}

export { createEngine };
export { builtinPolicies };
export { defaultKind };
export { defaultPolicy };
export { loadRuntimeBundle };
export { loadSourceFromFile } from "./loaders/source-loader.js";
export { loadSourcesFromDirectory } from "./loaders/source-loader.js";
export { loadRuntimeBundleFromFile } from "./loaders/runtime-bundle.js";
export { loadRuntimeBundleAutoFromFile } from "./loaders/runtime-bundle-auto.js";
export { loadDefaultRuntimeBundle } from "./loaders/runtime-bundle-auto.js";
export { loadRuntimeBundleBinaryFromFile } from "./loaders/runtime-bundle-binary.js";
export { loadRuntimeBundleBrotliFromFile } from "./loaders/runtime-bundle-brotli.js";
export { loadRuntimeBundleGzipFromFile } from "./loaders/runtime-bundle-gzip.js";
export { validateSource } from "./schema/validate-source.js";
