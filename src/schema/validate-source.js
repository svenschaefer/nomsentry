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

function validateRule(rule, pointer) {
  assertString(rule.id, `${pointer}.id`);
  assertString(rule.term, `${pointer}.term`);
  assertString(rule.category, `${pointer}.category`);
  assertArray(rule.scopes, `${pointer}.scopes`);
  assertString(rule.match, `${pointer}.match`);
  assertOptionalString(rule.normalizationField, `${pointer}.normalizationField`);
  if (rule.metadata !== undefined) validateMetadata(rule.metadata, `${pointer}.metadata`);
}

function validateCompositeRule(rule, pointer) {
  assertString(rule.id, `${pointer}.id`);
  assertString(rule.term, `${pointer}.term`);
  assertString(rule.category, `${pointer}.category`);
  assertArray(rule.scopes, `${pointer}.scopes`);
  assertArray(rule.allOf, `${pointer}.allOf`);
  rule.allOf.forEach((term, index) => assertString(term, `${pointer}.allOf[${index}]`));
}

export function validateSource(source) {
  assertString(source.id, "source.id");
  assertOptionalString(source.description, "source.description");
  if (source.metadata !== undefined) validateMetadata(source.metadata, "source.metadata");
  if (source.rules !== undefined) {
    assertArray(source.rules, "source.rules");
    source.rules.forEach((rule, index) => validateRule(rule, `source.rules[${index}]`));
  }
  if (source.compositeRules !== undefined) {
    assertArray(source.compositeRules, "source.compositeRules");
    source.compositeRules.forEach((rule, index) =>
      validateCompositeRule(rule, `source.compositeRules[${index}]`)
    );
  }
  return source;
}
