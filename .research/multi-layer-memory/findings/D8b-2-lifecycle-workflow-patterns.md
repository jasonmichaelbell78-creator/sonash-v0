# Findings: Lifecycle and Workflow Pattern Adoption Guides for SoNash

**Searcher:** deep-research-synthesizer **Profile:** synthesis **Date:**
2026-03-31 **Sub-Question IDs:** D8b-2 (lifecycle/workflow patterns) **Source
files:** D1, D2b, D3a-1, D3a-2, D3b-2b, D4a, D4b, D6a, D6b, D8a, D9a, D10a, D10b

---

## Overview

Seven extractable patterns from the research, each adapted for SoNash's
constraints: solo non-developer director, Windows 11 (two locales), Node.js
ecosystem, 25 hooks already running, no Docker, no admin at work locale,
session-end pipeline as the primary automation lever.

For each pattern: what it is, origin, SoNash-specific implementation sketch,
effort estimate, dependencies, and whether it needs new infrastructure or uses
what exists.

---

## Pattern 1: Instinct Confidence Scoring (ECC)

### What It Is

Behavioral patterns stored as weighted rules (0.3-0.9 confidence) rather than
binary on/off memory entries. Low-confidence patterns are provisional;
high-confidence patterns are acted on without hesitation. Patterns decay if
unused and can be pruned. When 5+ patterns cluster in a domain, they can evolve
into a formal skill.

**Origin:** everything-claude-code (affaan-m/everything-claude-code, 124K
stars). YAML files at `~/.claude/homunculus/instincts/`. Source: D2b Finding
2-3, D2b Novel Ideas #1.

**Why it matters:** The current SoNash MEMORY.md treats all entries as equally
valid. A correction from Session #10 receives the same weight as a correction
from Session #250. Confidence scoring lets the system express "I learned this
but I'm not sure it generalizes" vs "this has been confirmed across 50
sessions."

### SoNash Implementation Sketch

No new infrastructure required. This is a **frontmatter convention** added to
MEMORY.md topic files and enforced by the dream-skill consolidation pass.

**Step 1 — Add frontmatter convention to new memory entries:**

```markdown
---
confidence: 0.7
domain: behavioral-correction
sessions_seen: 3
last_accessed: 2026-03-31
---

Never set SKIP_REASON autonomously — always present 3 options to user.
```

**Step 2 — Add confidence to MEMORY.md index:**

```markdown
- [feedback_no_preexisting_rejection.md](feedback_no_preexisting_rejection.md)
  confidence:0.9 — Never dismiss PR items as pre-existing
- [feedback_sws_is_meta_plan.md](feedback_sws_is_meta_plan.md) confidence:0.7 —
  SWS coordinates, does not absorb child plans
```

**Step 3 — Consolidation script reads frontmatter and prunes low-confidence,
stale entries:**

```javascript
// In scripts/consolidate-memory.js (new file, ~40 lines)
// Parse YAML frontmatter from each topic file
// Flag entries where confidence < 0.4 AND sessions_seen < 2 AND last_accessed > 30 days ago
// Output pruning candidates for human review (never auto-delete)
```

**Step 4 — Update session-end SKILL.md to prompt writing confidence when adding
new entries:**

```
When writing to Auto Memory, include frontmatter:
  confidence: 0.5 (initial) | domain: [behavioral|architectural|project|user-preference] | sessions_seen: 1
```

**What NOT to do:** Do not implement the full ECC instinct pipeline (homunculus
YAML, observe.sh loop, /learn-eval command). That is a 60-command 30-agent
system built for a team workflow. The value for SoNash is the **confidence as
metadata concept**, not the machinery.

### Effort Estimate

- Frontmatter convention decision: 15 minutes (write the spec, add it to
  CLAUDE.md reference)
- Updating existing MEMORY.md files with frontmatter: 1-2 hours (39 files, many
  entries)
- Consolidation script that reads and surfaces low-confidence candidates: 2-4
  hours (Node.js, similar to run-consolidation.js)
- session-end SKILL.md update: 15 minutes

**Total: 4-6 hours of focused work across 1-2 sessions.**

### Dependencies

- dream-skill or custom consolidate-memory.js to enforce pruning (Pattern 7 /
  Pattern 5)
- No new MCP servers, no new hooks, no new infrastructure

### Uses Existing Mechanisms?

Yes. Extends the Auto Memory frontmatter convention. No new infrastructure.

### Risk Flag

The frontmatter convention requires Claude to write frontmatter consistently on
every new memory entry. This is behavioral, not enforced. Add it to CLAUDE.md
Section 6 as a coding standard for memory writes. Without that enforcement,
entries will arrive without frontmatter and the scoring system becomes
inconsistent.

---

## Pattern 2: Confidence Decay (Yuval)

### What It Is

Different memory types have different half-lives. Yuval's architecture (dev.to,
Jan 2026):

- **7-day half-life** for progress/status entries ("TDMS consolidation in
  progress")
- **30-day half-life** for session context entries ("working on debt-runner
  phase 2")
- **Permanent** (no decay) for architectural decisions and behavioral
  corrections

Decay does not mean deletion. It means de-ranking: a decayed entry is flagged
for human review or moved to an archive file, not silently deleted. D10a
explicitly warns against deletion-as-decay because rarely-used patterns (e.g.,
quarterly planning rules) will be expired as "stale" even though they remain
valid.

**Origin:** yuvalsuede/memory-mcp (D3b-2b Finding 7, D3a-1 Finding 10). The
decay architecture is validated by academic work in ACT-R forgetting (D4a
Finding 16) and OpenMemory's differential sector decay (D2c Finding 5 —
episodic: 0.015/cycle, reflective: 0.001/cycle).

**The critical constraint from D10a NR-05:** Only apply decay to time-sensitive
types. Never apply decay to behavioral corrections and architectural decisions.
The failure mode is "premature forgetting of still-valid patterns."

### SoNash Implementation Sketch

**Step 1 — Define three TTL categories in MEMORY.md frontmatter:**

```markdown
---
ttl: ephemeral    # prune/archive after 10 sessions (progress, status notes)
ttl: sprint       # prune/archive when initiative marked complete OR 30 days
ttl: permanent    # never auto-pruned (corrections, decisions, architecture)
---
```

**Default when no TTL annotation: permanent.** This is the safe default —
entries persist unless explicitly marked otherwise.

**Step 2 — Map existing MEMORY.md categories to TTL types:**

| Category                                 | TTL       | Rationale                           |
| ---------------------------------------- | --------- | ----------------------------------- |
| `project_active_initiatives.md`          | sprint    | Status changes every few weeks      |
| `feedback_*.md` (behavioral corrections) | permanent | Must survive indefinitely           |
| `reference_*.md`                         | permanent | External system URLs, doc standards |
| `sws_session221_decisions.md`            | sprint    | Historical reference, can archive   |
| `t3_convergence_loops.md`                | permanent | Core pattern, often referenced      |
| `user_*.md`                              | permanent | User profile data changes rarely    |

**Step 3 — Consolidation script applies decay logic:**

```javascript
// In scripts/consolidate-memory.js
// For each topic file with TTL frontmatter:
//   ttl: ephemeral + sessions_since_last_access > 10 → move to archive/
//   ttl: sprint + initiative_marked_complete OR last_accessed > 30 days → move to archive/
//   ttl: permanent → skip
// Output: list of files moved, reasons, for human review at session-end
```

The archive is `.claude/canonical-memory/archive/` — entries are moved, not
deleted. Git history recovers anything over-aggressively archived.

**Step 4 — Add `sessions_since_last_access` tracking:**

The consolidation script increments a counter in each file's frontmatter on each
consolidation run. The session-start hook can zero this counter when a file is
read.

### Effort Estimate

- TTL convention spec (add to CLAUDE.md): 15 minutes
- Annotating all 39 existing MEMORY.md topic files: 30-45 minutes
- Consolidation script decay logic (adding to Pattern 1 script): 2-3 hours
- Testing with --dry-run mode: 1 hour

**Total: 4-5 hours. Can be done in parallel with Pattern 1 since both require
the same script.**

### Dependencies

- Pattern 1 (confidence frontmatter) — share the same frontmatter block
- Pattern 7 (session-end pipeline) — TTL checking runs at consolidation time
- Pattern 5 (context rot prevention) — TTL decay is one of the pruning
  mechanisms

### Uses Existing Mechanisms?

Yes. Extends Auto Memory frontmatter. No new infrastructure. The archive/
subdirectory is new but requires no tooling — just a directory and a script.

### Risk Flag

"Sprint" TTL requires defining when an initiative is "complete." Currently this
is implicit in MEMORY.md prose ("COMPLETE"). The consolidation script needs a
way to detect completed initiatives. Options: (a) look for "COMPLETE" in the
file content, (b) require explicit TTL completion annotation
(`ttl_completed: 2026-03-15`). Option (b) is safer.

---

## Pattern 3: Memory Promotion Rules (lin-yuchen)

### What It Is

A governance rule preventing project-specific knowledge from polluting global
memory. Knowledge promotes from project scope to global scope only after proving
relevant across 2+ projects. Promotion is irreversible in direction: global
items never demote back to project scope.

**Origin:** lin-yuchen's system published on DevelopersIO (March 23, 2026).
Architecture: Global tier (`~/.claude/global-memory/`) for cross-project
preferences; Project tier (`.claude/projects/*/memory/`) for project-specific
context. Source: D3b-2b Finding 4, D6b LP-1.

**ECC parallel:** ECC instincts use project-scope override of global on ID
collision (project wins locally; global wins everywhere else). This is the same
principle in reverse.

**Why it matters for SoNash:** The current MEMORY.md conflates project-specific
observations ("debt-runner expansion phase 3 is next") with universally
applicable learnings ("never set SKIP_REASON autonomously"). Without promotion
rules, the index accumulates project-specific noise that degrades global signal
quality. The 2+ projects rule provides a validation gate before elevation.

### SoNash Implementation Sketch

SoNash is a single-project system (sonash-v0), so the strict "2+ projects" rule
does not apply literally. The adaptation: use **recurrence across sessions** as
the promotion trigger instead of "2+ projects."

**Adapted rule: A pattern promotes from `project_*` scope to `feedback_*` or
`reference_*` scope when it has been confirmed (independently re-encountered or
explicitly validated) in 3+ sessions.**

**Step 1 — Clarify existing MEMORY.md scope taxonomy:**

The current MEMORY.md already has an implicit scope taxonomy:

- `user_*.md` = global (applies regardless of what we're working on)
- `feedback_*.md` = global behavioral corrections (permanently applicable)
- `reference_*.md` = global reference (external systems, doc standards)
- `project_*.md` = project-specific (sonash-v0 current state)
- `sws_*.md`, `t3_*.md` = planning artifacts (time-bounded)

**This taxonomy is already correct. The gap is the absence of a promotion
rule.**

**Step 2 — Add promotion trigger to MEMORY.md frontmatter:**

```markdown
---
scope: project # project | global
promoted_at: null # date promoted to global, or null
recurrence_count: 0 # how many times independently re-encountered
---
```

**Step 3 — Promotion rule (enforced during consolidation):**

```
IF scope == "project"
AND recurrence_count >= 3
THEN:
  - Move file to feedback_* or reference_* prefix
  - Set scope: global
  - Set promoted_at: <current date>
  - Add entry to MEMORY.md index under global section
  - Remove from project section
```

**Step 4 — Add promotion review to session-end:**

The session-end pipeline adds a step: "Review any project-scoped entries with
recurrence_count >= 3 and confirm or reject promotion." The human decision is
preserved — the script surfaces candidates; the user confirms.

**Critically: global items are NEVER moved back to project scope.** If a global
item becomes irrelevant, it receives `ttl: sprint` and decays out — it does not
demote.

### Effort Estimate

- Scope taxonomy documentation (clarify in MEMORY.md header): 30 minutes
- Frontmatter annotations on existing files: 45 minutes (same session as Pattern
  1/2)
- Promotion logic in consolidation script: 2 hours
- session-end promotion review prompt: 30 minutes

**Total: 3-4 hours. Shares implementation work with Patterns 1 and 2.**

### Dependencies

- Patterns 1 and 2 (same frontmatter block)
- Human decision at session-end (cannot be fully automated without risk of
  incorrect promotions)

### Uses Existing Mechanisms?

Yes. Formalizes implicit taxonomy already in MEMORY.md. No new infrastructure.

---

## Pattern 4: Phase-Based Rule Loading (cursor-memory-bank)

### What It Is

Different workflow phases load different rule sets, reducing token usage by ~70%
(cursor-memory-bank claim). Rules relevant to planning do not load during
building; rules relevant to debugging do not load during design. Complexity
tiers (1-4) additionally control which rules fire.

**Origin:** vanzan01/cursor-memory-bank (3,000 stars, Dec 2024). Phase commands:
/van, /plan, /creative, /build, /reflect, /archive. Source: D3a-2 Finding 1a,
D6a comparison matrix.

**Why it matters:** SoNash's CLAUDE.md (258 lines, ~4,800 tokens) and MEMORY.md
(~4,000 tokens) are loaded in full every session. Sections relevant to PR review
are loaded even when no PR exists. Sections about GSD phases are loaded even
during research. Phase-scoped loading would reduce startup token cost and reduce
"lost in the middle" degradation from irrelevant context.

### SoNash-Specific Mapping

SoNash already has GSD phases. The mapping is direct:

| GSD Phase         | Currently Active Rules | Phase-Specific Rules to Load              |
| ----------------- | ---------------------- | ----------------------------------------- |
| gsd:plan-phase    | All of CLAUDE.md       | deep-plan refs, ROADMAP.md                |
| gsd:sprint-active | All of CLAUDE.md       | active skill refs, SESSION_CONTEXT QR     |
| Standard session  | All of CLAUDE.md       | Full load (default, no change)            |
| /pre-commit-fixer | All of CLAUDE.md       | CODE_PATTERNS.md, SECURITY_CHECKLIST.md   |
| /pr-review        | All of CLAUDE.md       | PR review patterns, review-metrics        |
| /session-end      | All of CLAUDE.md       | TDMS debt list, SESSION_HISTORY structure |

### SoNash Implementation Sketch

Claude Code's `.claude/rules/` directory supports path-scoped frontmatter. This
is the existing mechanism for phase-based loading without custom infrastructure.

**Step 1 — Create phase-specific rule files in `.claude/rules/`:**

```
.claude/rules/
  pr-review-context.md     # loaded only when running /pr-review
  pre-commit-context.md    # loaded only when /pre-commit-fixer runs
  planning-context.md      # loaded only during /deep-plan and GSD plan phases
  session-end-context.md   # loaded only during /session-end
```

Each file uses the glob frontmatter:

```markdown
---
glob: ["**/.planning/**", "**/pr-review*"]
---

# PR Review Context

[Only the 200-400 tokens of context specific to PR review work]
```

**Step 2 — Remove phase-specific content from CLAUDE.md main body:**

Move the most verbose phase-specific sections to rule files:

- Section 5 anti-patterns (800 tokens) → only relevant during code writing
- Detailed skill trigger tables (Section 7) → only needed at task-start decision
  points

This reduces CLAUDE.md from ~4,800 tokens to ~3,500 tokens.

**Step 3 — Add phase signal to GSD skills:**

When a GSD phase starts, the skill writes a marker file that triggers the rule:

```javascript
// In gsd-context-monitor.js (existing hook, extend it)
// Write .current-phase file when GSD phase changes
// Rules with glob: ["**/.current-phase-*"] load accordingly
```

**Realistic scope for SoNash:** Full cursor-memory-bank complexity is not
needed. The high-value subset is extracting the 3-4 most token-heavy,
phase-specific CLAUDE.md sections into rule files. This alone likely saves
1,000-1,500 tokens of startup context on 60-70% of sessions where that content
is irrelevant.

### Effort Estimate

- Audit CLAUDE.md for phase-specific content: 30 minutes
- Create 3-4 rule files: 1-2 hours
- Reduce CLAUDE.md correspondingly: 30 minutes
- Test that rules load correctly in relevant contexts: 1 hour

**Total: 3-4 hours. Moderate complexity but independent of other patterns.**

### Dependencies

- Claude Code v2.1+ (glob-scoped rules in `.claude/rules/` — already deployed)
- No new hooks, no new scripts

### Uses Existing Mechanisms?

Yes. `.claude/rules/` with glob frontmatter is already a supported Claude Code
feature (D3b-2b Finding 2). No new infrastructure.

### Risk Flag

Rules with glob frontmatter are only triggered when files matching the glob are
in context. The trigger mechanism depends on Claude Code's rule-loading logic,
which is less predictable than hook-based loading. Phase-based rule loading
should be tested manually before being relied upon for critical context.
Consider it additive, not replacement.

---

## Pattern 5: Context Rot Prevention

### What It Is

A suite of techniques preventing performance degradation from too much injected
context:

- **Token budget caps**: hard limits on how much context each layer can inject
- **Progressive summarization**: older content summarized and compressed before
  loading
- **Active pruning**: periodic removal of low-signal memory entries

**Research basis:** Chroma's "Context Rot" study (2025, D4a Finding 9) tested 18
models and found every model degrades with increasing context. Multiple
distractors compound degradation non-linearly. The "lost in the middle" effect
means entries in the middle of long files receive systematically less attention.

Current SoNash startup token budget (D8a Part 5):

- CLAUDE.md: ~4,800 tokens
- MEMORY.md (200 lines): ~4,000 tokens
- SESSION_CONTEXT.md QR: ~500 tokens
- mcp\_\_memory tool descriptions: ~2,000 tokens
- episodic-memory tool: ~500 tokens
- .planning/STATE.md refs: ~800 tokens
- **Total: ~12,600 tokens** — currently within safe bounds

The risk is growth: MEMORY.md growing toward 25KB cap, more MCP servers added,
longer CLAUDE.md. The D8a analysis sets warning threshold at 18,000 tokens,
critical at 25,000.

### SoNash Implementation Sketch

**Three tiers of intervention, applied in priority order:**

**Tier A: Passive caps (zero new work, already in place)**

- CLAUDE.md: 135-line soft target (CLAUDE.md v5.8 already enforces this)
- MEMORY.md: 200-line/25KB hard cap (Claude Code enforces this automatically)
- SESSION_CONTEXT.md: 300-line soft target (session-end SKILL.md enforces this)

These are already functioning. No action needed.

**Tier B: Budget check at session-start (low effort, ~1 hour)**

Add a token budget check to the session-begin SKILL.md Phase 1 (pre-flight). The
check reads file sizes and line counts, estimates token cost, and warns if
approaching limits.

```markdown
<!-- Add to session-begin SKILL.md Phase 1 -->

## Context Budget Check

1. Check MEMORY.md line count (warn if > 160, critical if > 195)
2. Check CLAUDE.md size (warn if > 150 lines)
3. Estimate active MCP server count from .mcp.json
4. If estimated startup > 18,000 tokens: warn user with specific file culprits
5. If estimated startup > 25,000 tokens: recommend immediate dream-skill run
```

This is a markdown SKILL.md change, no new scripts.

**Tier C: Active pruning via consolidation pipeline (medium effort)**

The consolidation script (from Patterns 1/2) handles active pruning:

1. Entries with `ttl: ephemeral` and `sessions_since_last_access > 10` → archive
2. Entries with `confidence < 0.4` and `sessions_seen < 2` → surface for review
3. Entries marked COMPLETE in content → move to archive/completed/

**The dream-skill / custom consolidation script is the primary active pruning
mechanism.** Without it, all three patterns above (confidence scoring, TTL
decay, promotion rules) accumulate metadata that never gets acted on.

**Tier D: Progressive summarization (medium effort, ~4 hours)**

For files that have grown large (SESSION_HISTORY.md, TDMS), ensure the loading
pattern shows only the most recent N entries rather than the full file.
SESSION_HISTORY.md is already archive-only (not loaded at startup).
MASTER_DEBT.jsonl is not injected directly. The main targets for summarization
are:

- `project_active_initiatives.md` — if it grows beyond 30 lines, truncate to
  current items
- Any MEMORY.md topic file exceeding 50 lines — summarize into key bullets

This is a consolidation-script task, not a new mechanism.

### Effort Estimate

- Tier B (budget check in session-begin): 1 hour
- Tier C (active pruning in consolidation script): included in Patterns 1/2 work
- Tier D (progressive summarization): 2-3 hours as a consolidation-script
  extension

**Total net-new effort (excluding Pattern 1/2 overlap): 1-3 hours.**

### Dependencies

- Pattern 7 (session consolidation pipeline) — pruning runs at session-end
- dream-skill or custom consolidate-memory.js — the execution engine for active
  pruning

### Uses Existing Mechanisms?

Yes. Tier A is already in place. Tiers B-D extend session-begin SKILL.md and the
consolidation script. No new infrastructure.

---

## Pattern 6: The "What Did NOT Work" Pattern (ECC)

### What It Is

Explicitly recording failed approaches as a distinct memory type. Rather than
only logging what succeeded, sessions end by documenting approaches that were
tried and abandoned. This prevents future sessions from repeating the same
failed paths.

**Origin:** everything-claude-code session file format (D2b Finding 4, D2b Novel
Ideas #4, D6a comparison matrix Finding "What Did NOT Work"). ECC session files
include a mandatory section: "What Failed" alongside "Goals" and "Results."

**Why it matters:** Currently SoNash MEMORY.md and SESSION_CONTEXT.md capture
what was accomplished and what to do next. They do not systematically capture
"we tried X, it didn't work, here's why." This means Claude can re-propose the
same approach that was already tried and rejected. The Reflexion paper (D4a
Finding 3) validates this pattern academically: verbal reinforcement from
failure improves subsequent performance.

### SoNash Implementation Sketch

**This is a convention change, not an infrastructure change.**

**Step 1 — Add "What Did NOT Work" to SESSION_CONTEXT.md template:**

In the session-end SKILL.md, add a required section after "What was completed":

```markdown
## What Did NOT Work This Session

[Required section even if empty. Record:]

- Approaches tried and abandoned (what, why abandoned)
- Paths not taken (what was considered but rejected, why)
- Confirmed dead ends (approaches ruled out with evidence)

Examples:

- Tried editing settings.json directly to fix MCP path — rejected (cross-locale
  conflict)
- Considered using OneDrive for memory sync — deferred (admin access concern at
  work)
- Attempted pattern X in hook Y — failed because hook timeout exceeded
```

**Step 2 — Add a "failed-approaches" memory type to MEMORY.md:**

```markdown
---
type: failed-approach
confidence: 1.0 # we ARE confident this doesn't work
ttl: permanent # failed approaches are permanently valuable
---

**Hook-based MCP injection at session-start**: Attempting to run MCP tool calls
inside SessionStart hooks causes the 5-6 minute startup hang bug (GitHub issue
#15140). The safe pattern is to inject context via stdout, not MCP tool calls.
[Session #231]
```

**Step 3 — Create `feedback_failed_approaches.md` as a standing topic file:**

This file accumulates cross-session failed approaches that have been confirmed
multiple times. It is loaded as part of the standard MEMORY.md topic file set.

Initial candidates (from research findings):

- MCP startup hang via hook-injected tool calls
- Docker-based memory servers (no admin at work locale)
- curl-based memory server approaches (incompatible with Windows portable
  install)
- Storing ECC full system (30 agents too heavy for solo operator)

**Step 4 — Add failed-approach prompt to session-end SKILL.md:**

```markdown
# Phase 3: Document What Did NOT Work

Before writing the session summary, ask: "What approaches were tried and
abandoned this session?" "What paths were considered and rejected?" Record at
least N/A if nothing significant failed.
```

### Effort Estimate

- Add section to session-end SKILL.md: 30 minutes
- Create feedback_failed_approaches.md with initial content: 1 hour
- Add type: failed-approach to MEMORY.md frontmatter schema: 15 minutes
- Populate with 3-5 known dead ends from research findings: 30 minutes

**Total: 2-2.5 hours. The lowest-effort pattern with immediate
session-to-session value.**

### Dependencies

- None. This is a convention change implemented entirely in skill markdown
  files.

### Uses Existing Mechanisms?

Yes. Extends session-end SKILL.md and Auto Memory. Zero new infrastructure.

### This Pattern Has the Best Effort/Value Ratio

Failed-approach documentation is the only pattern here that provides value from
the very first session it is applied. All other patterns require accumulation
(confidence scoring needs multiple sessions of data; decay needs time to pass;
promotion needs recurrence; context rot prevention is most valuable as the
system grows). This one works immediately.

---

## Pattern 7: Session-Memory Consolidation Pipeline (Poor-Man's AutoDream)

### What It Is

A structured process that runs at session-end to transform raw accumulated
session observations into clean, signal-dense long-term memory. Modeled on
Anthropic's unreleased AutoDream feature (`tengu_onyx_plover` flag) and the
community `dream-skill` (grandamenium/dream-skill). LightMem's academic
validation: three-stage pipeline (sensory filter → topic grouping → sleep-time
consolidation) produces 10.9% accuracy gains.

**Origin:** Multiple converging sources — AutoDream (D3b-2a, D6a, D6b CP-5),
dream-skill (D3c Finding 8), LightMem (D4a Finding 13), yuvalsuede architecture
(D3b-2b Finding 7). Also validated by the learning system already running in
SoNash (run-consolidation.js is a concrete, working example of the same pattern
applied to PR reviews).

**AutoDream status:** Feature-flagged (`tengu_onyx_plover: enabled: false`) as
of 2026-03-31. The dream-skill community plugin replicates it and is available
now. Multiple research sources confirm AutoDream has a 4-phase cycle: orient,
gather signal, consolidate, prune. It triggers at minHours: 24, minSessions: 5.

### SoNash Implementation Sketch

SoNash already has a consolidation pipeline for the learning system. This
pattern extends the same approach to MEMORY.md.

**Option A: Use dream-skill community plugin (lower effort, external
dependency)**

```bash
claude plugin marketplace add grandamenium/dream-skill
```

Integrate into session-end SKILL.md as Phase 4:

```markdown
# Phase 4: Memory Consolidation (run every 5 sessions OR when MEMORY.md > 160 lines)

Check: cat .claude/canonical-memory/MEMORY.md | wc -l If > 160 OR
sessions_since_last_consolidation >= 5: Run: /dream Review output before
committing
```

**Risk:** dream-skill maturity is unconfirmed. Windows compatibility not
verified in research. Use --dry-run first. Treat first 3 runs as experiments.

**Option B: Custom consolidate-memory.js (higher effort, full control)**

Build a Node.js script that implements the 4 consolidation phases. This is the
"poor-man's AutoDream" approach. The script follows the same pattern as
`run-consolidation.js` (which already consolidates PR reviews →
CODE_PATTERNS.md):

```javascript
// scripts/consolidate-memory.js
// Phase 1 — Orient: Read all files in .claude/canonical-memory/, extract frontmatter
// Phase 2 — Gather signal: find duplicates (Jaccard 60%), relative dates, TTL candidates, promotions
// Phase 3 — Consolidate: merge duplicates, convert "last Tuesday" → "2026-03-25", resolve contradictions
// Phase 4 — Prune: apply TTL rules, archive expired entries, output summary

// Safety: --dry-run flag shows what would change without modifying files
// Output: consolidation-report.md listing all changes for human review
```

**Trigger conditions (add to session-end SKILL.md):**

```markdown
# Phase 4: Memory Consolidation Trigger Check

node scripts/check-consolidation-needed.js → Returns: skip / suggest / required
skip: fewer than 5 sessions since last run AND MEMORY.md < 160 lines suggest: 5+
sessions since last run required: MEMORY.md > 180 lines OR last run > 10
sessions ago If suggest or required: run consolidation
```

**State tracking (add to .claude/state/consolidation.json):**

```json
{
  "last_consolidation_session": 247,
  "last_consolidation_date": "2026-03-28",
  "sessions_since_consolidation": 3,
  "memory_line_count_at_last_run": 142
}
```

Note: `consolidation.json` already exists in `.claude/state/`. Check current
schema before adding fields.

**The four phases mapped to SoNash specifics:**

| Phase         | What                                                           | How                                                |
| ------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| Orient        | Read MEMORY.md index + all 39 topic files                      | fs.readFileSync, parse frontmatter                 |
| Gather signal | Find dupes, expired TTLs, promotion candidates, relative dates | Jaccard similarity, date regex, frontmatter fields |
| Consolidate   | Merge dupes, fix dates, flag contradictions                    | String manipulation, structured output             |
| Prune         | Apply TTL archiving, log all changes                           | Move files to archive/, write report               |

**Human review gate:** The consolidation script writes a
`consolidation-report.md` listing every change it made. The session-end pipeline
surfaces this report to the user before committing. Nothing is silently pruned.

**Recommended path:**

1. Start with Option B (custom script) at `--dry-run` mode for 3 sessions
2. Review output to validate the deduplication and TTL logic is not
   over-aggressive
3. Enable write mode after validation
4. Monitor for 10 sessions
5. If AutoDream ships natively, disable custom script (AutoDream supersedes it)

### Effort Estimate

**Option A (dream-skill):** 2-3 hours (install, test, integrate into session-end
SKILL.md)

**Option B (custom script):**

- Core consolidation script (phases 1-4): 6-8 hours over 2 sessions
- consolidation-needed check script: 1 hour
- session-end SKILL.md integration: 1 hour
- --dry-run testing and validation: 2 hours

**Total Option B: 10-12 hours (2-3 sessions)**

This is the highest effort pattern but also the most foundational. Patterns 1,
2, 3, and 5 all depend on a consolidation pass running to enforce their rules.
Without the consolidation pipeline, frontmatter annotations, TTL markers, and
promotion rules accumulate without effect.

### Dependencies

- consolidation.json already exists (check schema before adding fields)
- run-consolidation.js provides the established pattern to copy
- session-end SKILL.md (Phase 4 addition)
- Patterns 1, 2, 3 (provide the frontmatter metadata the consolidation script
  reads)

### Uses Existing Mechanisms?

Extends existing mechanisms (session-end pipeline, consolidation.json,
run-consolidation.js pattern). The core script is new but follows a
well-established pattern already deployed for the learning system.

---

## Implementation Sequencing

These patterns are interdependent. The recommended build order:

```
WEEK 1: Foundation
  └── Pattern 6 (What Did NOT Work)
      -- Convention change, immediate value, zero dependencies, 2 hours
  └── Pattern 5 Tier B (budget check in session-begin)
      -- Read-only guard, 1 hour, no dependencies

WEEK 2-3: Metadata Layer
  └── Patterns 1 + 2 + 3 together (confidence + TTL + promotion frontmatter)
      -- Same frontmatter block, same session, 6-8 hours combined
      -- Write the spec before touching any files
      -- Annotate existing MEMORY.md files in one focused session

WEEK 3-4: Consolidation Engine
  └── Pattern 7 (consolidation pipeline, Option B --dry-run first)
      -- Depends on Patterns 1/2/3 metadata being in place
      -- Start with dry-run: 3 sessions of output review before enabling writes
      -- 10-12 hours total

ONGOING:
  └── Pattern 4 (phase-based rule loading)
      -- Independent of other patterns; can run in parallel or later
      -- Do this after the consolidation pipeline is stable
      -- 3-4 hours
```

**Minimum viable implementation (if time-constrained):** Pattern 6 only. Two
hours of work, no dependencies, immediate session-to-session value. The "What
Did NOT Work" section in session-end is the single highest ROI change available.

---

## Sources

| #   | Source                                                                         | Type                             | Trust       | Date       |
| --- | ------------------------------------------------------------------------------ | -------------------------------- | ----------- | ---------- |
| 1   | D2b-everything-cc-interface.md                                                 | Findings synthesis               | HIGH        | 2026-03-31 |
| 2   | D3a-2-github-agent-memory.md                                                   | Findings synthesis               | HIGH        | 2026-03-31 |
| 3   | D3b-2b-dev-blogs.md                                                            | Findings synthesis               | HIGH        | 2026-03-31 |
| 4   | D4a-academic-memory-patterns.md                                                | Findings synthesis               | HIGH        | 2026-03-31 |
| 5   | D6a-comparison-matrix.md                                                       | Findings synthesis               | HIGH        | 2026-03-31 |
| 6   | D6b-architecture-patterns.md                                                   | Findings synthesis               | HIGH        | 2026-03-31 |
| 7   | D8a-hybrid-enhanced-design.md                                                  | Findings synthesis               | HIGH        | 2026-03-31 |
| 8   | D9a-clean-slate-architecture.md                                                | Findings synthesis               | HIGH        | 2026-03-31 |
| 9   | D10a-failure-modes-risks.md                                                    | Findings synthesis               | HIGH        | 2026-03-31 |
| 10  | D10b-solo-dev-feasibility.md                                                   | Findings synthesis               | HIGH        | 2026-03-31 |
| 11  | D3c-marketplace-plugins.md                                                     | Findings synthesis               | MEDIUM-HIGH | 2026-03-31 |
| 12  | https://dev.to/suede/the-architecture-of-persistent-memory-for-claude-code-17d | Yuval's architecture post        | MEDIUM      | 2026-01-28 |
| 13  | https://dev.classmethod.jp/en/articles/claude-code-global-memory-with-git/     | lin-yuchen system                | MEDIUM-HIGH | 2026-03-23 |
| 14  | https://github.com/vanzan01/cursor-memory-bank                                 | cursor-memory-bank               | MEDIUM      | 2024-12    |
| 15  | https://github.com/affaan-m/everything-claude-code                             | ECC                              | HIGH        | 2026-03    |
| 16  | https://arxiv.org/abs/2510.18866                                               | LightMem paper                   | MEDIUM-HIGH | 2025-10    |
| 17  | https://arxiv.org/abs/2303.11366                                               | Reflexion (NeurIPS 2023)         | HIGH        | 2023-03    |
| 18  | https://www.trychroma.com/research/context-rot                                 | Context Rot (Chroma)             | HIGH        | 2025       |
| 19  | https://arxiv.org/abs/2603.04549                                               | A-MAC (memory admission control) | MEDIUM-HIGH | 2026-03    |

---

## Contradictions

**dream-skill availability and Windows compatibility:** D3c confirms dream-skill
exists as a community plugin and is available for install. D8a flags it as "no
confirmed installation URL." D10b rates it MEDIUM confidence. The gap: Windows
compatibility and maturity are unverified. This is why Option B (custom script)
is presented as a parallel path.

**AutoDream status:** D5b rates AutoDream at LOW confidence (not confirmed from
official changelog). D9a states "AutoDream (feature flag `tengu_onyx_plover`) is
live on this account" but this contradicts the official feature-flag being
disabled. The safe assumption: AutoDream is available on some accounts via early
access but is not GA. Build the custom consolidation pipeline regardless; when
AutoDream ships GA, evaluate whether to replace or complement it.

**Decay caution:** D10a NR-05 explicitly warns that confidence decay creates a
"premature forgetting" failure mode for rarely-used but valid patterns. The
implementation sketches above incorporate this warning: decay is de-ranking and
archiving, never deletion; permanent TTL is the default; behavioral corrections
are always permanent. This contradicts simpler decay implementations that use
hard expiration.

---

## Gaps

1. **dream-skill Windows compatibility is not confirmed.** Option A depends on
   this. Until tested, Option B (custom script) is more reliable.

2. **Consolidation.json current schema.** The file exists at
   `.claude/state/consolidation.json` but its current schema was not read during
   this synthesis. Before adding fields for Pattern 7 state tracking, read the
   current file to avoid schema conflicts.

3. **Claude Code glob-scoped rule loading behavior.** Pattern 4 (phase-based
   rules) depends on `.claude/rules/` glob frontmatter loading correctly. The
   behavior needs to be tested before being relied upon. Official docs confirm
   the feature exists (D3b-2b Finding 2) but production behavior on Windows has
   not been verified in the research.

4. **session-end SKILL.md current structure.** The session-end SKILL.md was not
   read in full during synthesis. Before implementing Patterns 6 and 7 (which
   both add phases to session-end), the current phase structure needs to be
   checked to avoid inserting phases in the wrong location.

---

## Serendipity

**Pattern 6 is the sleeper value.** Confidence scoring, TTL decay, and
consolidation pipelines are well-understood patterns with well-understood
tradeoffs. The "What Did NOT Work" pattern is less discussed in the academic and
community literature but has the most immediate practical impact for a system
with 250+ sessions of accumulated work. Negative knowledge (what doesn't work)
is as valuable as positive knowledge (what works) but is almost never explicitly
captured. SoNash already has many implicit failed approaches that re-surface as
proposals in new sessions.

**The learning system is proof of concept for all of this.**
run-consolidation.js, promote-patterns.js, route-enforcement-gaps.js,
suggest-pattern-automation.js — this pipeline already implements confidence
promotion, pattern consolidation, and structured decay for PR review patterns.
Pattern 7 is not a new idea for SoNash; it is extending an existing, working
pipeline to cover MEMORY.md in addition to CODE_PATTERNS.md. The implementation
friction is lower than it appears.

**All seven patterns share a single implementation surface.** Five of the seven
patterns (1, 2, 3, 5, 7) reduce to the same deliverable: a frontmatter
convention in MEMORY.md files and a consolidation script that reads and acts on
that frontmatter. Building Pattern 7 (consolidation script) automatically
enables Patterns 1, 2, 3, and 5. The build order matters: write the
consolidation script first; the other patterns are just inputs to it.

---

## Confidence Assessment

- HIGH claims: 12
- MEDIUM claims: 6
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

All implementation sketches are grounded in verified research findings and
cross-referenced against SoNash's actual codebase inventory (hooks, scripts,
skill structure, existing consolidation patterns). The primary uncertainty is
dream-skill Windows compatibility (MEDIUM), which is addressed by providing
Option B as a fallback. No claim here depends solely on unverified training
data.
