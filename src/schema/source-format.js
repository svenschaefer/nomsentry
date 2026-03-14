// @ts-check

/** @typedef {import("../types.js").Source} Source */
/** @typedef {import("../types.js").SourceMetadata} SourceMetadata */
/** @typedef {import("../types.js").SourceRule} SourceRule */
/** @typedef {import("../types.js").RuleDefaults} RuleDefaults */

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {SourceMetadata | undefined} base
 * @param {SourceMetadata | undefined} override
 */
function mergeMetadata(base, override) {
  /** @type {SourceMetadata} */
  const merged = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(override ?? {})) {
    if (value !== undefined) merged[key] = value;
  }
  return Object.keys(merged).length === 0 ? undefined : merged;
}

function getCommonValue(values) {
  if (values.length === 0) return undefined;
  const first = JSON.stringify(values[0]);
  return values.every((value) => JSON.stringify(value) === first)
    ? values[0]
    : undefined;
}

/** @param {Source} source */
function getRuleDefaults(source) {
  /** @type {SourceRule[]} */
  const rules = Array.isArray(source?.rules)
    ? /** @type {SourceRule[]} */ (source.rules.filter(isPlainObject))
    : [];
  if (rules.length === 0) return undefined;

  /** @type {RuleDefaults} */
  const defaults = {};
  for (const key of [
    "category",
    "scopes",
    "match",
    "severity",
    "normalizationField",
  ]) {
    const propertyKey = /** @type {keyof SourceRule} */ (key);
    const common = getCommonValue(rules.map((rule) => rule[propertyKey]));
    if (common !== undefined) defaults[propertyKey] = clone(common);
  }

  /** @type {SourceMetadata} */
  const metadata = {};
  const metadataKeys = new Set();
  for (const rule of rules) {
    for (const key of Object.keys(rule.metadata ?? {})) {
      if (key !== "notes") metadataKeys.add(key);
    }
  }

  for (const key of metadataKeys) {
    const metadataKey = /** @type {keyof SourceMetadata} */ (key);
    const common = getCommonValue(
      rules.map((rule) => rule.metadata?.[metadataKey]),
    );
    if (common !== undefined) metadata[metadataKey] = clone(common);
  }

  if (Object.keys(metadata).length > 0) {
    defaults.metadata = metadata;
  }

  const prefix = `${source.id}/`;
  if (
    rules.every(
      (rule) => typeof rule.id === "string" && rule.id.startsWith(prefix),
    )
  ) {
    defaults.idPrefix = prefix;
  }

  return Object.keys(defaults).length === 0 ? undefined : defaults;
}

/**
 * @param {SourceRule} rule
 * @param {RuleDefaults | undefined} defaults
 */
function compactRule(rule, defaults) {
  const entry = [];
  const rawId =
    defaults?.idPrefix && rule.id.startsWith(defaults.idPrefix)
      ? rule.id.slice(defaults.idPrefix.length)
      : rule.id;
  entry.push(rawId, rule.term);

  /** @type {Partial<SourceRule> & { metadata?: SourceMetadata }} */
  const override = {};
  for (const key of [
    "category",
    "scopes",
    "match",
    "severity",
    "normalizationField",
  ]) {
    const propertyKey = /** @type {keyof SourceRule} */ (key);
    if (
      JSON.stringify(rule[propertyKey]) !==
      JSON.stringify(defaults?.[propertyKey])
    ) {
      override[propertyKey] = clone(rule[propertyKey]);
    }
  }

  /** @type {SourceMetadata} */
  const metadata = {};
  const metadataRecord =
    /** @type {Record<string, string | string[] | undefined>} */ (metadata);
  for (const [key, value] of Object.entries(rule.metadata ?? {})) {
    const metadataKey = /** @type {keyof SourceMetadata} */ (key);
    if (key === "notes") {
      metadataRecord[metadataKey] = value;
      continue;
    }

    if (
      JSON.stringify(value) !==
      JSON.stringify(defaults?.metadata?.[metadataKey])
    ) {
      metadataRecord[metadataKey] = clone(value);
    }
  }

  if (Object.keys(metadata).length > 0) {
    override.metadata = metadata;
  }

  if (Object.keys(override).length > 0) {
    entry.push(override);
  }

  return entry;
}

/** @param {Source} source */
export function compactSource(source) {
  if (
    !Array.isArray(source?.rules) ||
    source.rules.some((rule) => !isPlainObject(rule))
  ) {
    return source;
  }

  const defaults = getRuleDefaults(source);
  if (!defaults) return source;

  return {
    id: source.id,
    description: source.description,
    metadata: source.metadata,
    ruleDefaults: defaults,
    rules: /** @type {SourceRule[]} */ (source.rules).map((rule) =>
      compactRule(rule, defaults),
    ),
    ...(source.compositeRules ? { compositeRules: source.compositeRules } : {}),
  };
}

/**
 * @param {SourceRule | [string, string, (Partial<SourceRule> & { metadata?: SourceMetadata })?]} rule
 * @param {RuleDefaults | undefined} defaults
 * @param {number} index
 * @returns {SourceRule}
 */
function expandCompactRule(rule, defaults, index) {
  if (isPlainObject(rule)) return clone(rule);
  if (!Array.isArray(rule) || rule.length < 2 || rule.length > 3) {
    throw new Error(
      `source.rules[${index}] must be an object or a compact rule tuple`,
    );
  }

  const [rawId, term, override] = rule;
  const metadata = mergeMetadata(defaults?.metadata, override?.metadata);
  const id = defaults?.idPrefix ? `${defaults.idPrefix}${rawId}` : rawId;

  return {
    id,
    term,
    category: override?.category ?? defaults?.category,
    scopes: clone(override?.scopes ?? defaults?.scopes),
    match: override?.match ?? defaults?.match,
    severity: override?.severity ?? defaults?.severity,
    normalizationField:
      override?.normalizationField ?? defaults?.normalizationField,
    ...(metadata ? { metadata } : {}),
  };
}

/** @param {Source} source */
export function expandSource(source) {
  if (
    !Array.isArray(source?.rules) ||
    (!source.ruleDefaults && source.rules.every(isPlainObject))
  ) {
    return clone(source);
  }

  const defaults = clone(source.ruleDefaults ?? {});
  return {
    id: source.id,
    description: source.description,
    metadata: clone(source.metadata),
    rules: source.rules.map((rule, index) =>
      expandCompactRule(rule, defaults, index),
    ),
    ...(source.compositeRules
      ? { compositeRules: clone(source.compositeRules) }
      : {}),
  };
}
