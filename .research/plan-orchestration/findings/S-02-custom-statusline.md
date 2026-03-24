# Findings: Plan Inventory -- custom-statusline

**Searcher:** deep-research-searcher (plan-inventory specialist)
**Profile:** codebase
**Date:** 2026-03-24
**Sub-Question IDs:** S-02

---

## 1. Step Inventory Table

The plan contains **14 steps**. Steps 2-3 and 4-5-6 have explicit parallelization notes within the plan. Steps 13-14 are terminal.

| Step ID | Description | Files Touched | Effort | Internal Dependencies | Can Parallelize? |
|---------|-------------|---------------|--------|----------------------|------------------|
| Step 1 | Initialize Go Module and Project Structure | `tools/statusline/` (NEW dir), `tools/statusline/main.go` (NEW), `tools/statusline/go.mod` (NEW) | S (15 min) | None | Standalone |
| Step 2 | Config System (TOML parsing, defaults, local override merge) | `tools/statusline/config.go` (NEW), `tools/statusline/config.toml` (NEW), `tools/statusline/config.local.toml.example` (NEW), `tools/statusline/.gitignore` (NEW) | M (30-45 min) | Step 1 | Yes, with Step 3 |
| Step 3 | Stdin JSON Parser (read Claude Code v2.1.81 schema from stdin) | `tools/statusline/main.go` (MODIFY - created in Step 1) | M (30-45 min) | Step 1 | Yes, with Step 2 |
| Step 4 | Stdin-Only Widgets (12 widgets: A1,A3,A4,A6,B2,B3,C1,C5,C6,C7,C8,F4) | `tools/statusline/widgets.go` (NEW) | M (45-60 min) | Steps 2, 3 | Yes, with Steps 5 and 6 |
| Step 5 | Git Branch Widget (B1 -- shell-out with 5s cache) | `tools/statusline/widgets.go` (MODIFY - created in Step 4) | S (15-20 min) | Step 1 | Yes, with Steps 4 and 6 |
| Step 6 | File-Read Widgets (5 widgets: D1,D5,E1,F15,I4) | `tools/statusline/widgets.go` (MODIFY) | M (30-45 min) | Steps 2, 3 | Yes, with Steps 4 and 5 |
| Step 7 | Cache System for API-Backed Widgets (background fetch, backoff, staleness) | `tools/statusline/cache.go` (NEW) | M (45-60 min) | Step 2 | Independent of Steps 4-6 |
| Step 8 | API-Backed Widgets (4 widgets: F6,F7,H2,H3 -- weather + GitHub) | `tools/statusline/widgets.go` (MODIFY), `tools/statusline/cache.go` (MODIFY) | M (30-45 min) | Step 7 | No (blocked on Step 7) |
| Step 9 | 3-Line Renderer (layout assembly, ANSI 16-color, sanitization) | `tools/statusline/render.go` (NEW) | M (45-60 min) | Steps 4, 5, 6, 8 | No (needs all widgets) |
| Step 10 | Build Script (verify Go, test, compile, install, update settings.json) | `tools/statusline/build.sh` (NEW), `.claude/settings.json` (MODIFY -- via script at runtime) | M (30-45 min) | Steps 1-9 | No (sequential gate) |
| Step 11 | Cross-Locale Setup Documentation | `tools/statusline/config.local.toml.example` (MODIFY -- add header docs), `tools/statusline/build.sh` (MODIFY -- add missing-config warning) | S (15-20 min) | Step 10 | No (sequential after Step 10) |
| Step 12 | Remove Old Statusline | `.claude/hooks/global/statusline.js` (DELETE), `tests/hooks/global/statusline.test.ts` (DELETE), `dist-tests/tests/hooks/global/statusline.test.js` (DELETE) | S (10-15 min) | Step 10 (new statusline must be verified first) | No (sequential after Step 10) |
| Step 13 | Testing (10-test matrix: unit, integration, missing data, cache, stale, perf, settings, live, width, cross-locale) | `tools/statusline/statusline_test.go` (NEW -- technically created across Steps 2-8 as tests are written alongside) | L (60-90 min) | Steps 10, 11, 12 | No (terminal step) |
| Step 14 | Audit (code-reviewer agent, 8-point security checklist) | No files created; reviews `tools/statusline/*` | M (30-45 min) | All implementation steps | No (terminal step) |

**Step count: 14 steps total.** Matches PLAN.md exactly (Steps 1-14).

### Parallelization DAG (from plan's own notes)

```
Step 1
  |
  +---> Step 2 --+---> Step 4 --+
  |              |               |
  +---> Step 3 --+---> Step 5 --+---> Step 9 ---> Step 10 ---> Step 11
                 |               |                   |
                 +---> Step 6 --+                   +---> Step 12
                 |                                   |
                 +---> Step 7 ---> Step 8 ---+       +---> Step 13
                                             |               |
                                             +-------+       +---> Step 14
```

Critical path: 1 -> 2 -> 7 -> 8 -> 9 -> 10 -> 13 -> 14 (longest chain)

---

## 2. External Touchpoints

### Files Created (11 NEW files)

All within the **new** `tools/statusline/` directory (does NOT exist yet):

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `tools/statusline/main.go` | Entry point: stdin reader, widget orchestrator, stdout writer, background cache goroutine |
| 2 | `tools/statusline/config.go` | TOML config parsing, defaults, local override merge |
| 3 | `tools/statusline/widgets.go` | All 22 widget functions |
| 4 | `tools/statusline/cache.go` | Background fetch, backoff logic, staleness detection |
| 5 | `tools/statusline/render.go` | 3-line layout assembly, ANSI 16-color, separators |
| 6 | `tools/statusline/statusline_test.go` | Go tests: per-widget unit tests + full binary integration test |
| 7 | `tools/statusline/config.toml` | Shared defaults (committed): thresholds, widget order, colors |
| 8 | `tools/statusline/config.local.toml.example` | Example local config for per-machine overrides |
| 9 | `tools/statusline/build.sh` | Full setup: verify Go, test, compile, install, update settings.json |
| 10 | `tools/statusline/.gitignore` | Ignores `config.local.toml`, compiled binary, cache files |
| 11 | `tools/statusline/go.mod` | Go module definition with TOML dependency |

### Files Modified (2 existing files)

| # | File Path | Current State | Modification |
|---|-----------|---------------|-------------|
| 1 | `.claude/settings.json` | EXISTS (174 lines). Currently has `statusLine.command` pointing to `bash .claude/hooks/ensure-fnm.sh node .claude/hooks/global/statusline.js` | Update `statusLine.command` to point to compiled Go binary at `~/.claude/statusline/sonash-statusline` |
| 2 | `.gitignore` | EXISTS. Currently has NO statusline-related entries | Add `tools/statusline/config.local.toml` and binary patterns |

### Files Deleted (3 existing files)

| # | File Path | Current State | Reason |
|---|-----------|---------------|--------|
| 1 | `.claude/hooks/global/statusline.js` | EXISTS (4,210 bytes, dated 2026-03-19) | Replaced by Go binary |
| 2 | `tests/hooks/global/statusline.test.ts` | EXISTS (6,469 bytes, dated 2026-03-19) | Replaced by Go tests |
| 3 | `dist-tests/tests/hooks/global/statusline.test.js` | EXISTS (7,897 bytes, dated 2026-03-24) | Compiled version of removed TS test |

### Runtime Artifacts Created (not in repo)

| Path | Purpose |
|------|---------|
| `~/.claude/statusline/sonash-statusline` (or `.exe` on Windows) | Compiled binary (installed by build.sh) |
| `~/.claude/statusline/cache/weather.json` | Cached weather API response |
| `~/.claude/statusline/cache/github-pr.json` | Cached GitHub PR status |
| `~/.claude/statusline/cache/github-ci.json` | Cached GitHub CI status |
| `~/.claude/statusline/cache/backoff.json` | Backoff state for API retries |
| `~/.claude/statusline/sessions-today.count` | Session counter (resets daily) |

### Skills, Hooks, or Agent Definitions Affected

- **statusLine hook:** The `statusLine` entry in `.claude/settings.json` changes from a Node.js hook to a direct Go binary invocation. This eliminates the `ensure-fnm.sh` wrapper.
- **No hooks are created or modified** -- the Go binary is not a hook, it is a standalone command invoked by the `statusLine.command` config.
- **No agent definitions affected.**
- **No skill definitions affected.**

### External Tools/Languages Required

| Tool | Version Required | Current Status | Risk |
|------|-----------------|----------------|------|
| **Go compiler** | 1.21+ (for generics, slices package) | **INSTALLED: go1.23.6 windows/amd64** | LOW -- already available |
| **`github.com/BurntSushi/toml`** | Latest | Not yet fetched (will be via `go mod tidy`) | LOW -- well-established Go library |
| **`gh` CLI** | Any recent version | Assumed available (used elsewhere in project) | LOW |
| **OpenWeatherMap API** | Free tier | Requires API key in `config.local.toml` | MEDIUM -- per-machine setup, weather widgets non-functional without it |
| **Git** | Any | Available | NONE |

### Config Files Changed

| File | Change Type | Impact |
|------|-------------|--------|
| `.claude/settings.json` | MODIFY `statusLine.command` | Changes how Claude Code invokes the statusline. Immediate effect on restart. |
| `.gitignore` | ADD entries | Prevents local config and binary from being committed |
| `tools/statusline/config.toml` | NEW (committed) | Shared defaults for all locales |
| `tools/statusline/config.local.toml` | NEW (gitignored) | Per-machine overrides (API keys, paths) |

---

## 3. Effort Summary

### Total Estimated Effort

| Metric | Estimate | Basis |
|--------|----------|-------|
| **Total development time** | 8-12 hours of focused coding | Sum of step estimates: ~450-615 minutes |
| **Session count** | 3-4 sessions | From DIAGNOSIS.md: "L (3-4 sessions)" |
| **Complexity** | HIGH | New language (Go), 22 widgets, API integration, cache system, cross-platform |

### Per-Step Risk Assessment

| Step | Effort | Risk | Risk Factors |
|------|--------|------|-------------|
| Step 1 | S (15 min) | LOW | Boilerplate Go module setup |
| Step 2 | M (30-45 min) | LOW | TOML parsing is straightforward with BurntSushi/toml |
| Step 3 | M (30-45 min) | MEDIUM | Must match Claude Code's stdin JSON schema exactly. Schema is not formally documented -- derived from research observations. |
| Step 4 | M (45-60 min) | LOW | 12 widgets, but all simple data formatting from known struct fields |
| Step 5 | S (15-20 min) | LOW | Simple shell-out + in-memory cache |
| Step 6 | M (30-45 min) | MEDIUM | Reads 5 different file formats from 5 different locations. File paths are platform-sensitive (Windows paths). F15 (uptime) has OS-specific implementation (`net stats workstation` or `wmic` on Windows). |
| Step 7 | M (45-60 min) | MEDIUM-HIGH | Background goroutine in a short-lived binary is an unusual pattern. The binary exits after rendering, so "background fetch" means spawn-and-don't-wait. Cache file locking and race conditions are possible if two statusline invocations overlap. |
| Step 8 | M (30-45 min) | MEDIUM | Weather API requires a key. `gh` CLI must be authenticated. API response parsing can break if response format changes. |
| Step 9 | M (45-60 min) | MEDIUM | Must handle variable-width terminals, sanitize all dynamic values, and assemble 22 widgets into a 3-line layout without wrapping or crashing. |
| Step 10 | M (30-45 min) | MEDIUM | Build script must work on Windows (Git Bash). Uses `node -e` to update JSON (fragile). Path handling across Windows/Unix. |
| Step 11 | S (15-20 min) | LOW | Documentation only |
| Step 12 | S (10-15 min) | LOW | Simple file deletion, but must verify new statusline works first |
| Step 13 | L (60-90 min) | MEDIUM | 10-test matrix is comprehensive. Cache and stale tests require timing manipulation. Cross-locale test requires second machine. |
| Step 14 | M (30-45 min) | LOW | Standard code review. No novel security concerns beyond input sanitization. |

### External Dependency Risks

| Dependency | Risk Level | Mitigation |
|------------|-----------|------------|
| Go compiler | LOW | Already installed (go1.23.6). No installation needed. |
| `BurntSushi/toml` Go package | LOW | Mature, stable, no known issues. `go mod tidy` will fetch. |
| OpenWeatherMap API key | MEDIUM | Free tier requires signup. Without it, weather widgets show `...` placeholder (graceful degradation). Not blocking. |
| Claude Code stdin JSON schema | MEDIUM | Schema is reverse-engineered from observations (v2.1.81). If Claude Code changes schema, widgets may break. No official schema guarantee. |
| `gh` CLI availability | LOW | Already used elsewhere in the project. |
| Windows Git Bash compatibility | MEDIUM | build.sh uses bash. Tested path resolution (`$(cd "$(dirname "$0")" && pwd)`) should work but Windows path separators can surprise. |

---

## 4. Pre/Post Conditions

### Pre-Conditions (must be true before this plan starts)

| # | Condition | Current Status | Verified? |
|---|-----------|----------------|-----------|
| 1 | Go compiler installed (1.21+) | go1.23.6 windows/amd64 | YES (verified via `go version`) |
| 2 | `tools/statusline/` directory does NOT exist | Confirmed: does not exist | YES (verified via `ls`) |
| 3 | Existing statusline (`statusline.js`) is functional | EXISTS at `.claude/hooks/global/statusline.js` (4.2KB) | YES |
| 4 | `.claude/settings.json` exists and has `statusLine` config | EXISTS, currently points to Node.js statusline | YES |
| 5 | `gh` CLI is available and authenticated | Assumed (used in other project workflows) | NOT VERIFIED |
| 6 | Internet access for `go mod tidy` (one-time dep fetch) | Required for BurntSushi/toml download | ASSUMED |
| 7 | OpenWeatherMap API key (for weather widgets) | Required in `config.local.toml` but NOT blocking -- graceful degradation | N/A (optional) |

### Post-Conditions (what will be true after this plan completes)

| # | Condition | Verification |
|---|-----------|-------------|
| 1 | `tools/statusline/` contains 11 source files (Go + config + build script) | `ls tools/statusline/` |
| 2 | Go binary compiled and installed to `~/.claude/statusline/sonash-statusline` | File exists at install path |
| 3 | `.claude/settings.json` `statusLine.command` points to Go binary | Read settings.json, verify command path |
| 4 | Old Node.js statusline files deleted (3 files) | Confirm absence of `statusline.js`, `statusline.test.ts`, `statusline.test.js` |
| 5 | `.gitignore` includes `tools/statusline/config.local.toml` and binary patterns | Read .gitignore |
| 6 | 22-widget, 3-line statusline renders in Claude Code in <50ms | Live test + `time` measurement |
| 7 | Go tests pass (`go test ./...` in `tools/statusline/`) | Test output |
| 8 | Cache system creates `~/.claude/statusline/cache/` directory structure | Verify after first run |
| 9 | Cross-locale setup documented in `config.local.toml.example` | Read example file |
| 10 | Code audit complete with no unresolved security issues | Audit checklist in Step 14 |

### What Other Plans Benefit From This Plan Completing First?

| Benefiting Plan | Relationship | Strength |
|-----------------|-------------|----------|
| **repo-cleanup** | The old `statusline.js` and its test file are candidates for cleanup. If custom-statusline runs first, repo-cleanup won't need to handle them. If repo-cleanup runs first, it should leave these files alone (they're actively used until replaced). | WEAK -- either order works, but custom-statusline-first avoids cleanup then re-creation. |
| **cli-tools-implementation** | The research notes that Starship (from CLI tools plan) will provide branch/directory at the prompt, making those statusline widgets partially redundant. However, the plan keeps them regardless (Decision #2: always-visible). No actual dependency. | NONE -- independent. |
| **passive-surfacing-remediation** | Passive surfacing addresses guardrail #6 (unacknowledged warnings). The statusline's hook health (D1), unacked warnings (D5), and anomaly indicators serve a complementary purpose. No dependency, but the two plans reinforce each other. | INFORMATIONAL -- complementary, not dependent. |
| **system-wide-standardization (SWS)** | SWS would potentially want to standardize the statusline's config format and test patterns. If custom-statusline completes first, SWS has a concrete artifact to standardize against rather than planning abstractly. | WEAK -- SWS benefits from seeing the final state but doesn't depend on it. |

### What Plans Must Complete Before This One?

**None.** The custom-statusline plan is fully self-contained. It creates a new Go project from scratch, uses only an already-installed Go compiler, and replaces (not extends) the existing Node.js statusline.

However, there is a **sequencing recommendation** from DIAGNOSIS.md: repo-cleanup should ideally run first to "clean house for everything else." This is a soft preference, not a hard dependency. The custom-statusline plan will not be affected by repo-cleanup running before or after.

---

## Convergence Loop Verification

### CL-1: Step count match

PLAN.md contains Steps 1 through 14. My inventory contains 14 rows. **MATCH.**

### CL-2: File path existence verification

| File Path | Status | Correctly Classified? |
|-----------|--------|----------------------|
| `tools/statusline/` (all 11 files) | Does NOT exist | YES -- classified as NEW |
| `.claude/settings.json` | EXISTS (verified, 174 lines) | YES -- classified as MODIFY |
| `.gitignore` | EXISTS (verified, no statusline entries) | YES -- classified as MODIFY |
| `.claude/hooks/global/statusline.js` | EXISTS (verified, 4,210 bytes) | YES -- classified as DELETE |
| `tests/hooks/global/statusline.test.ts` | EXISTS (verified, 6,469 bytes) | YES -- classified as DELETE |
| `dist-tests/tests/hooks/global/statusline.test.js` | EXISTS (verified, 7,897 bytes) | YES -- classified as DELETE |

**All paths verified against filesystem. No errors.**

### CL-3: Effort estimate grounding

- Total effort "3-4 sessions" comes directly from DIAGNOSIS.md (line 18: "L (3-4 sessions)")
- Individual step efforts are inferred from plan descriptions (widget counts, file counts, complexity markers) -- these are my estimates, not from the plan text. The plan itself says "L (full build in one pass, then extensive testing)" (line 11-12) but does not give per-step estimates.
- **Correction applied:** Marked per-step estimates as my assessment, not plan-stated.

### CL-4: Missing steps, sub-steps, or conditional branches

- The plan mentions `go.mod` creation in Step 1's file list but does not give it its own step -- it is part of Step 1. Correctly captured.
- Step 6 mentions widget I4 (session count) has special logic: "the binary increments a counter file on first run of each session (keyed by session_id from stdin). Counter resets when date changes." This is a notable sub-behavior within Step 6. Captured in the risk notes.
- Step 12 has a conditional note: "keep [old statusline.js] until Go version is verified working" -- this means Step 12 depends on Step 10 verification, not just Step 10 completion. Correctly captured in dependency column.
- Step 13 test matrix has 10 explicit tests. All accounted for in the effort estimate.
- **No missing steps or branches found.**

### CL-5: External tool requirements

- **Go:** Plan does not specify a minimum version. The `BurntSushi/toml` library requires Go 1.16+. The `go.mod` will likely specify 1.21+ (modern convention). Go 1.23.6 is installed -- well above any requirement. **Verified.**
- **`gh` CLI:** Required for GitHub PR/CI widgets (H2, H3). Not version-specific. **Assumed available.**
- **OpenWeatherMap API:** Free tier, requires signup for API key. Not blocking (graceful degradation). **Noted.**

---

## Sources

| # | Source | Type | Trust | Date |
|---|--------|------|-------|------|
| 1 | `.planning/custom-statusline/PLAN.md` | Primary plan document | HIGHEST (filesystem) | 2026-03-23 |
| 2 | `.planning/custom-statusline/DECISIONS.md` | Design decisions | HIGHEST (filesystem) | 2026-03-23 |
| 3 | `.planning/plan-orchestration/DIAGNOSIS.md` | Orchestration context | HIGHEST (filesystem) | 2026-03-23 |
| 4 | `.research/custom-statusline/RESEARCH_OUTPUT.md` | Prior L1 research | HIGH (filesystem) | 2026-03-23 |
| 5 | `.claude/settings.json` | Current config state | HIGHEST (filesystem, live) | 2026-03-23 |
| 6 | `go version` output | Tool verification | HIGHEST (runtime) | 2026-03-24 |
| 7 | Filesystem `ls` checks | File existence verification | HIGHEST (runtime) | 2026-03-24 |

## Contradictions

**None found.** The PLAN.md and DECISIONS.md are fully consistent. The DIAGNOSIS.md effort estimate ("L (3-4 sessions)") aligns with the plan's "L (full build in one pass, then extensive testing)."

One minor ambiguity: The PLAN.md says "Modified Files (3)" in its header (line 41-47) but lists `.gitignore` modification only as "Add patterns" without specifying it as a formal modify step. The actual modification happens implicitly during Step 2 (`.gitignore` in `tools/statusline/`) and Step 10/build process (root `.gitignore`). The root `.gitignore` modification is not assigned to any specific step -- it may be an oversight or assumed as part of Step 10 or Step 12 cleanup.

## Gaps

1. **No per-step effort estimates in the plan itself.** The plan provides only a total "L" estimate. My per-step estimates are inferred from complexity, not stated.
2. **No explicit Go version minimum.** The plan mentions Go but not a minimum version. This is a minor gap -- go1.23.6 is well above any reasonable requirement.
3. **Root `.gitignore` modification has no owning step.** The plan lists it as a modified file but no step explicitly says "update root .gitignore."
4. **Cross-locale test (Step 13, test #10) requires a second machine.** The plan does not discuss how to perform this test if only one machine is available during the build session.
5. **`gh` CLI availability is assumed but not verified** by this inventory. The plan's build.sh does not check for `gh`.
6. **Windows-specific uptime widget (F15)** uses `net stats workstation` or `wmic`. The plan does not specify which, or how to handle the deprecation of `wmic` on modern Windows 11.

## Serendipity

1. **The `dist-tests/tests/hooks/global/statusline.test.js` file** (compiled JS test) is listed for deletion in the plan but was not in the plan's "Removed Files" section. The plan lists only 1 removed file (`.claude/hooks/global/statusline.js`) and 1 modified/removed test (`tests/hooks/global/statusline.test.ts`). The dist-tests compiled version is a third file that should also be deleted. This was discovered during filesystem verification and IS mentioned in Step 12 of the plan body -- it just wasn't in the header summary.

2. **The `ensure-fnm.sh` wrapper overhead is eliminated.** The current statusline invocation chain is `bash ensure-fnm.sh node statusline.js`, which the research measured at 47-470ms. The Go binary will be invoked directly, removing both the bash wrapper and Node.js startup. This is a significant performance win beyond just the widget rendering speed.

## Confidence Assessment

- HIGH claims: 12 (step inventory, file paths, existence checks, Go version, effort classification)
- MEDIUM claims: 4 (per-step effort estimates, risk assessments, Windows-specific behavior, cache race conditions)
- LOW claims: 0
- UNVERIFIED claims: 1 (`gh` CLI availability)
- Overall confidence: **HIGH**
