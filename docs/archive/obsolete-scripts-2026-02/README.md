# Obsolete Scripts Archive (2026-02-05)

Scripts archived as part of the SonarCloud integration consolidation.

## Archived Scripts

| Script                                   | Superseded By                               | Reason                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extract-sonarcloud.js`                  | `scripts/debt/sync-sonarcloud.js`           | Reads from static JSON files (`docs/analysis/*.json`). The new script fetches live from SonarCloud API with deduplication and TDMS schema compliance. |
| `generate-sonar-report-with-snippets.js` | `scripts/generate-detailed-sonar-report.js` | Less configurable version with hardcoded paths. Superseded by the more flexible detailed report generator.                                            |

## References Updated

- `scripts/debt/consolidate-all.js` - Marked extract-sonarcloud.js step as
  non-required
- `scripts/check-pattern-compliance.js` - Removed from pathExcludeList
- Unified `/sonarcloud` skill created as single entry point
