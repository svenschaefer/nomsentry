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
- License / status: official factual source, publicly accessible; treated here as a limited extracted factual source rather than an open-source licensed dataset
- Notes: the repository stores only a derived runtime subset by default; local full imports under `data/uspto/` are ignored by git

### RFC 2142

- Purpose: standard role mailbox names for impersonation detection
- Used in: `custom/sources/rfc2142-role-mailboxes.json`
- Source: https://www.rfc-editor.org/rfc/rfc2142
- License / status: normative standards source; treated here as a limited extracted factual source of short standardized role names rather than an open-source licensed dataset

### GitLab reserved project and group names

- Purpose: reserved technical identifiers for route and namespace collision prevention
- Used in: `custom/sources/gitlab-reserved-names.json`
- Source: https://docs.gitlab.com/user/reserved_names/
- License / status: CC BY-SA 4.0 documentation source; treated here as a limited extracted factual source of reserved route-like identifiers
- Notes: imported conservatively from the documented reserved project and group names; file-like entries and path fragments are excluded

### reserved-usernames

- Purpose: reserved technical identifiers for namespace and system-identifier collisions
- Used in: `custom/sources/reserved-usernames.json`
- Source: https://github.com/mvila/reserved-usernames
- License: MIT
- Notes: imported through a conservative derived filter that keeps only clearly technical or namespace-collision terms from the broader package dataset

### Microsoft Learn Windows reserved device names

- Purpose: reserved technical identifiers
- Used in: `custom/sources/windows-reserved-device-names.json`
- Source: https://learn.microsoft.com/windows/win32/fileio/naming-a-file
- License / status: normative documentation source; treated here as a limited extracted factual source of short reserved names rather than an open-source licensed dataset

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
