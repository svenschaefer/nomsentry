import fs from "node:fs";
import path from "node:path";

function read(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`Docs consistency check failed: missing ${label}`);
  }
}

const readme = read("README.md");
const architecture = read("docs/ARCHITECTURE.md");
const spec = read("docs/SPEC.md");
const notices = read("THIRD_PARTY_NOTICES.md");

for (const required of [
  "dist/runtime-sources.json",
  "dist/build-manifest.json",
  "nomsentry",
  "GitHub",
]) {
  assertIncludes(readme, required, `README token: ${required}`);
}

for (const required of [
  "dist/runtime-sources.json",
  "dist/build-manifest.json",
  "custom/sources/",
  "USPTO",
  "RFC 2142",
  "Microsoft Windows reserved device names",
  "words/profanities",
]) {
  assertIncludes(architecture, required, `ARCHITECTURE token: ${required}`);
}

assertIncludes(
  architecture,
  "`RFC 2142` feeds `impersonation`",
  "ARCHITECTURE RFC 2142 category note",
);
assertIncludes(spec, "`impersonation`", "SPEC impersonation category section");
assertIncludes(
  spec,
  "official and normative identifier artifacts",
  "SPEC runtime input phrasing",
);

for (const required of [
  "LDNOOBW",
  "insult.wiki",
  "cuss",
  "dsojevic/profanity-list",
  "@2toad/profanity",
  "obscenity",
  "USPTO Trademark Bulk Data",
  "RFC 2142",
  "GitHub Enterprise reserved usernames",
  "ICANN .com reserved names",
  "Microsoft Learn Windows reserved device names",
  "Microsoft Learn Windows reserved URI schemes",
]) {
  assertIncludes(notices, required, `THIRD_PARTY_NOTICES token: ${required}`);
}

console.log("Docs consistency checks passed");
