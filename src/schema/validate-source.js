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

function validateRule(rule, pointer) {
  assertString(rule.id, `${pointer}.id`);
  assertString(rule.term, `${pointer}.term`);
  assertString(rule.category, `${pointer}.category`);
  assertArray(rule.scopes, `${pointer}.scopes`);
  assertString(rule.match, `${pointer}.match`);
}

export function validateSource(source) {
  assertString(source.id, "source.id");
  if (source.rules !== undefined) {
    assertArray(source.rules, "source.rules");
    source.rules.forEach((rule, index) => validateRule(rule, `source.rules[${index}]`));
  }
  if (source.compositeRules !== undefined) {
    assertArray(source.compositeRules, "source.compositeRules");
  }
  return source;
}
