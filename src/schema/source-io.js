import fs from "node:fs";
import path from "node:path";
import { compactSource } from "./source-format.js";

function pruneMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const pruned = {};
  for (const key of ["source", "language", "license", "sourceUrl", "notes"]) {
    if (metadata[key] !== undefined) pruned[key] = metadata[key];
  }

  return Object.keys(pruned).length > 0 ? pruned : undefined;
}

function pruneSource(source) {
  const pruned = {
    id: source.id,
    ...(source.description ? { description: source.description } : {}),
    ...(pruneMetadata(source.metadata) ? { metadata: pruneMetadata(source.metadata) } : {})
  };

  if (source.ruleDefaults) {
    const ruleDefaults = { ...source.ruleDefaults };
    delete ruleDefaults.metadata;
    if (Object.keys(ruleDefaults).length > 0) {
      pruned.ruleDefaults = ruleDefaults;
    }
  }

  if (Array.isArray(source.rules)) {
    pruned.rules = source.rules.map((rule) => {
      if (!Array.isArray(rule)) {
        const nextRule = { ...rule };
        delete nextRule.metadata;
        return nextRule;
      }

      if (rule.length < 3 || typeof rule[2] !== "object" || rule[2] === null) {
        return rule;
      }

      const override = { ...rule[2] };
      delete override.metadata;
      return Object.keys(override).length > 0 ? [rule[0], rule[1], override] : [rule[0], rule[1]];
    });
  }

  if (Array.isArray(source.compositeRules)) {
    pruned.compositeRules = source.compositeRules;
  }

  return pruned;
}

export function serializeSource(source) {
  return `${JSON.stringify(pruneSource(compactSource(source)))}\n`;
}

export function writeTextFileAtomic(targetPath, content) {
  const directory = path.dirname(targetPath);
  const tempPath = path.join(
    directory,
    `.${path.basename(targetPath)}.tmp-${process.pid}-${Date.now()}`
  );

  fs.mkdirSync(directory, { recursive: true });
  try {
    fs.writeFileSync(tempPath, content, "utf8");
    fs.renameSync(tempPath, targetPath);
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { force: true });
    }
  }
}

export function writeSourceFile(path, source) {
  writeTextFileAtomic(path, serializeSource(source));
}
