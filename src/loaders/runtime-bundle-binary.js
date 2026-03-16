// @ts-check

/** @typedef {import("../types.js").RuntimeBundle} RuntimeBundle */

import fs from "node:fs";
import { expandRuntimeBundle } from "./runtime-bundle.js";

const MAGIC = "NSRBIN01";
const U32_MAX = 0xffffffff;

class BinaryWriter {
  constructor(initialSize = 1024 * 1024) {
    this.chunks = [];
    this.buffer = Buffer.allocUnsafe(initialSize);
    this.offset = 0;
  }

  ensure(size) {
    if (this.offset + size <= this.buffer.length) return;
    this.chunks.push(this.buffer.subarray(0, this.offset));
    const nextSize = Math.max(this.buffer.length * 2, size, 1024);
    this.buffer = Buffer.allocUnsafe(nextSize);
    this.offset = 0;
  }

  writeVarUint(value) {
    let current = value >>> 0;
    while (current >= 0x80) {
      this.ensure(1);
      this.buffer[this.offset] = (current & 0x7f) | 0x80;
      this.offset += 1;
      current >>>= 7;
    }
    this.ensure(1);
    this.buffer[this.offset] = current;
    this.offset += 1;
  }

  writeUtf8(text) {
    const bytes = Buffer.from(String(text), "utf8");
    this.writeVarUint(bytes.length);
    this.writeBytes(bytes);
  }

  writeBytes(bytes) {
    this.ensure(bytes.length);
    bytes.copy(this.buffer, this.offset);
    this.offset += bytes.length;
  }

  toBuffer() {
    if (this.offset > 0) {
      this.chunks.push(this.buffer.subarray(0, this.offset));
      this.offset = 0;
    }
    return Buffer.concat(this.chunks);
  }
}

class BinaryReader {
  /** @param {Buffer} buffer */
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  ensure(size) {
    if (this.offset + size > this.buffer.length) {
      throw new Error("Invalid runtime binary bundle: unexpected end of file");
    }
  }

  readVarUint() {
    let shift = 0;
    let value = 0;
    for (let count = 0; count < 5; count += 1) {
      this.ensure(1);
      const byte = this.buffer[this.offset];
      this.offset += 1;
      value |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return value >>> 0;
      shift += 7;
    }
    throw new Error("Invalid runtime binary bundle: malformed varuint");
  }

  readUtf8() {
    const length = this.readVarUint();
    this.ensure(length);
    const text = this.buffer.toString(
      "utf8",
      this.offset,
      this.offset + length,
    );
    this.offset += length;
    return text;
  }
}

function internString(state, value) {
  const key = String(value);
  let index = state.indexByValue.get(key);
  if (index !== undefined) return index;
  index = state.values.length;
  state.indexByValue.set(key, index);
  state.values.push(key);
  return index;
}

function stringAt(pool, index, label) {
  if (pool[index] === undefined) {
    throw new Error(
      `Invalid runtime binary bundle: ${label} references missing string index ${index}`,
    );
  }
  return pool[index];
}

/**
 * @param {RuntimeBundle} bundle
 */
export function encodeRuntimeBundleBinary(bundle) {
  if (bundle?.version !== 1) {
    throw new Error(
      `Unsupported runtime bundle version for binary encoding: ${bundle?.version}`,
    );
  }

  const scopeTable = bundle.scopeTable ?? [];
  const matchTable = bundle.matchTable ?? [];
  const categoryTable = bundle.categoryTable ?? [];
  const severityTable = bundle.severityTable ?? [];
  const normalizationFieldTable = bundle.normalizationFieldTable ?? [];
  const profileTable = bundle.profileTable ?? [];
  const rules = bundle.rules ?? [];
  const compositeRules = bundle.compositeRules ?? [];
  const defaultProfileIndex = Number.isInteger(bundle.defaultProfileIndex)
    ? bundle.defaultProfileIndex
    : 0;

  const pool = {
    values: [],
    indexByValue: new Map(),
  };

  const idIndex = internString(pool, bundle.id ?? "runtime-sources");

  const scopeTableIds = scopeTable.map((scope, rowIndex) => {
    if (!Array.isArray(scope)) {
      throw new Error(
        `Invalid runtime bundle: scopeTable[${rowIndex}] must be an array`,
      );
    }
    return scope.map((value) => internString(pool, value));
  });
  const matchTableIds = matchTable.map((value) => internString(pool, value));
  const categoryTableIds = categoryTable.map((value) =>
    internString(pool, value),
  );
  const severityTableIds = severityTable.map((value) =>
    internString(pool, value),
  );
  const normalizationFieldTableIds = normalizationFieldTable.map((value) =>
    internString(pool, value),
  );

  const ruleRows = rules.map((rule, ruleIndex) => {
    /** @type {string} */
    let suffix;
    /** @type {number} */
    let profileIndex;
    /** @type {string | undefined} */
    let explicitTerm;
    if (typeof rule === "string") {
      suffix = rule;
      profileIndex = defaultProfileIndex;
    } else if (Array.isArray(rule) && rule.length === 1) {
      [suffix] = rule;
      profileIndex = defaultProfileIndex;
    } else if (Array.isArray(rule) && rule.length === 2) {
      [suffix, profileIndex] = rule;
    } else if (Array.isArray(rule) && rule.length === 3) {
      [suffix, profileIndex, explicitTerm] = rule;
    } else {
      throw new Error(
        `Invalid runtime bundle: rules[${ruleIndex}] must be a string or tuple of length 1, 2, or 3`,
      );
    }
    return {
      suffixIndex: internString(pool, suffix),
      profileIndex,
      explicitTermIndex:
        explicitTerm === undefined ? U32_MAX : internString(pool, explicitTerm),
    };
  });

  const compositeRows = compositeRules.map((row, index) => {
    if (!Array.isArray(row) || row.length !== 4) {
      throw new Error(
        `Invalid runtime bundle: compositeRules[${index}] must be a tuple of length 4`,
      );
    }
    const [term, category, scopeIndex, allOf] = row;
    return {
      termIndex: internString(pool, term),
      categoryIndex: internString(pool, category),
      scopeIndex,
      allOfIndexes: (allOf ?? []).map((value) => internString(pool, value)),
    };
  });

  const writer = new BinaryWriter();
  writer.writeBytes(Buffer.from(MAGIC, "ascii"));
  writer.writeVarUint(pool.values.length);
  for (const value of pool.values) {
    writer.writeUtf8(value);
  }

  writer.writeVarUint(idIndex);
  writer.writeVarUint(bundle.version);
  writer.writeVarUint(defaultProfileIndex);

  writer.writeVarUint(scopeTableIds.length);
  for (const scope of scopeTableIds) {
    writer.writeVarUint(scope.length);
    for (const value of scope) writer.writeVarUint(value);
  }

  writer.writeVarUint(matchTableIds.length);
  for (const value of matchTableIds) writer.writeVarUint(value);

  writer.writeVarUint(categoryTableIds.length);
  for (const value of categoryTableIds) writer.writeVarUint(value);

  writer.writeVarUint(severityTableIds.length);
  for (const value of severityTableIds) writer.writeVarUint(value);

  writer.writeVarUint(normalizationFieldTableIds.length);
  for (const value of normalizationFieldTableIds) writer.writeVarUint(value);

  writer.writeVarUint(profileTable.length);
  for (let index = 0; index < profileTable.length; index += 1) {
    const profile = profileTable[index];
    if (!Array.isArray(profile) || profile.length < 4 || profile.length > 5) {
      throw new Error(
        `Invalid runtime bundle: profileTable[${index}] must be a tuple of length 4 or 5`,
      );
    }
    writer.writeVarUint(profile[0]);
    writer.writeVarUint(profile[1]);
    writer.writeVarUint(profile[2]);
    writer.writeVarUint(profile[3]);
    writer.writeVarUint(profile[4] ?? U32_MAX);
  }

  writer.writeVarUint(ruleRows.length);
  for (const row of ruleRows) {
    writer.writeVarUint(row.suffixIndex);
    writer.writeVarUint(row.profileIndex);
    writer.writeVarUint(row.explicitTermIndex);
  }

  writer.writeVarUint(compositeRows.length);
  for (const row of compositeRows) {
    writer.writeVarUint(row.termIndex);
    writer.writeVarUint(row.categoryIndex);
    writer.writeVarUint(row.scopeIndex);
    writer.writeVarUint(row.allOfIndexes.length);
    for (const value of row.allOfIndexes) {
      writer.writeVarUint(value);
    }
  }

  return writer.toBuffer();
}

/**
 * @param {Buffer} buffer
 * @returns {RuntimeBundle}
 */
export function decodeRuntimeBundleBinary(buffer) {
  const reader = new BinaryReader(buffer);
  const magic = buffer.toString("ascii", 0, MAGIC.length);
  if (magic !== MAGIC) {
    throw new Error(
      `Invalid runtime binary bundle: expected magic ${MAGIC}, got ${magic}`,
    );
  }
  reader.offset = MAGIC.length;

  const stringCount = reader.readVarUint();
  const pool = Array.from({ length: stringCount }, () => reader.readUtf8());

  const id = stringAt(pool, reader.readVarUint(), "bundle id");
  const version = reader.readVarUint();
  const defaultProfileIndex = reader.readVarUint();

  const scopeTableCount = reader.readVarUint();
  const scopeTable = [];
  for (let row = 0; row < scopeTableCount; row += 1) {
    const rowLen = reader.readVarUint();
    const scope = [];
    for (let col = 0; col < rowLen; col += 1) {
      scope.push(stringAt(pool, reader.readVarUint(), "scopeTable"));
    }
    scopeTable.push(scope);
  }

  const matchTableCount = reader.readVarUint();
  const matchTable = [];
  for (let index = 0; index < matchTableCount; index += 1) {
    matchTable.push(stringAt(pool, reader.readVarUint(), "matchTable"));
  }

  const categoryTableCount = reader.readVarUint();
  const categoryTable = [];
  for (let index = 0; index < categoryTableCount; index += 1) {
    categoryTable.push(stringAt(pool, reader.readVarUint(), "categoryTable"));
  }

  const severityTableCount = reader.readVarUint();
  const severityTable = [];
  for (let index = 0; index < severityTableCount; index += 1) {
    severityTable.push(stringAt(pool, reader.readVarUint(), "severityTable"));
  }

  const normalizationFieldTableCount = reader.readVarUint();
  const normalizationFieldTable = [];
  for (let index = 0; index < normalizationFieldTableCount; index += 1) {
    normalizationFieldTable.push(
      stringAt(pool, reader.readVarUint(), "normalizationFieldTable"),
    );
  }

  const profileTableCount = reader.readVarUint();
  const profileTable = [];
  for (let index = 0; index < profileTableCount; index += 1) {
    const categoryIndex = reader.readVarUint();
    const matchIndex = reader.readVarUint();
    const scopeIndex = reader.readVarUint();
    const normalizationFieldIndex = reader.readVarUint();
    const severityIndex = reader.readVarUint();
    profileTable.push([
      categoryIndex,
      matchIndex,
      scopeIndex,
      normalizationFieldIndex,
      ...(severityIndex === U32_MAX ? [] : [severityIndex]),
    ]);
  }

  const rulesCount = reader.readVarUint();
  const rules = [];
  for (let index = 0; index < rulesCount; index += 1) {
    const suffix = stringAt(pool, reader.readVarUint(), "rules suffix");
    const profileIndex = reader.readVarUint();
    const explicitTermIndex = reader.readVarUint();
    if (explicitTermIndex === U32_MAX) {
      if (profileIndex === defaultProfileIndex) {
        rules.push(suffix);
      } else {
        rules.push([suffix, profileIndex]);
      }
      continue;
    }
    rules.push([
      suffix,
      profileIndex,
      stringAt(pool, explicitTermIndex, "rules explicitTerm"),
    ]);
  }

  const compositeRulesCount = reader.readVarUint();
  const compositeRules = [];
  for (let index = 0; index < compositeRulesCount; index += 1) {
    const term = stringAt(pool, reader.readVarUint(), "compositeRules term");
    const category = stringAt(
      pool,
      reader.readVarUint(),
      "compositeRules category",
    );
    const scopeIndex = reader.readVarUint();
    const allOfCount = reader.readVarUint();
    const allOf = [];
    for (let item = 0; item < allOfCount; item += 1) {
      allOf.push(stringAt(pool, reader.readVarUint(), "compositeRules allOf"));
    }
    compositeRules.push([term, category, scopeIndex, allOf]);
  }

  if (reader.offset !== buffer.length) {
    throw new Error(
      "Invalid runtime binary bundle: trailing bytes after decode",
    );
  }

  return {
    id,
    version,
    defaultProfileIndex,
    scopeTable,
    matchTable,
    categoryTable,
    severityTable,
    normalizationFieldTable,
    profileTable,
    rules,
    compositeRules,
  };
}

/** @param {string | URL} path */
export function loadRuntimeBundleBinaryFromFile(path) {
  const bundle = decodeRuntimeBundleBinary(fs.readFileSync(path));
  return expandRuntimeBundle(bundle);
}
