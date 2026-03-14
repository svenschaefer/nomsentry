// @ts-check

/** @typedef {import("../types.js").Source} Source */
/** @typedef {import("../types.js").SourceMetadata} SourceMetadata */
/** @typedef {import("../types.js").SourceRule} SourceRule */
/** @typedef {import("../types.js").CompositeRule} CompositeRule */

import { expandSource } from "./source-format.js";

function assertString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function assertArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`);
  }
}

function assertObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
}

function assertOptionalString(value, name) {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }
}

function assertOptionalArrayOfStrings(value, name) {
  if (value === undefined) return;
  assertArray(value, name);
  value.forEach((entry, index) => assertString(entry, `${name}[${index}]`));
}

/**
 * @param {SourceMetadata} metadata
 * @param {string} pointer
 */
function validateMetadata(metadata, pointer) {
  assertObject(metadata, pointer);
  assertOptionalString(metadata.source, `${pointer}.source`);
  assertOptionalString(metadata.language, `${pointer}.language`);
  assertOptionalString(metadata.severity, `${pointer}.severity`);
  assertOptionalArrayOfStrings(metadata.tags, `${pointer}.tags`);
  assertOptionalString(metadata.license, `${pointer}.license`);
  assertOptionalString(metadata.notes, `${pointer}.notes`);
  assertOptionalString(metadata.sourceUrl, `${pointer}.sourceUrl`);
}

/**
 * @param {SourceRule} rule
 * @param {string} pointer
 */
function validateRule(rule, pointer) {
  assertString(rule.id, `${pointer}.id`);
  assertString(rule.term, `${pointer}.term`);
  assertString(rule.category, `${pointer}.category`);
  assertArray(rule.scopes, `${pointer}.scopes`);
  assertString(rule.match, `${pointer}.match`);
  assertOptionalString(rule.severity, `${pointer}.severity`);
  assertOptionalString(
    rule.normalizationField,
    `${pointer}.normalizationField`,
  );
  if (rule.metadata !== undefined)
    validateMetadata(rule.metadata, `${pointer}.metadata`);
}

/**
 * @param {CompositeRule} rule
 * @param {string} pointer
 */
function validateCompositeRule(rule, pointer) {
  assertString(rule.id, `${pointer}.id`);
  assertString(rule.term, `${pointer}.term`);
  assertString(rule.category, `${pointer}.category`);
  assertArray(rule.scopes, `${pointer}.scopes`);
  assertArray(rule.allOf, `${pointer}.allOf`);
  rule.allOf.forEach((term, index) =>
    assertString(term, `${pointer}.allOf[${index}]`),
  );
}

/**
 * @param {Source} source
 * @returns {Source}
 */
export function validateSource(source) {
  const expanded = expandSource(source);
  assertString(expanded.id, "source.id");
  assertOptionalString(expanded.description, "source.description");
  if (expanded.metadata !== undefined)
    validateMetadata(expanded.metadata, "source.metadata");
  if (expanded.rules !== undefined) {
    assertArray(expanded.rules, "source.rules");
    expanded.rules.forEach((rule, index) =>
      validateRule(rule, `source.rules[${index}]`),
    );
  }
  if (expanded.compositeRules !== undefined) {
    assertArray(expanded.compositeRules, "source.compositeRules");
    expanded.compositeRules.forEach((rule, index) =>
      validateCompositeRule(rule, `source.compositeRules[${index}]`),
    );
  }
  return expanded;
}
