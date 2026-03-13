const LATIN = /\p{Script=Latin}/u;
const CYRILLIC = /\p{Script=Cyrillic}/u;
const GREEK = /\p{Script=Greek}/u;
const ARABIC = /\p{Script=Arabic}/u;
const HEBREW = /\p{Script=Hebrew}/u;
const DEVANAGARI = /\p{Script=Devanagari}/u;
const THAI = /\p{Script=Thai}/u;
const HAN = /\p{Script=Han}/u;
const HIRAGANA = /\p{Script=Hiragana}/u;
const KATAKANA = /\p{Script=Katakana}/u;
const HANGUL = /\p{Script=Hangul}/u;

export function detectScriptRisk(value) {
  const scripts = new Set();

  for (const ch of String(value ?? "")) {
    if (LATIN.test(ch)) scripts.add("Latin");
    else if (CYRILLIC.test(ch)) scripts.add("Cyrillic");
    else if (GREEK.test(ch)) scripts.add("Greek");
    else if (ARABIC.test(ch)) scripts.add("Arabic");
    else if (HEBREW.test(ch)) scripts.add("Hebrew");
    else if (DEVANAGARI.test(ch)) scripts.add("Devanagari");
    else if (THAI.test(ch)) scripts.add("Thai");
    else if (HAN.test(ch)) scripts.add("Han");
    else if (HIRAGANA.test(ch)) scripts.add("Hiragana");
    else if (KATAKANA.test(ch)) scripts.add("Katakana");
    else if (HANGUL.test(ch)) scripts.add("Hangul");
  }

  return {
    scripts: Array.from(scripts),
    mixed: scripts.size > 1
  };
}
