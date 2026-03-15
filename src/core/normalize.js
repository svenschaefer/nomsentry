import { foldLeetspeak } from "../unicode/leetspeak.js";
import { foldConfusables } from "../unicode/confusables.js";
import { foldLatinVariants, stripCombiningMarks } from "../unicode/latinize.js";

const INVISIBLE_OR_CONTROL =
  /[\u0000-\u001F\u007F\u00AD\u034F\u061C\u115F\u1160\u17B4-\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF]/gu;
const SEPARATOR_RUN = /[^\p{L}\p{N}]+/gu;

export function normalizeValue(value) {
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  const nfkc = trimmed.normalize("NFKC");
  const lower = nfkc.toLowerCase();
  const zeroWidthStripped = lower.replace(INVISIBLE_OR_CONTROL, "");
  const technicalExact = stripCombiningMarks(
    foldLatinVariants(foldConfusables(zeroWidthStripped)),
  );
  const leetFolded = foldLeetspeak(zeroWidthStripped);
  const separatorFolded = leetFolded
    .replace(SEPARATOR_RUN, " ")
    .replace(/\s+/g, " ")
    .trim();
  const confusableSkeleton = stripCombiningMarks(
    foldLatinVariants(foldConfusables(separatorFolded)),
  );
  const latinFolded = confusableSkeleton;
  const compact = latinFolded.replace(/[^\p{L}\p{N}]+/gu, "");
  const slug = latinFolded
    .replace(/[^a-z0-9\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    raw,
    trimmed,
    nfkc,
    lower,
    zeroWidthStripped,
    technicalExact,
    separatorFolded,
    leetFolded,
    confusableSkeleton,
    latinFolded,
    compact,
    slug,
  };
}
