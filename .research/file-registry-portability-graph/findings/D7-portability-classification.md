# D7: Portability Classification — Findings

_Captured from task-notification result per Critical Rule #4 (Windows agent
output fallback)._

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-04-17 **Sub-question:** How do existing systems tag files as "portable" vs
"project-specific"? Heuristics, schemas, conventions for JASON-OS.

---

## Key Findings

### 1. No Universal Standard Exists — But Convergent Patterns Do [HIGH]

No single cross-domain schema, RDF vocabulary, or JSON-LD type for "portability"
exists. However, four independent systems converge on the same 4-5 scope values:
**machine → user → project → org → public**. Convergence across chezmoi, VSCode,
Nx, XDG, and Agent Skills constitutes strong implicit consensus. Sources: VSCode
contribution points, XDG spec, chezmoi source attributes, Nx
enforce-module-boundaries, agentskills.io spec

### 2. Nx Tags: `scope:` + `type:` Dual-Axis Classification [HIGH]

Nx encodes portability via two orthogonal tag dimensions in `project.json`:

- **Scope:** `scope:shared` (portable), `scope:client`/`scope:admin`
  (project/domain-specific). Rule: `scope:shared` projects can only depend on
  other `scope:shared` projects.
- **Type:** `type:lib` (reusable), `type:app` (endpoint), `type:util` (pure
  utility), `type:feature` (domain-specific).

Heuristic: **a file is portable if and only if it has `scope:shared` or
equivalent, and has no `scope:X` dependencies where X is a domain name.**
Enforced by `@nx/enforce-module-boundaries` ESLint rule — most formal
enforcement mechanism found anywhere. Sources:
https://nx.dev/docs/features/enforce-module-boundaries

### 3. chezmoi: Implicit Portability by Absence of `.tmpl` Suffix [HIGH]

Negative-marker approach: files NOT templates are implicitly universal. `.tmpl`
suffix = machine-specific (rendered through Go `text/template` with
`.chezmoi.hostname`, `.chezmoi.os`, `.chezmoi.arch`).

- Portable: plain files copied verbatim
- Machine-specific markers: `.tmpl` suffix, `run_` prefix, host-specific vars in
  template content
- `.chezmoiignore` is itself a template — machine-specific ignorance

**JASON-OS inverse heuristic: absence of project-specific references = portable
by default. Tag the exceptions, not the rule.** Sources:
https://www.chezmoi.io/reference/source-state-attributes/

### 4. VSCode Extension Settings: 5-Level Scope Enum with Sync Semantics [HIGH]

| Scope                 | Portable?             | Syncs? | Notes                            |
| --------------------- | --------------------- | ------ | -------------------------------- |
| `application`         | YES (global)          | YES    | IDE-level, no workspace override |
| `machine`             | NO (machine-specific) | NO     | Not synced by design             |
| `machine-overridable` | SEMI                  | NO     | Workspace can override           |
| `window`              | YES                   | YES    | Can be workspace or user         |
| `resource`            | YES (file-level)      | YES    | Most granular override level     |

**Clean operational definition: "portable" = survives transfer to a new machine
without loss of meaning.** Sources:
https://code.visualstudio.com/api/references/contribution-points

### 5. XDG Base Directory: Portability via Directory Semantics [HIGH]

| Dir                                  | Portable?        | Semantics                                          |
| ------------------------------------ | ---------------- | -------------------------------------------------- |
| `$XDG_CONFIG_HOME` (`~/.config`)     | User-portable    | User preferences, shareable between machines       |
| `$XDG_DATA_HOME` (`~/.local/share`)  | YES (explicitly) | "Portable across computers" per spec               |
| `$XDG_STATE_HOME` (`~/.local/state`) | NO               | "Not important or portable enough" — logs, history |
| `$XDG_CACHE_HOME` (`~/.cache`)       | NO               | Non-essential, expendable                          |
| `$XDG_RUNTIME_DIR`                   | NO               | Machine/session ephemeral                          |

**Portability is a spectrum, not a binary**, with specific directories encoding
the spectrum through location alone. Sources:
https://specifications.freedesktop.org/basedir/latest/

### 6. Agent Skills Specification: `compatibility` Field + Install Location [HIGH]

The agentskills.io spec (open standard since Dec 2025, Linux Foundation, 60k+
repos) defines YAML frontmatter for skills but has **no dedicated portability
field**. Closest is `compatibility` prose. Scope encoded through **install
location**, not frontmatter: `~/.claude/skills/` = user-portable;
`.claude/skills/` = project-scoped. **Path-as-scope pattern.**

Current JASON-OS confirms this: `~/.claude/agents/` = GSD-prefixed generic;
`sonash-v0/.claude/agents/` = project-specific. Sources:
https://agentskills.io/specification

### 7. rcm Dotfiles: `tag-` Directory Prefix = Explicit Group Scope [HIGH]

`tag-X` directory under dotfiles root marks files as belonging to scope X.
Host-specific in `host-HOSTNAME/`. Universal at root.

- `~/dotfiles/gitconfig` → universal
- `~/dotfiles/tag-git/gitconfig` → git-group scope (conditionally portable)
- `~/dotfiles/host-work-laptop/gitconfig` → machine-specific

3-level scope: `universal` → `group` → `host`. Group scope = "conditionally
portable" — portable if machine satisfies the condition. Sources:
https://manpages.ubuntu.com/manpages/jammy/man7/rcm.7.html

### 8. Nix home-manager: Module Imports as Portability Mechanism [MEDIUM]

`common.nix` (shared) vs per-host files (`home-kronos.nix`, `home-rhea.nix`)
importing `common.nix`. No explicit metadata tag — portability expressed through
**module composition**. Limitation: implicit, requires parsing the full
dependency graph. Sources: home-manager wiki, nix-community.github.io

### 9. AGENTS.md vs CLAUDE.md: Cross-Tool vs Single-Tool Portability [HIGH]

Community consensus 2025-2026: AGENTS.md = universal (Linux Foundation open
standard, recognized by Codex CLI, Copilot CLI, Gemini CLI, Cursor, Claude
Code); CLAUDE.md = Claude-specific. Best practice: universal context in
AGENTS.md, Claude-specific in CLAUDE.md.

For JASON-OS: docs using Claude Code-specific syntax (permission blocks, slash
commands) = user-scoped (portable to user, requires Claude Code). Sources:
thepromptshelf.dev, deployhq.com

### 10. Bazel `visibility`: Explicit Dependency Permission [MEDIUM]

`//visibility:public`, `//visibility:private`, `//foo/bar:__subpackages__` —
most formal enforcement mechanism. `//visibility:public` is closest analog to
"reusable/portable" but encodes access rights, not portability of the artifact
itself. Sources: https://bazel.build/concepts/visibility

### 11. 12-Factor App: Behavioral Portability [MEDIUM]

An app is portable if code could be open-sourced without exposing credentials,
because config is externalized to env vars. **Behavioral test**: a file
containing any hardcoded machine/environment-specific value is not portable
until that value is moved out. Sources: https://12factor.net/config

### 12. Ansible galaxy.yml `platforms` Metadata: Constraint-Based [MEDIUM]

`galaxy_info.platforms: [{name: all, versions: [all]}]` = maximally portable.
Specific OS/version constraints = machine-scope limitations. **The more platform
constraints, the less portable.** Sources: Ansible Galaxy docs

### 13. Academic Literature: Portability Under-Defined at Component Level [LOW]

2020 systematic review: "a major obstacle to effective portability measurement
is the lack of established mechanisms to specify and measure portability."
Academic metrics are behavioral/structural (coupling, cohesion, dependency
count) rather than declarative tags. **No academic consensus schema exists.**
Sources: ResearchGate portability measurement review, ACM reusability metrics

### 14. JASON-OS Memory Files — Implicit Classification Already Present [MEDIUM]

Examining actual memory files in `~/.claude/projects/.../memory/`, filename
prefix IS the scope signal:

- `feedback_*` → user-portable (applies to any Claude Code session for this
  user)
- `user_*` → universally portable
- `reference_*` → project-scoped or partially
- `project_*` → project-scoped

**Strongest local evidence for auto-classification**: naming convention already
encodes portability. "Path-based scope" pattern in practice.

---

## Contradictions

**Contradiction 1:** Agent Skills uses **location** as primary portability
signal (install path = scope), but `compatibility` uses **prose description**.
Can conflict: a skill at `~/.claude/skills/` might have
`compatibility: Requires SoNash project context`.

**Contradiction 2:** chezmoi uses "absence of `.tmpl`" as portable default;
Nx/Bazel use "explicit positive tags" (`scope:shared`, `//visibility:public`).
Opposite defaults. Chezmoi's model (portable by default, tag exceptions) is
probably better for skills/agents where most content is meant to be shared.

**Contradiction 3:** Academic literature measures portability via behavioral
metrics; practitioners standardized on declarative classification. Empirical
approach hasn't translated into tooling.

---

## Gaps

1. No existing system covers AI agent skill portability specifically. Agent
   Skills spec defines location-based scope but no explicit portability field.
2. Reference-based portability detection (file referencing only portable files
   is itself portable) — no system automates this.
3. Change-velocity heuristic (files changed only by user, not by
   build/generation) — no system found using this.
4. Multi-locale detection (file appears in 3+ projects → portable) — not
   implemented.
5. frontmatter-format spec (github.com/jlevy/frontmatter-format) is
   schema-agnostic — portability gap remains unfilled.
6. Academic portability literature 20+ years old on measurement; no recent
   (2023-2026) declarative schema work.

---

## Serendipity

**Discovery 1:** JASON-OS Already Has Implicit Classification. The `feedback_*`
/ `user_*` / `project_*` / `reference_*` prefix convention already encodes scope
— rcm `tag-` pattern applied to memory files without being designed as one. The
classification task (44 files) is not "build a classification system" — it's
"formalize what the file names already say."

**Discovery 2:** Agent Skills `metadata` field is an extension point. Adding
`metadata.scope: user` or `metadata.portability: universal` is immediately valid
by spec without spec changes.

**Discovery 3:** VSCode's sync-refusal is the clearest operational portability
definition found. Adapt: "A file that loses meaning when moved to another
machine is machine-scoped."

---

## Recommendations: JASON-OS Portability Schema

### Tag Field

```yaml
# In YAML frontmatter (SKILL.md, agent .md, memory .md, any tracked artifact)
scope: universal # or: user | project | machine | ephemeral
```

**Field name: `scope`** — matches Nx (`scope:shared`), VSCode (scope enum), XDG
directory semantics. Shorter and more semantically precise than "portability."

### Value Enum (5 levels)

| Value       | Meaning                                                                                 | Examples                                                                   |
| ----------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `universal` | Works identically in any repo, any machine, any user                                    | `/deep-research` skill, `code-reviewer` agent                              |
| `user`      | Requires this user's preferences/history/conventions; works across that user's projects | `feedback_*` files, `user_*` files, GSD agents                             |
| `project`   | Specific to one repository                                                              | `sonash-context` skill, `reference_external_systems.md`, `project_*` files |
| `machine`   | Machine-specific paths, credentials, or hardware assumptions                            | `.chezmoiignore` equivalents, machine-specific configs                     |
| `ephemeral` | Generated artifacts, cache, session state — do not carry forward                        | `.claude/cache/`, `security_warnings_state_*.json`, `stats-cache.json`     |

### Location

**Primary:** YAML frontmatter in the file itself (for `.md`, agent, skill
files):

```yaml
---
name: deep-research-searcher
scope: universal
---
```

**Secondary:** Sidecar JSON for non-YAML-friendly files:

```json
{ "scope": "universal", "deps": ["web-search", "context7"] }
```

**Fallback registry:** central `file-registry.json` at `~/.claude/` for files
that cannot carry their own metadata.

### Auto-Detection Heuristics (priority order)

1. **Path heuristic (HIGH confidence):**
   - `~/.claude/skills/` or `~/.claude/agents/` → `user`
   - `<project>/.claude/skills/` or `<project>/.claude/agents/` → `project`
     unless name contains no project-specific terms
   - `~/.claude/cache/`, `~/.claude/statsig/`, `security_warnings_state_*.json`
     → `ephemeral`

2. **Filename prefix heuristic (HIGH confidence for memory files):**
   - `feedback_*` → `user`
   - `user_*` → `user`
   - `project_*` → `project`
   - `reference_*` → `project`

3. **Content reference heuristic (MEDIUM confidence):**
   - Project-specific strings (repo names, Firebase project IDs, SoNash-specific
     paths) → `project`
   - Machine-specific strings (absolute paths with hostname, `$USER` references)
     → `machine`
   - None found → upgrade to `user`

4. **Dependency graph heuristic (MEDIUM confidence):**
   - All referenced skills/agents `universal` or `user` → file is at least
     `user`
   - Any dependency `project` → file is at most `project`

5. **Change-author heuristic (LOW confidence, requires git):**
   - `git log --author="$USER"` only → likely `user` or `universal`
   - Commits from CI/build → likely `ephemeral` or `machine`

### Applying to 44 Memory Files (T0 Action)

Based on prefix analysis:

- `feedback_*` (26 files) → `user`
- `user_*` (5 files) → `user`
- `project_*` (~12 files) → `project`
- `reference_*` (5 files) → split: `reference_ai_capabilities.md` = `user`;
  `reference_external_systems.md` = `project`

Confidence: MEDIUM — requires human spot-check on 5-10 edge cases.

---

## Confidence Assessment

- HIGH claims: 8
- MEDIUM claims: 5
- LOW claims: 1
- UNVERIFIED claims: 0
- Overall confidence: HIGH for heuristics; MEDIUM for academic gap analysis

---

**Gaps identified:** No existing standard portability field in SKILL.md/agent
frontmatter; no tooling for reference-based auto-detection; academic literature
stale on declarative schemas.

**Serendipity:** JASON-OS already encodes portability in memory file prefixes
(implicit rcm-style tagging); Agent Skills `metadata` field is immediate
extension point; VSCode sync-refusal is clearest operational definition of
"machine-scoped."
