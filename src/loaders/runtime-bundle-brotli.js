// @ts-check

/** @typedef {import("../types.js").RuntimeBundle} RuntimeBundle */

import fs from "node:fs";
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";
import { expandRuntimeBundle } from "./runtime-bundle.js";

const SUPPORTED_RUNTIME_BUNDLE_VERSION = 1;

/**
 * @param {RuntimeBundle} bundle
 * @returns {Buffer}
 */
export function encodeRuntimeBundleBrotli(bundle) {
  if (bundle?.version !== SUPPORTED_RUNTIME_BUNDLE_VERSION) {
    throw new Error(
      `Unsupported runtime bundle version for brotli encoding: ${bundle?.version}`,
    );
  }

  return brotliCompressSync(Buffer.from(JSON.stringify(bundle), "utf8"), {
    params: {
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_QUALITY]: 11,
    },
  });
}

/**
 * @param {Buffer} buffer
 * @returns {RuntimeBundle}
 */
export function decodeRuntimeBundleBrotli(buffer) {
  const text = brotliDecompressSync(buffer).toString("utf8");
  return /** @type {RuntimeBundle} */ (JSON.parse(text));
}

/** @param {string | URL} path */
export function loadRuntimeBundleBrotliFromFile(path) {
  const bundle = decodeRuntimeBundleBrotli(fs.readFileSync(path));
  return expandRuntimeBundle(bundle);
}
