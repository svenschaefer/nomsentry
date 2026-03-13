const LATIN_EQUIVALENTS = {
  "ß": "ss",
  "æ": "ae",
  "œ": "oe",
  "ø": "o",
  "ð": "d",
  "þ": "th",
  "ł": "l",
  "đ": "d",
  "ı": "i"
};

export function foldLatinVariants(str) {
  return Array.from(String(str ?? ""))
    .map((ch) => LATIN_EQUIVALENTS[ch] || ch)
    .join("");
}

export function stripCombiningMarks(str) {
  return String(str ?? "")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "");
}
