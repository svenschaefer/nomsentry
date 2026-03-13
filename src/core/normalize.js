import { foldLeetspeak } from "../unicode/leetspeak.js";
import { foldConfusables } from "../unicode/confusables.js";

export function normalizeValue(value) {
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  const nfkc = trimmed.normalize("NFKC");
  const lower = nfkc.toLowerCase();
  const zeroWidthStripped = lower.replace(/[\u200B-\u200F\uFEFF]/g, "");
  const separatorFolded = zeroWidthStripped
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const compact = separatorFolded.replace(/[^a-z0-9]+/g, "");
  const leetFolded = foldLeetspeak(separatorFolded);
  const confusableSkeleton = foldConfusables(leetFolded);
  const slug = confusableSkeleton
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
    separatorFolded,
    compact,
    leetFolded,
    confusableSkeleton,
    slug
  };
}
