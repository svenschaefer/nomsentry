const LEET_MAP = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t"
};

export function foldLeetspeak(str) {
  return String(str ?? "").replace(/[013457]/g, (c) => LEET_MAP[c] || c);
}
