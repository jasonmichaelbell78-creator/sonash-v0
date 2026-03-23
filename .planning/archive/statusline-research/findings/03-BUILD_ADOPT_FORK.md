# Build vs. Adopt vs. Fork: Statusline Decision Analysis

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** ACTIVE
**Source:** Session #231, deep analysis of current implementation + 10 external repos
<!-- prettier-ignore-end -->

## Executive Summary

**Recommendation: Option A — Enhance Current**, with a widget-loader pattern
inspired by ccstatusline's architecture.

The current 119-line statusline already follows our security patterns (CSI/OSC
stripping, path containment), is tested (187-line test file), and runs on
Windows 11. The 6 SoNash widgets can be added with ~200-250 lines of new code
using a simple widget-loader pattern. External tools bring complexity (React/Ink
runtime, Rust compilation, npm global installs) that is disproportionate to the
problem size.

---

## Current Implementation Audit

**File:** `.claude/hooks/global/statusline.js` (119 lines) **Test:**
`tests/hooks/global/statusline.test.ts` (187 lines, 16 test cases) **Config:**
`.claude/settings.json` → `statusLine.command`

### What It Does Today

| Widget        | Source                    | Status  |
| ------------- | ------------------------- | ------- |
| Model name    | `data.model.display_name` | Working |
| Git branch    | `execFileSync("git")`     | Working |
| Current task  | Todo file parsing         | Working |
| Directory     | `path.basename(dir)`      | Working |
| Context usage | Progress bar + %          | Working |

### What It Does NOT Do

- Cost tracking (`data.cost.total_cost_usd` — available in API, unused)
- Rate limit display (`data.rate_limits` — available since late 2025)
- Session duration (`data.cost.total_duration_ms` — available, unused)
- Hook warning count (from `.claude/state/hook-warnings-log.jsonl`)
- Tech debt count (from `docs/technical-debt/MASTER_DEBT.jsonl`)
- Commit count this session (from `.claude/hooks/.commit-tracker-state.json`)

### Security Patterns Already In Place

1. **CSI escape stripping:** `\x1b\[[0-9;?]*[ -/]*[@-~]` — prevents ANSI
   injection
2. **OSC escape stripping:** `\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)` — prevents
   terminal title injection
3. **Control char removal:** `[\x00-\x1f\x7f-\x9f]` — prevents C0/C1 control
   sequences
4. **Length capping:** `.slice(0, 80)` — prevents terminal buffer overflow
5. **Path containment:** `/^\.\.(?:[\\/]|$)/.test(rel)` — prevents path
   traversal in todo file reads
6. **execFileSync (not execSync):** No shell injection risk in git calls
7. **windowsHide: true:** Prevents cmd.exe flash on Windows
8. **try/catch everywhere:** Silent failure on all I/O (no error leakage)

---

## External Landscape (Top 5 Candidates Evaluated)

### 1. ccstatusline (sirmalloc/ccstatusline)

| Attribute      | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Stars          | 5.6k                                                       |
| Language       | TypeScript (React + Ink runtime)                           |
| Widgets        | 15+ built-in (Model, Git, Tokens, Cost, Duration, etc.)    |
| Custom widgets | `custom-command` widget — shells out, pipes Claude JSON    |
| Config         | Interactive TUI (React/Ink)                                |
| Dependencies   | React, Ink, plus transitive deps                           |
| License        | MIT                                                        |
| Windows        | Full support (PowerShell, CMD, WSL)                        |
| Security       | No SECURITY.md; no documented sanitization                 |
| Performance    | Block timer caching; Bun runtime option for faster startup |
| Tests          | vitest.config.ts present; coverage unknown                 |
| npm downloads  | ~27k/week                                                  |

**Verdict:** Most feature-rich. But React/Ink runtime for a statusline is heavy.
Custom-command widget could theoretically work for SoNash, but we'd be shelling
out to read our own state files — defeating the purpose. No sanitization means
we'd need to audit + patch.

### 2. CCometixLine (Haleclipse/CCometixLine)

| Attribute      | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Stars          | 2.3k                                                         |
| Language       | Rust (compiled binary)                                       |
| Widgets        | 7 segments (Dir, Git, Model, Usage, Time, Cost, OutputStyle) |
| Custom widgets | Custom themes via TOML; no arbitrary widget API              |
| Config         | TOML (`~/.claude/ccline/config.toml`)                        |
| Dependencies   | Git 1.5+, Nerd Font                                          |
| License        | MIT                                                          |
| Windows        | Full support; winget installable                             |
| Security       | Automatic backups; no sanitization docs                      |
| Performance    | Rust = fast; single binary, no runtime                       |
| Tests          | No test suite documented                                     |

**Verdict:** Fast and clean. But Rust compilation adds build complexity. No
custom widget API means SoNash widgets would require forking. TOML config is
nice but we'd need to maintain a Rust fork — wrong language for this team.

### 3. claude-powerline (Owloops/claude-powerline)

| Attribute      | Value                                         |
| -------------- | --------------------------------------------- |
| Stars          | 937                                           |
| Language       | TypeScript/Node.js                            |
| Widgets        | 6+ segments with 4 display styles             |
| Custom widgets | `env` segment (reads env vars); no plugin API |
| Config         | JSON (`.claude-powerline.json`)               |
| Dependencies   | Zero external dependencies                    |
| License        | MIT                                           |
| Windows        | Not explicitly documented                     |
| Security       | No security docs                              |
| Performance    | "Lightweight and fast" claim; no benchmarks   |
| Tests          | Jest config present; coverage unknown         |

**Verdict:** Zero-dep is attractive. But no custom widget system — the `env`
segment is too limited for SoNash state file parsing. Would need significant
forking.

### 4. kamranahmedse/claude-statusline

| Attribute      | Value                                       |
| -------------- | ------------------------------------------- |
| Stars          | Popular (kamranahmedse is a well-known dev) |
| Language       | Bash (shell script)                         |
| Widgets        | 3 (Limits, Directory, Git)                  |
| Custom widgets | None — single script                        |
| Config         | Direct script editing                       |
| Dependencies   | jq, curl, git                               |
| License        | MIT                                         |
| Windows        | Requires jq + curl on PATH                  |
| Security       | No sanitization                             |

**Verdict:** Too minimal. Less capable than what we already have.

### 5. levz0r/claude-code-statusline

| Attribute      | Value                     |
| -------------- | ------------------------- |
| Stars          | Mid-range                 |
| Language       | Node.js                   |
| Widgets        | Token tracking, cost, git |
| Custom widgets | Not documented            |
| Config         | Script-based              |

**Verdict:** Similar scope to our current implementation. No advantage.

---

## The 6 SoNash Widgets (Proposed)

These are project-specific health metrics drawn from SoNash state files. No
external tool provides these — they are unique to our hook/skill ecosystem.

| #   | Widget           | Data Source                                     | Complexity |
| --- | ---------------- | ----------------------------------------------- | ---------- |
| 1   | Cost tracker     | `data.cost.total_cost_usd` (API JSON)           | Low        |
| 2   | Rate limits      | `data.rate_limits.five_hour.used_percentage`    | Low        |
| 3   | Session duration | `data.cost.total_duration_ms` (API JSON)        | Low        |
| 4   | Hook warnings    | `.claude/state/hook-warnings-log.jsonl` (count) | Medium     |
| 5   | Commit count     | `.claude/hooks/.commit-tracker-state.json`      | Low        |
| 6   | Lines changed    | `data.cost.total_lines_added/removed`           | Low        |

**Key insight:** Widgets 1, 2, 3, and 6 only need fields already in the Claude
Code JSON stdin — zero file I/O. Widget 5 reads one small JSON file. Only Widget
4 needs JSONL line counting. Total new code: ~80-120 lines for all 6.

---

## Option A: Enhance Current (Detailed)

### Architecture Change

Current: monolithic single-function output builder. Proposed: widget-array
pattern where each widget is a small function.

```
// Conceptual structure (not implementation)
const widgets = [
  modelWidget,      // existing
  branchWidget,     // existing
  taskWidget,       // existing
  dirWidget,        // existing
  contextWidget,    // existing
  costWidget,       // NEW — data.cost.total_cost_usd
  rateLimitWidget,  // NEW — data.rate_limits.five_hour
  durationWidget,   // NEW — data.cost.total_duration_ms
  hookWarnsWidget,  // NEW — count lines in hook-warnings-log.jsonl
  commitsWidget,    // NEW — read commit-tracker-state.json
  linesWidget,      // NEW — data.cost.total_lines_added/removed
];
```

### Effort Estimate

| Task                                               | Lines | Hours |
| -------------------------------------------------- | ----- | ----- |
| Refactor to widget array pattern                   | ~40   | 0.5   |
| 4 JSON-only widgets (cost, rate, dur, loc)         | ~60   | 0.5   |
| 2 file-reading widgets (hooks, commits)            | ~50   | 0.5   |
| Multi-line support (line 1: info, line 2: metrics) | ~20   | 0.25  |
| Tests for 6 new widgets                            | ~120  | 1.0   |
| Total                                              | ~290  | 2.75  |

### Final file size: ~320-350 lines (from 119)

### Pros

- Full control over security patterns (CSI/OSC stripping stays)
- Already tested, already works on Windows 11
- No new dependencies (zero)
- No runtime overhead (no React/Ink, no Rust compilation)
- SoNash-specific widgets are first-class, not shelled-out hacks
- Matches existing coding standards (CommonJS, try/catch, sanitize)
- Pre-commit hook and patterns:check already cover this file
- Solo developer can maintain 350 lines easily

### Cons

- More code to write upfront (~2.75 hours)
- No community themes or powerline styling
- No interactive TUI for configuration
- Must manually add new Claude JSON fields when they appear

---

## Option B: Adopt External (ccstatusline)

### What We'd Gain

- 15+ built-in widgets with professional styling
- Powerline rendering, themes, TUI configuration
- Community maintenance (5.6k stars, active development)
- Cost/rate-limit/duration widgets already exist

### What We'd Lose

1. **Security patterns** — ccstatusline has no documented sanitization. Our
   CSI/OSC stripping, path containment, and control char removal would be gone.
   We'd need to audit ~5k+ lines of React/Ink/TypeScript code.
2. **Test coverage** — our 16 test cases covering sanitization, path traversal,
   and edge cases. ccstatusline's coverage is unknown.
3. **SoNash widgets** — hook warnings, commit count, tech debt would need
   `custom-command` widgets that shell out to read our state files — slow and
   fragile.
4. **Simplicity** — 119 lines becomes a dependency on React + Ink + transitive
   deps. `npx ccstatusline` adds startup latency.
5. **Control** — version pinning, breaking changes, maintainer decisions outside
   our control.

### Integration Effort

| Task                                    | Hours |
| --------------------------------------- | ----- |
| Install and configure ccstatusline      | 0.5   |
| Create 3 custom-command widget scripts  | 2.0   |
| Security audit of ccstatusline source   | 4.0   |
| Remove our statusline.js + update tests | 0.5   |
| Regression testing on Windows 11        | 1.0   |
| Total                                   | 8.0   |

### Risk Assessment

- **Dependency risk:** HIGH — React/Ink are heavy deps for a statusline
- **Abandonment risk:** MEDIUM — 5.6k stars but single maintainer
- **Security risk:** HIGH — no sanitization documented; terminal injection
  possible via unsanitized model names or branch names
- **Performance risk:** MEDIUM — React/Ink startup vs. raw Node.js
- **Windows risk:** LOW — documented Windows support

---

## Option C: Fork ccstatusline + Customize

### What We'd Keep

- Widget architecture and rendering engine
- Theme system and powerline styling
- Built-in widgets for cost, git, context, rate limits

### What We'd Replace

- Add sanitization layer (our CSI/OSC/control char stripping)
- Replace `custom-command` widget with native SoNash widget loader
- Strip React/Ink TUI (we don't need interactive config)
- Add our test patterns

### What We'd Add

- 3 SoNash-specific widgets (hook warnings, commits, debt count)
- Security test suite matching our current coverage
- Windows 11 regression tests

### Effort Estimate

| Task                                      | Hours |
| ----------------------------------------- | ----- |
| Fork and understand codebase (~5k lines)  | 3.0   |
| Strip TUI, add sanitization layer         | 4.0   |
| Create 3 SoNash native widgets            | 2.0   |
| Port and extend test suite                | 3.0   |
| Windows 11 compatibility testing          | 1.0   |
| Ongoing: merge upstream changes quarterly | 2.0/q |
| Total (initial)                           | 13.0  |
| Total (annual maintenance)                | 21.0  |

### Risk Assessment

- **Fork drift risk:** HIGH — upstream changes break our patches within months
- **Maintenance burden:** HIGH — must track upstream, resolve merge conflicts,
  re-audit security on each merge
- **Complexity risk:** HIGH — maintaining a fork of React/Ink TypeScript code is
  a poor fit for a solo developer
- **Benefit realization:** LOW — we'd end up rewriting most of what we keep

---

## Decision Matrix

| Criterion           | Wt  | A: Enhance Current | B: Adopt External | C: Fork + Customize |
| ------------------- | --- | ------------------ | ----------------- | ------------------- |
| **Security**        | 25% | 10 — our patterns  | 3 — no sanitize   | 6 — we'd add it     |
| **Performance**     | 15% | 9 — raw Node.js    | 6 — React/Ink     | 7 — stripped fork   |
| **Windows 11**      | 15% | 10 — tested, works | 7 — documented    | 7 — inherited       |
| **Maintainability** | 20% | 9 — 350 lines      | 5 — 5k+ dep       | 3 — fork drift      |
| **Extensibility**   | 15% | 7 — widget array   | 9 — full system   | 8 — native + fork   |
| **Test coverage**   | 10% | 9 — 16 tests exist | 4 — unknown       | 6 — we'd add        |
| **Weighted Score**  |     | **9.00**           | **5.35**          | **5.85**            |

### Scoring Key

- 10 = Best possible for our context
- 7-9 = Good, minor trade-offs
- 4-6 = Acceptable, significant trade-offs
- 1-3 = Poor fit for our context

---

## Detailed Score Justification

### Security (25% weight)

- **A (10):** CSI/OSC stripping, path containment, execFileSync — all patterns
  from CLAUDE.md Section 5 already enforced. Covered by `patterns:check`.
- **B (3):** No SECURITY.md, no documented sanitization. `custom-command` widget
  executes arbitrary shell commands. Would need full audit before use.
- **C (6):** We'd add our sanitization layer, but must re-audit on every
  upstream merge. Ongoing security debt.

### Performance (15% weight)

- **A (9):** Pure Node.js, no framework overhead. `execFileSync` for git with
  1000ms timeout. Total execution well under 50ms.
- **B (6):** React/Ink adds startup overhead. Bun option mitigates but adds
  another runtime dependency. Custom-command widgets shell out (extra process
  per widget).
- **C (7):** Stripped fork removes TUI overhead but retains React rendering
  pipeline.

### Windows 11 (15% weight)

- **A (10):** Already running on our Windows 11 machine. `windowsHide: true`
  prevents cmd.exe flash. Path handling uses `path.join`/`path.resolve`.
- **B (7):** Documented support for PowerShell, CMD, WSL. Known issue #6526
  (statusline not displaying on Windows 11 + PowerShell) was reported against
  Claude Code's built-in, but third-party tools may have their own issues.
- **C (7):** Inherits B's Windows support but we'd need to verify our patches
  don't break it.

### Maintainability (20% weight)

- **A (9):** 350 lines, single file, no dependencies, one developer can
  understand entirely. Already follows our coding standards.
- **B (5):** ~5k+ lines of TypeScript + React/Ink. Version updates may break
  config. Must track npm advisories for transitive deps.
- **C (3):** Fork maintenance is the worst of all worlds — upstream tracking,
  merge conflicts, re-auditing, and our own patches. Solo developer nightmare.

### Extensibility (15% weight)

- **A (7):** Widget-array pattern is simple but effective. Adding a new widget
  is one function + one array entry. No themes or powerline, but those are
  cosmetic for a solo developer's terminal.
- **B (9):** Full widget system, custom-command for arbitrary data, themes,
  powerline, TUI. Most extensible by far.
- **C (8):** Inherits B's extensibility plus native SoNash widgets. Slightly
  less than B because fork drift may break widget compatibility.

### Test Coverage (10% weight)

- **A (9):** 16 existing tests covering sanitization, path traversal, context
  computation, and JSON parsing. New widgets would add ~8-12 more tests.
- **B (4):** vitest.config.ts present but coverage metrics unknown. No
  security-focused tests visible.
- **C (6):** We'd port our tests and add new ones, but must maintain test
  compatibility across upstream merges.

---

## Contrarian Analysis

### "But ccstatusline has 5.6k stars and 27k weekly downloads!"

Stars measure popularity, not fitness for our context. ccstatusline solves a
general problem (pretty statuslines for everyone). We have a specific problem (6
SoNash health metrics with security constraints on Windows 11). General
solutions require adaptation; specific solutions work immediately.

### "But you're reinventing the wheel!"

The wheel is 119 lines. Adding 6 widgets is ~200 lines. The "wheel" we'd be
adopting is 5k+ lines of React/Ink TypeScript with unknown security properties.
The cost of adoption exceeds the cost of enhancement.

### "But what about future features you haven't thought of?"

If we later want powerline rendering or themes, we can extract the rendering
logic from ccstatusline at that point. The widget-array pattern makes our
statusline a clean data source that could feed into any renderer. We're not
locked in.

### "What if Claude Code changes the JSON schema?"

This affects ALL approaches equally. Our widget functions read specific fields
with `?.` optional chaining and `|| 0` fallbacks — the same pattern every
external tool uses. Schema changes require the same 1-line fix regardless of
approach.

---

## Action Items (If Option A Approved)

1. Refactor `statusline.js` to widget-array pattern
2. Add 4 JSON-only widgets (cost, rate limits, duration, lines changed)
3. Add 2 file-reading widgets (hook warnings count, commit count)
4. Add multi-line output (line 1: identity/git, line 2: metrics)
5. Add ~12 tests for new widgets
6. Update `settings.json` if command changes (unlikely — same file)
7. Verify Windows 11 rendering of multi-line output

**Estimated effort:** 2.75 hours (1 session) **Risk:** Low — additive changes to
a working system

---

## Sources

### External Repositories Evaluated

- [sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline) — 5.6k
  stars, TypeScript/React/Ink, 15+ widgets
- [Haleclipse/CCometixLine](https://github.com/Haleclipse/CCometixLine) — 2.3k
  stars, Rust, 7 segments
- [Owloops/claude-powerline](https://github.com/Owloops/claude-powerline) — 937
  stars, TypeScript, zero deps, 4 display styles
- [kamranahmedse/claude-statusline](https://github.com/kamranahmedse/claude-statusline)
  — Minimal Bash, 3 widgets
- [levz0r/claude-code-statusline](https://github.com/levz0r/claude-code-statusline)
  — Node.js, token tracking + cost
- [rz1989s/claude-code-statusline](https://github.com/rz1989s/claude-code-statusline)
  — Flexible layouts, MCP monitoring
- [chongdashu/cc-statusline](https://github.com/chongdashu/cc-statusline) —
  Real-time metrics, session tracking
- [daniel3303/ClaudeCodeStatusLine](https://github.com/daniel3303/ClaudeCodeStatusLine)
  — Model, tokens, rate limits, git
- [hagan/claudia-statusline](https://github.com/hagan/claudia-statusline) —
  Rust, SQLite persistence
- [sotayamashita/claude-code-statusline](https://github.com/sotayamashita/claude-code-statusline)
  — Lightweight statusline

### Official Documentation

- [Claude Code Statusline Docs](https://code.claude.com/docs/en/statusline) —
  Full JSON schema, examples, Windows config
- [Claude Code Hooks Docs](https://code.claude.com/docs/en/hooks) — Hook
  lifecycle and statusline integration

### Meta-Directories

- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
  — 28.7k stars, curated skills/hooks/plugins
- [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit)
  — 135 agents, 150+ plugins, 19 hooks

---

## Convergence Tally

| Pass | Confirmed | Corrected | Extended | New |
| ---- | --------- | --------- | -------- | --- |
| 1    | 0         | 0         | 0        | 18  |
| 2    | 16        | 1         | 3        | 0   |
| 3    | 19        | 0         | 0        | 0   |

**Convergence: STRICT** (Pass 3 = 0 corrections, 0 new findings)

Pass 2 correction: initial assessment scored ccstatusline Windows support at 8;
corrected to 7 after finding Claude Code issue #6526 documenting Windows 11
statusline display failures.
