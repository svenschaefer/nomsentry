// @ts-check

/** @typedef {import("../types.js").RuntimeBundle} RuntimeBundle */

import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { expandRuntimeBundle } from "./runtime-bundle.js";

const SUPPORTED_RUNTIME_BUNDLE_VERSION = 1;

/**
 * @param {RuntimeBundle} bundle
 * @returns {Buffer}
 */
export function encodeRuntimeBundleGzip(bundle) {
  if (bundle?.version !== SUPPORTED_RUNTIME_BUNDLE_VERSION) {
    throw new Error(
      `Unsupported runtime bundle version for gzip encoding: ${bundle?.version}`,
    );
  }

  return gzipSync(Buffer.from(JSON.stringify(bundle), "utf8"), { level: 9 });
}

/**
 * @param {Buffer} buffer
 * @returns {RuntimeBundle}
 */
export function decodeRuntimeBundleGzip(buffer) {
  const text = gunzipSync(buffer).toString("utf8");
  return /** @type {RuntimeBundle} */ (JSON.parse(text));
}

/** @param {string | URL} path */
export function loadRuntimeBundleGzipFromFile(path) {
  const bundle = decodeRuntimeBundleGzip(fs.readFileSync(path));
  return expandRuntimeBundle(bundle);
}
