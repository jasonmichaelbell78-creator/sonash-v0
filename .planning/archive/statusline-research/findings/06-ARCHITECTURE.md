# Statusline Architecture Research

<!-- prettier-ignore-start -->
**Date:** 2026-03-20
**Author:** Claude (architecture research)
**Scope:** Evaluate 4 architecture options for custom Claude Code statusline with widget support
**Status:** COMPLETE
<!-- prettier-ignore-end -->

---

## Executive Summary

Four architecture options were evaluated against the requirements of a solo
developer maintaining 6 custom health widgets in a Claude Code statusline.
External CLI tools (Starship, Oh-My-Posh, tmux-powerline) and existing Claude
Code statusline repos (ccstatusline, syou6162/ccstatusline) were analyzed for
applicable patterns.

**Recommendation: Option D (Compiled/Bundled)** is the best fit, combining
modular development (per-widget files, testable, extensible) with single-file
deployment (fast startup, zero runtime file I/O for plugin loading, matches
existing codebase pattern). However, Option B (Plugin Architecture) is a viable
runner-up if the build step is considered too heavy.

---

## 1. Current State Analysis

### 1.1 Existing Statusline Implementation

The current statusline is a single 118-line Node.js file at
`.claude/hooks/global/statusline.js`. It:

- Reads JSON from stdin (Claude Code pipes
  `{ model, workspace, session_id, context_window, cost, ... }`)
- Computes context window bar display
- Reads todo files for current task
- Executes `git rev-parse` for branch name
- Outputs a single formatted line to stdout

**Strengths of current approach:**

- Zero dependencies (pure Node.js + `child_process`)
- Fast: one `execFileSync` call, one filesystem scan, string formatting
- Uses codebase security patterns: sanitization, path traversal checks,
  try/catch on all file reads
- Well-tested: 187-line test file with unit tests for all computed values

**Weaknesses:**

- Monolithic: adding a widget means editing the single file
- No widget isolation: a bug in one data source can crash the entire statusline
- No per-widget configuration: users cannot enable/disable individual widgets
- No caching: git branch re-computed every render cycle

### 1.2 Codebase Patterns That Constrain the Design

| Pattern             | Source                               | Constraint                                                              |
| ------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Error sanitization  | `scripts/lib/sanitize-error.js`      | All error messages must pass through sanitizers; no raw `error.message` |
| Path traversal      | `scripts/lib/security-helpers.js`    | `/^\.\.(?:[\\/]$)/.test(rel)` for all path validation                   |
| File reads          | `CLAUDE.md` Section 5                | ALL file reads wrapped in try/catch (existsSync race condition)         |
| Symlink guard       | `.claude/hooks/lib/symlink-guard.js` | All file writes must check isSafeToWrite                                |
| Atomic state writes | `.claude/hooks/lib/state-utils.js`   | tmp+backup swap pattern for JSON persistence                            |
| No `any`            | `tsconfig` strict mode               | TypeScript strict, no `any` (relevant for test files)                   |
| exec() with /g      | `CLAUDE.md` Section 5                | All regex exec loops require `/g` flag                                  |

### 1.3 Claude Code Statusline API Contract

Claude Code invokes the statusline command (configured in `settings.json`
`statusLine.command`) and pipes JSON to stdin containing:

```
{
  hook_event_name, session_id, cwd,
  model: { id, display_name },
  workspace: { current_dir, project_dir },
  version,
  cost: { total_cost_usd, total_duration_ms, total_api_duration_ms,
          total_lines_added, total_lines_removed },
  context_window: { total_input_tokens, total_output_tokens,
                    context_window_size, used_percentage,
                    remaining_percentage, current_usage }
}
```

**Triggers:** After each assistant message, permission mode change, vim mode
toggle. Debounced at 300ms.

**Output:** Script prints one line to stdout; Claude Code displays it as-is.

---

## 2. External Tool Architecture Analysis

### 2.1 Starship (Rust, ~100+ modules)

**Architecture: Compiled monolith with registry-based module dispatch.**

- Each module is a Rust file in `src/modules/` that follows a standard contract:
  `context.new_module(name)` -> configure -> detect -> collect data -> format
- All modules registered in a `ALL_MODULES` constant in `src/module.rs`
- A `Module` struct contains segments, configuration, and metadata
- Configuration is per-module via `starship.toml` with Serde
  serialization/deserialization
- `StringFormatter` handles template-based output with variables, styles, and
  conditionals
- Parallel execution via Rayon (min of CPU cores and 8 threads)
- Lazy evaluation: `scan_timeout` and `command_timeout` prevent slow modules
  from blocking
- Caching: `OnceLock<Repo>` for git data, `OnceLock<DirContents>` for filesystem
  scans

**Key takeaway:** Even with 100+ modules, Starship uses a compiled monolith with
a registry. Modules are not dynamically loaded -- they are compiled in.
Configuration controls which modules activate, not which modules exist.

**Applicable patterns:**

- Registry constant listing all widgets
- Per-widget configuration with defaults
- Timeout per data source
- Lazy/cached expensive operations (git, filesystem)

### 2.2 Oh-My-Posh (Go, 100+ segments)

**Architecture: Compiled monolith with interface-based segment dispatch.**

- Each segment implements the `SegmentWriter` interface: `Enabled()`,
  `Template()`, `SetText()`, `SetIndex()`, `Text()`, `Init(props, env)`
- Segments embed a `Base` struct for shared fields
- All segment structs registered with `encoding/gob` in `init()` for async mode
- Engine spawns concurrent workers for enabled segments
- Go templates (with Sprig functions) for output formatting
- Configuration via JSON/YAML/TOML theme files
- Gob-encoded cache entries pass segment data across process boundaries

**Key takeaway:** Oh-My-Posh uses a well-defined interface contract. Each
segment is a Go struct, not a plugin. The compile step registers everything; the
config file controls what activates.

**Applicable patterns:**

- Interface/contract per widget (`enabled()`, `render()`, `init()`)
- Concurrent execution of independent widgets
- Base struct/mixin for shared functionality (sanitization, caching)
- Config file controls activation, not code loading

### 2.3 tmux-powerline (Bash, extensible segments)

**Architecture: Pure bash with segment scripts as plugins.**

- Segments are individual bash scripts in a `segments/` directory
- Each segment script outputs text to stdout
- Theme files define which segments appear in which position
- Custom segments live in `$XDG_CONFIG_HOME/tmux-powerline/`
- Any language can be used with a shell wrapper
- Simple interface: script outputs text, framework handles layout

**Key takeaway:** The simplest plugin model. Works because each segment is an
independent process. Not performant (many process spawns), but maximally
extensible.

**Applicable patterns:**

- Segment scripts as the unit of extension
- Theme/layout separation from segment logic
- User-configurable segment directory

### 2.4 Existing Claude Code Statusline Repos

**sirmalloc/ccstatusline (Bun/TypeScript, widget-based):**

- Organized into Widgets, Utils, Main Module
- Each widget is a module that handles its own data extraction and formatting
- Uses Bun as runtime -- not compatible with Node.js-only environments

**syou6162/ccstatusline (Go, YAML-driven):**

- Config-driven: YAML defines "actions" with shell commands and templates
- Each action has: name, command, prefix, color, cache TTL
- Template expansion with `{.field}` JQ-style syntax
- Go binary: fast, but requires separate compilation

**daniel3303/ClaudeCodeStatusLine (Bash, single-file):**

- Single `statusline.sh` bash script
- Demonstrates the minimal viable approach
- No widget isolation or configurability

---

## 3. Architecture Option Analysis

### 3.1 Option A: Single-File Monolith (Current Approach)

**How widgets are added (DX):** Edit the one file. Add a function, wire it into
the output template. No isolation -- must understand the full file.

**How widgets are configured (UX):** No configuration. Every widget always
renders. To disable, comment out code.

**Performance model:**

- Startup: ~5-10ms (Node.js script, no module resolution beyond stdlib)
- Per-render: ~15-30ms (one git exec, one dir scan, string formatting)
- Scales linearly with widget count but all in one process

**Testing strategy:** Extract functions, test in isolation (current approach
with `statusline.test.ts`). Works but requires duplicating function signatures.

**Fit with codebase:** Perfect match -- all existing hooks are single-file
scripts. Security patterns are inline.

**6 SoNash widgets:** Manageable at 6, but the file grows to ~300-400 lines.
Each widget's data fetching, caching, and formatting logic is interleaved.

**Verdict:** Adequate for 6 widgets. Gets unwieldy at 10+. No isolation means
one widget crash kills the entire statusline.

| Criterion            | Score (1-5) |
| -------------------- | ----------- |
| Extensibility        | 2           |
| Widget isolation     | 1           |
| Performance          | 5           |
| Testability          | 3           |
| Codebase fit         | 5           |
| User configurability | 1           |
| **Total**            | **17/30**   |

### 3.2 Option B: Plugin Architecture

**How widgets are added (DX):** Create a new `.js` file in `widgets/` directory
following a documented contract. Export `{ name, enabled, render, config }`.
Core auto-discovers via `readdirSync`.

**How widgets are configured (UX):** JSON config file
(`.claude/statusline-config.json`) lists enabled widgets, per-widget options,
and layout order. Widgets not in config use defaults.

**Performance model:**

- Startup: ~15-30ms (readdirSync + N requires for widget files)
- Per-render: ~20-40ms (same data fetching, but per-widget try/catch isolation)
- Node.js `require()` cache means subsequent loads are instant -- first load is
  the cost
- Risk: filesystem scan on every statusline invocation (mitigated by caching
  widget list)

**Testing strategy:** Each widget file is independently testable. Core rendering
is testable with mock widgets. Clean separation of concerns.

**Fit with codebase:** Moderate. The hooks directory uses single-file scripts,
but `scripts/lib/` already demonstrates the shared-module pattern. Plugin
loading adds a new pattern but not an alien one.

**6 SoNash widgets:** Natural fit. Each widget is 30-60 lines. Core is ~80 lines
for layout, rendering, stdin parsing, and widget orchestration.

**Implementation sketch:**

```
.claude/hooks/global/
  statusline.js          # Core: stdin parse, widget load, layout, render
  widgets/
    context-window.js    # Widget: context bar
    git-branch.js        # Widget: branch name
    current-task.js      # Widget: GSD task
    model-info.js        # Widget: model display
    session-cost.js      # Widget: cost tracking
    hook-health.js       # Widget: hook status
```

**Widget contract:**

```javascript
module.exports = {
  name: "context-window",
  priority: 10,            // render order
  enabled: (data) => true, // can disable based on data
  render: (data, cache) => { ... return formatted_string; },
  cacheTTL: 0,             // 0 = no cache, ms otherwise
};
```

**Verdict:** Clean architecture. The filesystem scan cost is the main concern,
but Node.js `require()` caching mitigates it after first load. Main risk: the
statusline is invoked as a fresh process each time (not persistent), so
`require()` cache provides no benefit across invocations.

| Criterion            | Score (1-5) |
| -------------------- | ----------- |
| Extensibility        | 5           |
| Widget isolation     | 5           |
| Performance          | 3           |
| Testability          | 5           |
| Codebase fit         | 3           |
| User configurability | 4           |
| **Total**            | **25/30**   |

### 3.3 Option C: Config-Driven

**How widgets are added (DX):** Define a new entry in a JSON/YAML config file
specifying: data source (JSON path or shell command), parser (regex or
jq-style), format template, color, priority.

**How widgets are configured (UX):** Edit the config file. Full user control
without touching code.

**Performance model:**

- Startup: ~10-20ms (parse config, no module loading)
- Per-render: Depends on data sources -- JSON path extraction is fast, shell
  commands add exec overhead
- Risk: shell command widgets spawn child processes per render cycle

**Testing strategy:** Test the config parser and template engine. Individual
widget logic is declarative, not testable as code.

**Fit with codebase:** Weak. The codebase is code-first, not config-first. No
existing config-driven patterns in hooks. Security concerns with shell command
execution from config files.

**6 SoNash widgets:** Works for simple widgets (model name, branch, cost). Fails
for complex widgets (context bar with color thresholds, task lookup with
filesystem traversal). The todo/task widget requires logic that cannot be
expressed in a config template.

**Verdict:** Too limited. The 6 SoNash widgets include at least 2 (context bar,
current task) that require non-trivial logic. Config-driven works for syou6162's
Go tool because it shells out to external commands, but that adds latency and
security surface area.

| Criterion            | Score (1-5) |
| -------------------- | ----------- |
| Extensibility        | 3           |
| Widget isolation     | 3           |
| Performance          | 3           |
| Testability          | 2           |
| Codebase fit         | 2           |
| User configurability | 5           |
| **Total**            | **18/30**   |

### 3.4 Option D: Compiled/Bundled

**How widgets are added (DX):** Create a new `.js` file in `src/widgets/`
following the same contract as Option B. Run `npm run statusline:build` to
produce a single output file. Identical to Plugin Architecture for development.

**How widgets are configured (UX):** Same as Option B -- config file controls
activation. The build step inlines all widget code, so the config controls which
widgets render, not which are loaded (they are all present but cost nothing if
not activated).

**Performance model:**

- Startup: ~5-10ms (single file, no readdirSync, no dynamic requires)
- Per-render: ~15-30ms (identical to monolith -- all code is inline)
- Build time: ~100-500ms (trivial for 6 widgets)
- Zero filesystem overhead at runtime -- all widget code is in the bundle

**Testing strategy:** Test source modules individually (identical to Option B).
Test the bundled output as integration test. The existing `statusline.test.ts`
pattern works unchanged.

**Fit with codebase:** Strong. The codebase already has build tooling (`npm run`
scripts, TypeScript compilation via `tsc`, `dist-tests/` directory). Adding a
statusline build step fits naturally. The deployed artifact is a single `.js`
file, matching the existing hook pattern exactly.

**Build strategy options:**

1. **Simple concatenation script:** A 20-line Node.js script that reads widget
   files, wraps them in a registry object, and writes the combined output. No
   external bundler needed.

2. **esbuild:** Single-command bundle. Already available in the Node.js
   ecosystem. Produces a self-contained CJS file. Overkill for 6 files but
   future-proof.

3. **Manual inline:** During development, use the plugin architecture (Option B)
   directly. Before release/commit, run a build script that inlines everything.
   Development uses multi-file, deployment uses single-file.

**Recommended build approach:** Option 1 (simple concatenation). A script in
`scripts/build-statusline.js` that:

- Reads all `src/statusline/widgets/*.js` files
- Validates each exports the widget contract
- Concatenates into a single IIFE with a widget registry
- Writes to `.claude/hooks/global/statusline.js`

**Implementation sketch:**

```
src/statusline/
  core.js                # stdin parse, layout, render, cache
  widgets/
    context-window.js    # Widget implementations
    git-branch.js
    current-task.js
    model-info.js
    session-cost.js
    hook-health.js
  config-schema.js       # Zod schema for config validation
scripts/
  build-statusline.js    # Concatenation build script
.claude/hooks/global/
  statusline.js          # BUILD OUTPUT (generated, do not edit)
```

**Verdict:** Best of both worlds. Modular development with single-file
deployment. The build step is trivial (not a webpack/rollup situation) and fits
existing codebase tooling patterns.

| Criterion            | Score (1-5) |
| -------------------- | ----------- |
| Extensibility        | 5           |
| Widget isolation     | 5           |
| Performance          | 5           |
| Testability          | 5           |
| Codebase fit         | 4           |
| User configurability | 4           |
| **Total**            | **28/30**   |

---

## 4. The 6 SoNash Widgets: Requirements and Complexity

| #   | Widget         | Data Source                             | Complexity                               | Caching Need |
| --- | -------------- | --------------------------------------- | ---------------------------------------- | ------------ |
| 1   | Model/Version  | stdin JSON `model.display_name`         | Trivial                                  | None         |
| 2   | Git Branch     | `git rev-parse --abbrev-ref HEAD`       | Low                                      | 5-10s TTL    |
| 3   | Current Task   | Filesystem scan of `~/.claude/todos/`   | Medium                                   | 2-5s TTL     |
| 4   | Context Window | stdin JSON `context_window.*`           | Medium (color thresholds, bar rendering) | None         |
| 5   | Session Cost   | stdin JSON `cost.total_cost_usd`        | Low (formatting)                         | None         |
| 6   | Hook Health    | Read `.claude/hooks/*.json` state files | Medium (multi-file read, aggregation)    | 30s TTL      |

**Observations:**

- Widgets 1, 4, 5 derive entirely from stdin JSON -- zero I/O cost
- Widgets 2, 3, 6 require filesystem or subprocess access -- benefit from
  caching
- The context window widget has the most complex rendering logic (color
  thresholds, progress bar, skull emoji at high usage)
- The hook health widget is new and requires reading multiple JSON state files

**Caching architecture for D:** Because the statusline process is spawned fresh
each render cycle (not persistent), in-process caching has no value across
invocations. Two options:

1. **File-based cache:** Write computed values to a temp file with TTL. Read on
   next invocation. Adds ~2ms file I/O but saves expensive operations.
2. **Accept re-computation:** At 6 widgets with 3 doing I/O, total render time
   is ~30-50ms. Within the <100ms budget. Caching may be premature optimization.

**Recommendation:** Start without caching. Add file-based caching only if
profiling shows render time exceeding 80ms.

---

## 5. Comparative Summary

| Criterion               | A: Monolith      | B: Plugin             | C: Config              | D: Bundled                |
| ----------------------- | ---------------- | --------------------- | ---------------------- | ------------------------- |
| Add widget effort       | Edit monolith    | Create file           | Edit config            | Create file + build       |
| Remove widget           | Edit monolith    | Delete file           | Edit config            | Delete file + build       |
| Widget crash isolation  | None             | try/catch per widget  | Per-command            | try/catch per widget      |
| Startup time            | ~5-10ms          | ~15-30ms              | ~10-20ms               | ~5-10ms                   |
| Render time             | ~15-30ms         | ~20-40ms              | Variable               | ~15-30ms                  |
| Test each widget        | Extract function | Import file           | N/A                    | Import file               |
| User config support     | None             | Config file           | Config file            | Config file               |
| Security surface        | Minimal          | readdirSync + require | Shell exec from config | Minimal (build-time only) |
| Codebase fit            | Perfect          | Good                  | Poor                   | Strong                    |
| External tool precedent | daniel3303       | tmux-powerline        | syou6162               | Starship, Oh-My-Posh      |
| **Score**               | **17/30**        | **25/30**             | **18/30**              | **28/30**                 |

---

## 6. External Architecture Lessons

### What Starship and Oh-My-Posh Teach Us

Both tools use the same fundamental pattern: **compiled monolith with
registry-based dispatch and per-module configuration.**

Neither loads modules dynamically at runtime. Instead:

1. All modules are compiled into the binary
2. A registry (constant array or interface dispatch table) lists all modules
3. Configuration controls which modules activate
4. Each module follows a strict interface contract
5. Expensive operations are cached (git status, directory contents)
6. Parallel execution keeps render time low

This maps directly to **Option D** for our Node.js context:

- "Compiled into binary" = "bundled into single .js file"
- "Registry constant" = widget array in the bundled output
- "Interface contract" = exported `{ name, enabled, render }` object
- "Configuration" = JSON config file read at startup

### What tmux-powerline Teaches Us

The pure-plugin approach (independent scripts) is maximally extensible but has
performance costs. Each segment is a separate process spawn. For a CLI prompt
that runs on every command, this is acceptable (bash is fast to spawn). For a
statusline that updates every few seconds, the overhead accumulates.

**Lesson:** Plugin loading overhead matters more for frequently-invoked scripts.
Our statusline runs after every assistant message (~every 5-30 seconds), so
startup cost is relevant.

### What ccstatusline (sirmalloc) Teaches Us

The widget-based architecture with Bun runtime demonstrates that the community
has converged on per-widget modules as the right abstraction. However, requiring
Bun as a runtime is a non-starter for Windows compatibility and for environments
where only Node.js is available.

### What syou6162/ccstatusline Teaches Us

The YAML config-driven approach works for simple cases but requires shelling out
for complex widgets. The Go binary approach gives excellent performance but
requires a separate compilation toolchain not present in this codebase.

---

## 7. Recommendation

### Primary: Option D (Compiled/Bundled)

**Why D over B (the runner-up):**

The deciding factor is the statusline execution model. Claude Code spawns a
**fresh process** for every statusline render. This means:

- Option B's `readdirSync` + `require()` for N widget files happens on every
  single render (no process-level cache persists)
- Option D's single-file bundle loads in one `require()` call with zero
  filesystem discovery
- The difference is ~10-20ms per render -- small but multiplied by hundreds of
  renders per session

Additionally:

- The deployed artifact (single `.js` file) is identical to the current
  statusline pattern -- zero operational change
- The build step is trivial (20-line concatenation script, not a bundler config)
- Tests run against source modules, not the bundle -- clean separation
- Security surface is smaller: no runtime file discovery, no dynamic `require()`
  of user-provided paths

**Why D over A (the current approach):**

Option A works today at 5 widgets. Adding the 6th (hook health) pushes the file
to ~250+ lines. More importantly, A has zero widget isolation -- a bug in the
hook health widget's filesystem reads could crash the entire statusline
silently.

**Implementation plan:**

1. **Phase 1: Extract current widgets to modules** (~1 session)
   - Create `src/statusline/core.js` with stdin parsing, layout, and rendering
   - Extract 5 existing "widgets" (model, branch, task, context, directory) into
     `src/statusline/widgets/`
   - Write `scripts/build-statusline.js` concatenation script
   - Add `npm run statusline:build` script
   - Verify bundled output matches current behavior

2. **Phase 2: Add widget contract and config** (~1 session)
   - Define the widget interface:
     `{ name, priority, enabled, render, cacheTTL }`
   - Add `.claude/statusline-config.json` with widget enable/disable and order
   - Add per-widget try/catch isolation in core renderer
   - Add the 6th widget (hook health or session cost)

3. **Phase 3: Testing and hardening** (~1 session)
   - Unit tests per widget module
   - Integration test for bundled output
   - Performance profiling (target: <50ms p95 render time)
   - Add file-based caching if profiling shows need

### Fallback: Option B (Plugin Architecture)

If the build step proves to be friction (forgetting to rebuild after edits,
stale bundles causing confusion), fall back to Option B with these mitigations:

- Cache the widget file list in a state file (rebuild list only when `widgets/`
  directory mtime changes)
- Use `require()` with absolute paths (skip `readdirSync` if cached list is
  fresh)
- Accept the ~10-20ms overhead as a "good enough" tradeoff for zero-build DX

---

## 8. Widget Contract Specification (for Option D)

```javascript
// src/statusline/widgets/example-widget.js
const { sanitize } = require("../core");

module.exports = {
  /** Unique widget identifier */
  name: "example-widget",

  /** Render priority (lower = rendered first/left). Default: 50 */
  priority: 50,

  /**
   * Whether this widget should render.
   * @param {object} data - Parsed stdin JSON from Claude Code
   * @returns {boolean}
   */
  enabled(data) {
    return data.model != null;
  },

  /**
   * Render the widget output.
   * @param {object} data - Parsed stdin JSON from Claude Code
   * @param {object} cache - Shared cache object (persists within single render)
   * @returns {string} Formatted output string (may include ANSI codes)
   */
  render(data, cache) {
    const value = sanitize(data.model?.display_name || "Claude");
    return `\x1b[2m${value}\x1b[0m`;
  },

  /**
   * Cache TTL in milliseconds. 0 = no caching.
   * Used only if file-based caching is enabled.
   */
  cacheTTL: 0,
};
```

### Core Renderer Contract

```javascript
// src/statusline/core.js (simplified)
function renderStatusline(widgets, data) {
  const parts = [];
  const sorted = [...widgets].sort((a, b) => a.priority - b.priority);

  for (const widget of sorted) {
    try {
      if (widget.enabled(data)) {
        const output = widget.render(data, {});
        if (output) parts.push(output);
      }
    } catch {
      // Widget crash isolation: skip failed widget, continue rendering
    }
  }

  return parts.join(" \u2502 "); // Pipe separator
}
```

---

## 9. Risk Assessment

| Risk                    | Probability | Impact                        | Mitigation                                    |
| ----------------------- | ----------- | ----------------------------- | --------------------------------------------- |
| Stale bundle after edit | Medium      | Low (dev inconvenience)       | Pre-commit hook validates bundle freshness    |
| Build script breaks     | Low         | Medium (statusline goes dark) | Keep current monolith as fallback             |
| Widget crash cascades   | Low         | High (no statusline)          | Per-widget try/catch in core                  |
| Performance regression  | Low         | Medium (sluggish render)      | Profiling gate: fail if >100ms                |
| Windows path issues     | Medium      | Medium (widgets fail)         | Use `path.join()` everywhere, test on Windows |
| Config file corruption  | Low         | Low (fallback to defaults)    | Zod validation with graceful degradation      |

---

## 10. Decision Record

| #   | Decision                                                       | Rationale                                                 |
| --- | -------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Option D (Compiled/Bundled)                                    | Best score (28/30), matches Starship/Oh-My-Posh precedent |
| 2   | Simple concatenation, not esbuild                              | 6 widgets do not justify a bundler dependency             |
| 3   | Widget contract: `{ name, priority, enabled, render }`         | Minimal interface covering all 6 widget needs             |
| 4   | Per-widget try/catch isolation                                 | Prevents single widget crash from killing statusline      |
| 5   | Defer caching to Phase 3                                       | 6 widgets likely under 50ms; optimize only if measured    |
| 6   | Config file for activation/order                               | Users can customize without editing code                  |
| 7   | Source in `src/statusline/`, output in `.claude/hooks/global/` | Clean separation of source and artifact                   |

---

## Sources

### External CLI Tools

- [Starship Module System (DeepWiki)](https://deepwiki.com/starship/starship/5-module-system)
- [Starship Module Struct (docs.rs)](https://docs.rs/starship/latest/starship/module/struct.Module.html)
- [Oh My Posh - Add Segment Guide](https://ohmyposh.dev/docs/contributing/segment)
- [Oh My Posh Architecture (DeepWiki)](https://deepwiki.com/JanDeDobbeleer/oh-my-posh)
- [tmux-powerline (GitHub)](https://github.com/erikw/tmux-powerline)

### Claude Code Statusline Ecosystem

- [Claude Code Statusline Docs](https://code.claude.com/docs/en/statusline)
- [ccstatusline by sirmalloc (GitHub)](https://github.com/sirmalloc/ccstatusline)
- [ccstatusline by syou6162 - YAML Config (GitHub)](https://github.com/syou6162/ccstatusline)
- [ClaudeCodeStatusLine by daniel3303 (GitHub)](https://github.com/daniel3303/ClaudeCodeStatusLine)

### Performance Research

- [Starship Performance FAQ](https://starship.rs/faq/)
- [Node.js Module Caching](https://nodejs.org/api/modules.html)
