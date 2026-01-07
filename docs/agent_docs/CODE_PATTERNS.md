# Code Review Patterns Reference

**Document Version:** 1.2
**Last Updated:** 2026-01-07
**Source:** Distilled from 82 AI code reviews

---

## Purpose

This document contains detailed code patterns and anti-patterns learned from AI code reviews. These patterns are **enforced by `npm run patterns:check`** - this file serves as a reference when investigating violations or understanding why a pattern exists.

**Quick Reference**: See [claude.md](../../claude.md) Section 4 for the 5 critical patterns that apply to every session.

---

## Pattern Categories

- [Bash/Shell](#bashshell)
- [npm/Dependencies](#npmdependencies)
- [Security](#security)
- [GitHub Actions](#github-actions)
- [JavaScript/TypeScript](#javascripttypescript)
- [CI/Automation](#ciautomation)
- [Git](#git)
- [Documentation](#documentation)
- [General](#general)

---

## Bash/Shell

| Pattern | Rule | Why |
|---------|------|-----|
| Exit code capture | `if ! OUT=$(cmd); then` NOT `OUT=$(cmd); if [ $? -ne 0 ]` | Captures assignment exit, not command |
| HEAD~N commits | Use `COMMIT_COUNT - 1` as max | HEAD~N needs N+1 commits |
| File iteration | `while IFS= read -r file` NOT `for file in $list` | Spaces break for loop |
| Subshell scope | Use temp file or `while read; done < <(cmd)` | `cmd | while read` loses variables |
| Temp file cleanup | `trap 'rm -f "$TMPFILE"' EXIT` | Guaranteed cleanup |
| Exit code semantics | 0=success, 1=action-needed, 2=error | Check explicitly |
| Retry loops | `for i in 1 2 3; do cmd && break; sleep 5; done` | Race condition handling |
| printf over echo | `printf '%s' "$VAR"` NOT `echo "$VAR"` | -n/-e injection risk |
| End-of-options | `basename -- "$PATH"` | Prevents `-` as options |
| Portable word boundaries | `(^|[^[:alnum:]])(word)([^[:alnum:]]|$)` NOT `\b` | Not portable ERE |
| Pipeline failure | Add `|| VAR=""` fallback | Commands may fail with pipefail |
| Terminal sanitization | `tr -cd '[:alnum:] ,_-'` | Strip ANSI escapes |
| grep --exclude | `--exclude="storage.ts"` NOT `--exclude="lib/utils/storage.ts"` | Matches basename only |
| Process substitution (Bash-only) | `while IFS= read -r line; do ...; done < <(cmd)` NOT `cmd | while read` | Preserves exit codes + safe reads |
| Bash wrapper for scripts | Wrap bash-specific code in `bash -lc '...'` with quote escaping | Avoids breaking POSIX sh |
| set -o pipefail (Bash/Zsh/Ksh) | Add before pipes in bash-based validation scripts | Catch pipe failures |

---

## npm/Dependencies

| Pattern | Rule | Why |
|---------|------|-----|
| CI installs | `npm ci` NOT `npm install` | Prevents lockfile drift |
| Adding packages | Ask "does project actually use X?" | Avoid unnecessary deps |
| Peer deps | Must be in lockfile | `npm ci` fails in Cloud Build |
| Husky CI | `husky || echo 'not available'` | Graceful degradation |
| Lockfile corruption | `rm package-lock.json && npm install && npm ci` | Regenerate and verify |

---

## Security

| Pattern | Rule | Why |
|---------|------|-----|
| File path validation | Validate within repo root before operations | Prevent traversal |
| Path traversal check | `/^\.\.(?:[\\/]|$)/.test(rel)` NOT `startsWith('..')` | Avoids false positives |
| Reject traversal | `if [[ "$PATH" == *"../"* ]]; then exit; fi` | Don't strip `../` |
| Containment | Apply path validation at ALL touch points | Not just entry point |
| CLI arg validation | Check existence, non-empty, not another flag at parse | `if (!arg || arg.startsWith('--')) { reject; }` |
| Empty path edge case | Check `rel === ''` | Resolving `.` gives empty relative |
| Windows cross-drive | Check drive letters match | Before path.relative() checks |
| Shell interpolation | Sanitize inputs | Command injection risk |
| External input | Never trust in execSync/spawn | Command injection |
| Markdown output | Escape backticks, `${{ }}` | Injection risk |
| Word boundary keywords | `(^|[^[:alnum:]])(auth|token|...)([^[:alnum:]]|$)` | "monkey" shouldn't match "key" |
| Bound output | Limit count (e.g., `jq '.[0:50]'`) and length (`${VAR:0:500}`) | Prevent DoS |
| Hook output | Only output safe metadata | Never expose secrets |
| .env files | Never recommend committing | Use environment vars |
| Symlink escape | `realpathSync()` after resolve() | Verify real path in project |
| Fail-closed realpath | If realpathSync fails but file exists, reject | `catch { if (existsSync(path)) return false; }` |
| PII masking | `maskEmail()` → `u***@d***.com` | Privacy in logs |
| Audit logging | JSON with timestamp, operator, action, target, result | Structured logs |

---

## GitHub Actions

| Pattern | Rule | Why |
|---------|------|-----|
| JS template literals | `process.env.VAR` NOT `${{ }}` | Injection risk |
| Command failure | Use exit codes, not output parsing | Reliable detection |
| File list separator | `separator: "\n"` with `while IFS= read -r` | Proper iteration |
| Separate stderr | `cmd 2>err.log` | Keep JSON parseable |
| if conditions | Explicit `${{ }}` | YAML parser issues |
| Retry loops | Track success explicitly | Don't assume loop exit = success |
| Output comparison | `== '4'` not `== 4` | Outputs are strings |
| Label auto-creation | Check getLabel, create on 404 | Fresh repos/forks |
| Event-specific | `context.payload.action === 'opened'` | Avoid spam on synchronize |
| API error tolerance | Catch 404/422 on removeLabel | Label may be gone |

---

## JavaScript/TypeScript

| Pattern | Rule | Why |
|---------|------|-----|
| Error sanitization | Use `scripts/lib/sanitize-error.js` | Strip sensitive paths |
| Error first line | `.split('\n')[0].replace(/\r$/, '')` | Handles CRLF |
| Control char strip | `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g` | Preserves \t\n\r |
| OSC escape strip | `/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g` | With ANSI CSI |
| File-derived content | Strip control chars before console.log | Not just errors |
| Safe error handling | `error instanceof Error ? error.message : String(error)` | Non-Error throws |
| Robust non-Error | `error && typeof error === 'object' && 'message' in error` | Full check |
| Cross-platform paths | `path.relative()` not `startsWith()` | Path validation |
| path.relative() trap | `".."` returned without separator for `/a` → `/` | Check `rel === '..'` too |
| Normalize backslashes | `.replace(/\\/g, '/')` before security checks | Path traversal |
| CRLF in regex | `\r?\n` instead of `\n` | Cross-platform |
| Windows cross-drive | Check for `/^[A-Za-z]:/` in relative output | Absolute path returned |
| Windows path sanitize | `.replace(/[A-Z]:\\Users\\[^\\]+/gi, '[HOME]')` | gi flag |
| Markdown links | `.replace(/\\/g, '/')` | Normalize backslashes |
| lstatSync | Wrap in try-catch | Permission denied, broken symlinks |
| File reads | Wrap ALL in try/catch | existsSync race, permissions |
| Main module detect | Wrap in try-catch with fallback | Unusual paths throw |
| maxBuffer | `10 * 1024 * 1024` for execSync | Large output |
| Global flag for exec() | `/g` REQUIRED in while loops | No /g = infinite loop |
| Regex brace matching | `[^}]` not `[\s\S]` | Single-brace-level |
| Path boundary anchor | `(?:^|[\\/])` prefix | Prevent substring matches |

---

## CI/Automation

| Pattern | Rule | Why |
|---------|------|-----|
| CI mode | Check ALL, no truncation | Limits for interactive only |
| Invalid files | Fail on exists && !valid && required | Not just missing |
| Explicit flags | Fail explicitly if flag target missing | Even interactive |
| Readline close | Create helper, call on all paths | Prevent hang |
| File moves | grep for filename in .github/, scripts/ | Update CI refs |

---

## Git

| Pattern | Rule | Why |
|---------|------|-----|
| File renames | grep for old terminology | Not just filenames |
| Lockfile changes | `rm -rf node_modules && npm ci` | Verify clean |

---

## Documentation

| Pattern | Rule | Why |
|---------|------|-----|
| Relative paths in subdirs | Files in `docs/templates/` use `../file.md` NOT `docs/file.md` | Path relative to file location |
| Path calculation | From `docs/reviews/2026-Q1/`: to `docs/` = `../../`, to root = `../../../` | Count directory levels |
| Link verification | `test -f path` from target directory before committing | Prevent broken links |
| Template placeholders | Replace ALL tokens before use (`[e.g., X]`, `YYYY-MM-DD`, `16.1.1`) | Fill with actual values |
| Archived doc paths | Moving `docs/X.md` → `docs/archive/X.md` requires `./file` → `../file` | Path prefix adjustment |
| Version history dates | Use actual commit date, not template creation date | Accurate audit trail |
| Security doc explicitness | "NEVER use X" NOT "if using X on client" | Explicit prohibitions |
| Tech-appropriate checks | Adapt security checklists to stack (Firestore ≠ SQL) | Avoid irrelevant checks |
| Model name accuracy | Verify exact model identifiers against provider docs; avoid invented names | Prevent invalid/ambiguous model selection |
| Stale review detection | `git log --oneline COMMIT..HEAD \| wc -l` - if >5, verify each | Review may be outdated |
| Relative path depth | Test links from actual file location; count `../` for each level up | Most common link breakage source (8+ occurrences #73-82) |
| Metadata synchronization | Update ranges/counts/dates atomically with content changes | 6 consecutive reviews caught drift (#73-79) |
| Model name consistency | Use API identifiers: `gpt-4o` not `GPT-4o` or `ChatGPT-4o` | Standardization across all docs |
| JSON/JSONL validity | All schema examples must be valid, parseable JSON/JSONL | Enable copy-paste testing with jq |
| NO-REPO MODE output | Specify "header + zero lines" not placeholder text | Prevents parser-breaking invalid JSONL |
| Template placeholders | Use `[Date]` not `YYYY-MM-DD`, use `null` not `X` in JSON | Clear, valid examples |

---

## General

| Pattern | Rule | Why |
|---------|------|-----|
| UNDERSTAND FIRST | Ask "Does project use X?" before adding | One correct fix > ten wrong |
| package.json changes | What's the REAL error? Peer dep? | Think before changing |
| .test() in loops | Remove `g` flag | Stateful lastIndex |
| AI path suggestions | `ls -la path` first | Verify existence |
| Nested code fences | Use `````  or `~~~` | When content has ``` |
| Effort estimates | Verify rollup = sum of components | Catch stale estimates |
| Pattern fix audit | Audit entire file | Partial fixes = false confidence |

---

## Enforcement

These patterns are automatically enforced by:
- `npm run patterns:check` - Pre-commit hook
- `npm run patterns:check-all` - Full repo scan
- `.claude/hooks/pattern-check.sh` - PostToolUse hook

When a violation is flagged, reference this document for the pattern details and fix guidance.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-01-07 | CONSOLIDATION #7: Reviews #73-82 - Added 9 patterns (3 Bash/Shell, 6 Documentation) from Multi-AI Audit and Doc Linter reviews |
| 1.1 | 2026-01-06 | CONSOLIDATION #6: Reviews #61-72 - Added Documentation category (10 patterns) |
| 1.0 | 2026-01-05 | Initial extraction from claude.md Section 4 (90+ patterns from 60 reviews) |

---

**END OF DOCUMENT**
