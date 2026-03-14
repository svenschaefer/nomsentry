# Third-Party Notices

This repository includes imported or derived artifacts from third-party data sources and libraries.
The project itself is licensed under the MIT license in [LICENSE](/C:/code/nomsentry/LICENSE). Third-party sources keep their own licenses and usage conditions.

The current maintained source families are:

- official register or standards sources
- direct wordlist or lexicon sources
- library-backed imported datasets

## Data sources

### LDNOOBW

- Purpose: multilingual profanity and abuse terms
- Used in: `custom/sources/ldnoobw-<language>.json`
- Source: https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
- License: CC BY 4.0
- Notes: imported and normalized into the repository's source format

### insult.wiki

- Purpose: English and German insult terms
- Used in:
  - `custom/sources/insult-wiki-en.json`
  - `custom/sources/insult-wiki-de.json`
- Source: https://www.insult.wiki/
- License: CC0 1.0
- Notes: imported from the publicly browsable HTML lists and normalized into the repository's source format

### cuss

- Purpose: profanity terms with rating metadata
- Used in: `custom/sources/cuss-<language>.json`
- Source: https://github.com/words/cuss
- License: MIT
- Notes: imported and normalized into the repository's source format; source ratings are mapped to runtime severities

### dsojevic/profanity-list

- Purpose: structured profanity terms with severity metadata
- Used in: `custom/sources/dsojevic-profanity-en.json`
- Source: https://github.com/dsojevic/profanity-list
- License: MIT
- Notes: imported conservatively; only literal match entries are converted into runtime rules

### USPTO Trademark Bulk Data

- Purpose: official US trademark source for the derived `protectedBrand` review subset
- Used in: `custom/sources/derived-uspto-brand-risk.json`
- Source: https://www.uspto.gov/trademarks/apply/check-status-view-documents/trademark-bulk-data
- License / status: official US government bulk data, publicly accessible
- Notes: the repository stores only a derived runtime subset by default; local full imports under `data/uspto/` are ignored by git

### RFC 2142

- Purpose: standard role mailbox names for impersonation detection
- Used in: `custom/sources/rfc2142-role-mailboxes.json`
- Source: https://www.rfc-editor.org/rfc/rfc2142
- License / status: standards document; repository use is limited to extraction of short factual standardized role names

### Microsoft Learn Windows reserved device names

- Purpose: reserved technical identifiers
- Used in: `custom/sources/windows-reserved-device-names.json`
- Source: https://learn.microsoft.com/windows/win32/fileio/naming-a-file
- License / status: Microsoft documentation; repository use is limited to extraction of short factual reserved names

## Library-backed imported datasets

### @2toad/profanity

- Purpose: profanity terms
- Used in: `custom/sources/2toad-profanity-<language>.json`
- Source: https://www.npmjs.com/package/%402toad/profanity
- License: MIT
- Notes: imported and normalized into the repository's source format

### obscenity

- Purpose: English profanity terms
- Used in: `custom/sources/obscenity-en.json`
- Source: https://www.npmjs.com/package/obscenity
- License: MIT
- Notes: imported and normalized into the repository's source format
