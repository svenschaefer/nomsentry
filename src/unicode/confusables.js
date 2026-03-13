const CONFUSABLES = {
  "а": "a",
  "е": "e",
  "і": "i",
  "о": "o",
  "р": "p",
  "с": "c",
  "х": "x",
  "ѕ": "s",
  "у": "y"
};

export function foldConfusables(str) {
  return Array.from(String(str ?? "")).map((ch) => CONFUSABLES[ch] || ch).join("");
}
