# Deep Read: public-apis/public-apis

**Date:** 2026-04-06 | **Skill Version:** 4.2

## Artifact Discovery

20 files total (excluding images). Key internal artifacts beyond README:

| Artifact                                          | Read?      | Knowledge Beyond Code                                                   |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| README.md (1895 lines)                            | Yes        | ~1,490 API entries across 51 categories with structured metadata.       |
| CONTRIBUTING.md                                   | Yes        | Format requirements: 5 auth types, 3 CORS values, 100-char desc limit.  |
| scripts/validate/format.py (277 lines)            | Yes (v4.1) | Regex-based format enforcement. Category structure, alphabetical order. |
| scripts/validate/links.py (273 lines)             | Yes (v4.1) | URL liveness checking with duplicate detection.                         |
| scripts/tests/test_validate_format.py (466 lines) | Not read   | Test suite for format validation.                                       |
| scripts/tests/test_validate_links.py (172 lines)  | Not read   | Test suite for link validation.                                         |
| .github/workflows/validate_links.yml              | Yes        | Daily cron + manual trigger. Python 3.8, pip install, validate README.  |
| .github/workflows/test_of_push_and_pull.yml       | Not read   | CI for PRs.                                                             |
| .github/workflows/test_of_validate_package.yml    | Not read   | CI for validate package.                                                |
| .github/PULL_REQUEST_TEMPLATE.md                  | Yes        | 10-item checklist: format, alphabetical, desc length, squash.           |
| .github/ISSUE_TEMPLATE.md                         | Not read   | Issue template.                                                         |
| scripts/README.md                                 | Yes        | Usage guide for validation scripts.                                     |
| scripts/github_pull_request.sh                    | Not read   | Shell script for PR validation.                                         |
| LICENSE                                           | Not read   | MIT.                                                                    |

## Key Findings From Deep Read

1. **validate_links.yml is a complete link-checking workflow.** Runs daily via
   cron (`0 0 * * *`) + manual trigger. Python 3.8 + pip + custom
   scripts/validate/links.py. This is the transferable pattern: scheduled link
   validation for any Markdown artifact with embedded URLs.

2. **PR template is a 10-item quality checklist.** Enforces format, alphabetical
   ordering, description limits, squash commits. The format rules are strict
   enough that format.py can validate programmatically.

3. **scripts/README.md documents the validation pipeline clearly.** Install
   deps, run format validation, run link validation (full or duplicate-only with
   `-odlc` flag). The `-odlc` shortcut for quick duplicate checking is a nice UX
   touch.

4. **The structured API entry format**
   (Name|Description|Auth|HTTPS|CORS|Postman) is machine-parseable. 807 no-auth
   APIs, 33 in Health, 33 in Weather, 18 in Calendar, 17 in Text Analysis. These
   counts directly inform content evaluation.

## External References Cataloged for Phase 4b

- 1,490 API entries across 51 categories (the repo's entire content)
- APILayer commercial APIs (10 promoted in README header)
- Discord server link
- GitHub API for the project itself (davemachado/public-api)
