/**
 * @typedef {{
 *   source?: string,
 *   language?: string,
 *   severity?: string,
 *   tags?: string[],
 *   license?: string,
 *   notes?: string,
 *   sourceUrl?: string,
 * }} SourceMetadata
 */

/**
 * @typedef {{
 *   id: string,
 *   term: string,
 *   category: string,
 *   scopes: string[],
 *   match: string,
 *   severity?: string,
 *   normalizationField?: string,
 *   metadata?: SourceMetadata,
 * }} SourceRule
 */

/**
 * @typedef {{
 *   id: string,
 *   term: string,
 *   category: string,
 *   scopes: string[],
 *   allOf: string[],
 * }} CompositeRule
 */

/**
 * @typedef {{
 *   category?: string,
 *   scopes?: string[],
 *   match?: string,
 *   severity?: string,
 *   normalizationField?: string,
 *   metadata?: SourceMetadata & { idPrefix?: string },
 *   idPrefix?: string,
 * }} RuleDefaults
 */

/**
 * @typedef {{
 *   id: string,
 *   description?: string,
 *   metadata?: SourceMetadata,
 *   ruleDefaults?: RuleDefaults,
 *   rules?: Array<SourceRule | [string, string, Partial<SourceRule> & { metadata?: SourceMetadata }?]>,
 *   compositeRules?: CompositeRule[],
 * }} Source
 */

/**
 * @typedef {[number, number, number, number, number?]} RuntimeProfile
 */

/**
 * @typedef {{
 *   id?: string,
 *   version: number,
 *   defaultProfileIndex?: number,
 *   scopeTable?: string[][],
 *   matchTable?: string[],
 *   categoryTable?: string[],
 *   severityTable?: string[],
 *   normalizationFieldTable?: string[],
 *   profileTable?: RuntimeProfile[],
 *   rules?: Array<string | [string] | [string, number] | [string, number, string?]>,
 *   compositeRules?: Array<[string, string | number, number, string[]]>,
 * }} RuntimeBundle
 */

export {};
