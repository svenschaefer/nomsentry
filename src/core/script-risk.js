const LATIN = /\p{Script=Latin}/u;
const CYRILLIC = /\p{Script=Cyrillic}/u;
const GREEK = /\p{Script=Greek}/u;

export function detectScriptRisk(value) {
  const scripts = new Set();

  for (const ch of String(value ?? "")) {
    if (LATIN.test(ch)) scripts.add("Latin");
    else if (CYRILLIC.test(ch)) scripts.add("Cyrillic");
    else if (GREEK.test(ch)) scripts.add("Greek");
  }

  return {
    scripts: Array.from(scripts),
    mixed: scripts.size > 1
  };
}
