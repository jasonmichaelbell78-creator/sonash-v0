# CAS — Remaining Tasks to Close T28

**Created:** 2026-04-14 (Session #279) **Status:** Handoff document — clear
context safely with this and resume next session. **Branch:** `planning-41426`
(4 commits ahead of origin, NOT pushed)

---

## Where we are right now

T28 (Content Analysis System) PLAN.md: **13 of 15 steps done**. T29
(synthesis-consolidation sub-plan): **15/15 done — fully closed Session #279**.

Active CAS work remaining is a small punch list of finishing touches. CAS is
production-ready for analysis + synthesis; only audit + E2E verification are
left to call T28 itself complete.

---

## Step-by-step remaining work

### Step A — CAS PLAN Step 14: `/skill-audit` on all 7 CAS skills

**Tracker:** T38 (currently blocked on T28; unblock when Step A starts)
**Effort:** Medium — 7 skills × ~10-15 min audit each, parallelizable
**Method:** Spawn 7 `code-reviewer` agents in parallel (one per skill) using the
synthesis-consolidation Step 15 audit prompt as a template (4 files, 5 focus
areas, structured findings list). For each:

1. `.claude/skills/analyze/` (router)
2. `.claude/skills/recall/` (query)
3. `.claude/skills/repo-analysis/` (handler — recently bumped to v4.6)
4. `.claude/skills/website-analysis/` (handler)
5. `.claude/skills/document-analysis/` (handler)
6. `.claude/skills/media-analysis/` (handler)
7. `.claude/skills/synthesize/` (consumer — bumped to v1.2 in Session #279)

**Per skill, focus on:** SKILL.md follows shared conventions (Critical Rules,
When to Use, When NOT to Use, Routing Guide, Version History); REFERENCE.md has
no TBD/placeholder; Zod schema usage is correct; cross-skill references are
consistent; deprecation references use the new naming.

**Triage mode 3 likely best:** Fix P0/P1 in-session, defer P2 to TDMS, skip P3.

**Done when:** All findings addressed or in TDMS. Update PLAN.md Step 14 header
from `⏳ PENDING` to `✅ COMPLETE`.

### Step B — CAS PLAN Step 15: End-to-End verification

**Effort:** Small-Medium — full pipeline run on a fresh source + `/recall`
verification.

1. Pick a NEW source (not in current 35-source corpus) — recommend a small test
   repo or doc to keep run time reasonable.
2. `/analyze <url>` → router selects handler → handler produces full Standard
   artifact set (analysis.json, creator-view.md, value-map.json, findings.jsonl,
   summary.md, deep-read.md if applicable).
3. `npm run cas:rebuild-index` → SQLite refresh.
4. `/recall` queries:
   - Tag query: `/recall --tag=<tag-from-new-source>` → returns the new source.
   - Type filter: `/recall --type=<source_type>` → returns expected subset.
   - Free-text search via FTS5: `/recall <keyword-from-new-source>` → returns
     hit.
   - Cross-source: query something the new source shares with an existing one →
     both surface.
5. Verify `extraction-journal.jsonl` got the new entries.
6. Run `/synthesize --resume` (if last synthesis is recent enough) or full
   `/synthesize` to incorporate the new source.
7. Inspect `last_synthesized_at` got bumped on the new source's analysis.json.

**Done when:** All 6 verification points pass. Update PLAN.md Step 15 header
from `⏳ PENDING` to `✅ COMPLETE`. Flip T28 todo to `completed`. Unblock T38
(it was conditional on T28).

### Step C — Close T28 + housekeeping

1. Mark T28 todo `completed` in `.planning/todos.jsonl` (auto-render hook will
   regenerate TODOS.md on Edit).
2. Update CAS PLAN.md status banner from "⏳ NEAR-COMPLETE" to "✅ COMPLETE".
3. SESSION_CONTEXT.md note: T28 closed.

---

## Optional follow-ups (already-tracked todos)

These are CAS-adjacent but not blocking T28 closure:

- **T47** (P2, pending) — Wave 6 CAS source seed: queue 10 sources to fill
  synthesis gaps identified in Wave 5 (Sober Grid, I Am Sober, InTheRooms, 42
  CFR Part 2, Firebase ref, TS MCP SDK, whisper.cpp, monolith, readable-cli,
  SBOM tool). Method: `/analyze` each, then `/synthesize --resume` to diff
  against current baseline. Will likely surface new opportunities.

- **T48** (P2, pending) — Adoption Verdict backfill: ~20 product-repos in the
  corpus need the Section 2b verdict (Adopt/Trial/Extract-only/Avoid) added
  retroactively per repo-analysis v4.6 schema. Parallelizable via agents (1 per
  repo). Could pair naturally with Step A skill-audit since both touch the same
  artifacts.

- **T42** (P3, pending) — Standalone research on Nous Research Hermes models for
  agent tool use. Not CAS-implementation; can run anytime via `/deep-research`.

---

## Upstream fix: `/deep-plan` template gap

**Discovered in Session #279.** `/deep-plan` REFERENCE.md PLAN.md template
(lines 119-154) does not include a status banner, per-step ✅ markers, or any
hygiene mechanism. This is why both T29 and T28 PLAN files needed manual
backfilling of completion markers — drift was inevitable.

**Three-part fix recommended:**

1. **Update `.claude/skills/deep-plan/REFERENCE.md` PLAN.md template** to
   include:
   - Status banner placeholder at top: `> **Status:** ⏳ NEW (0 of N steps)`
   - Per-step header pattern with status placeholder:
     `## Step N: [Title] ⏳ NEW`
   - A "Status Summary" section near the top with quick-reference status list

2. **Update `.claude/skills/deep-plan/SKILL.md`** to add a Critical Rule:
   - "When generating PLAN.md, include status banner + per-step status markers
     per template. Plans MUST be updated to reflect step completion as work
     happens — same hygiene contract as TODOS.md vs todos.jsonl."

3. **Add `npm run plans:hygiene` checker** (parallel to `roadmap:hygiene`) that
   scans `.planning/*/PLAN.md` files and surfaces:
   - Plans missing status banner
   - Step headers lacking ✅/⏳/❌ markers
   - Plans where recent commits reference the plan but no step status changed
     (mirrors the roadmap-hygiene "may be complete" detector)

**Tracker:** Create new todo (T49) "Fix /deep-plan template — add status banner

- per-step ✅ markers + plans:hygiene checker" — P2.

---

## State to preserve before context clear

Already on disk (no extra action needed):

- `.planning/content-analysis-system/PLAN.md` — banner + 13/15 steps ✅, 2 ⏳
- `.planning/synthesis-consolidation/PLAN.md` — banner + 15/15 steps ✅
- `.planning/todos.jsonl` — T29, T37, T40 marked completed (24 active, 23
  completed)
- `.planning/TODOS.md` — auto-rendered (24 active)
- `.research/analysis/synthesis/test-step13/RESULTS.md` — Step 13 evidence
- `SESSION_CONTEXT.md` — bumped to Session #279

Pending in working tree (intentionally not committed yet — batch with
/session-end):

- `.claude/state/agent-invocations.jsonl` — hook drift
- `.claude/state/review-metrics.jsonl` — hook drift
- `.claude/state/warned-files.json` — hook drift

Plus this file (`REMAINING_CAS_TASKS.md`) — should be committed alongside the
PLAN.md hygiene update + todo closures so the next session loads it from disk.

---

## Resume protocol next session

1. `/session-begin` — pre-flight + acknowledge any new warnings.
2. Read this file (`.planning/content-analysis-system/REMAINING_CAS_TASKS.md`).
3. Pick:
   - **(a)** Step A (skill-audit, parallelizable, ~30-60 min total)
   - **(b)** Step B (E2E /recall verify, ~15-30 min)
   - **(c)** T48 backfill (parallelizable, ~30-60 min)
   - **(d)** T47 Wave 6 source seed (heavier, queue + synthesize, ~2 hours)
   - **(e)** T49 (new) — fix /deep-plan template + add plans:hygiene checker
4. Whatever order — recommend Step A → Step B → T48 → close T28 → T47 → T49.

---

## Update — Session #280 (2026-04-14): Step 3 self-audit infrastructure SHIPPED

The original handoff didn't include Step 3 — it was discussed and approved
mid-session. Step 3 is now COMPLETE (4 sub-steps, 3 commits on branch `41426`,
pushed to origin).

**What changed since the original handoff was written:**

- **New canonical doc:**
  [`.claude/skills/_shared/SELF_AUDIT_PATTERN.md`](../../.claude/skills/_shared/SELF_AUDIT_PATTERN.md)
  — pattern for per-skill self-audit scripts (location, CLI, dimensions,
  helpers, state schema, wiring).
- **New reference impl:**
  [`scripts/skills/skill-audit/self-audit.js`](../../scripts/skills/skill-audit/self-audit.js)
  — runs all 9 SKILL_STANDARDS dimensions against a state file. PASS/FAIL/WARN
  per dimension, exit 0/1/2, `---SUMMARY---` JSON block.
- **skill-audit SKILL.md v3.6:** new Phase 5.0 invokes the script before
  existing prose checks.
- **skill-creator SKILL.md v3.4:** Phase 4.3 now scaffolds
  `scripts/skills/<name>/self-audit.js` for new Standard/Complex skills; Phase 5
  verifies both prose phase + script presence.
- **skill-audit REFERENCE.md Cat 12:** new "Canonical Fix Action" subsection —
  when Cat 12 scores <7, the canonical Phase 4 fix is to create a self-audit.js
  per the pattern (5 concrete steps documented).

**Impact on Step A (the original next task):**

Each `/skill-audit` on the 7 CAS skills will now likely add a
`scripts/skills/<skill-name>/self-audit.js` per the Cat 12 canonical fix action.
This widens Step A's blast radius (state schema extensions on existing skills
may be needed too) but pays off long-term.

---

## Cross-locale resume (work ↔ home)

This branch (`41426`) is on origin. To resume on the other machine:

```bash
git fetch origin
git checkout 41426    # or `git pull` if already on it
git log --oneline -8  # verify last 4 commits are: 78d97ab7, 06f3faa8, 91444183, e3a9f93c
```

Then `/session-begin` and read this file. The Step A plan below (W2 approach)
was approved mid-Session #280 — proceed with it without re-litigating the
design.

**Files to read in order at home:**

1. `SESSION_CONTEXT.md` — Session #280 work summary + next pickup point
2. This file (`REMAINING_CAS_TASKS.md`) — full Step A spec + above update
3. `.claude/skills/_shared/SELF_AUDIT_PATTERN.md` — the new canonical pattern
4. `scripts/skills/skill-audit/self-audit.js` — the reference impl (template
   when adding self-audit to other skills via Cat 12 fix)

**Memory caveat:** Auto-memory is per-locale (under user profile, not in repo).
Findings/decisions from this session that weren't committed to git aren't
visible at home. Everything material from Step 3 is in commits.
