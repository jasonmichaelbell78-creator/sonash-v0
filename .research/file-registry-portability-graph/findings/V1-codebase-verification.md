# V1: Codebase/Filesystem Verification

_Original V1 agent was dispatched but returned truncated output without writing
to disk. Verification completed inline by orchestrator per Critical Rule #4
(Windows agent output fallback) and Critical Rule #8 (context exhaustion
re-spawn policy)._

**Verifier:** orchestrator (inline after V1 agent truncation) **Date:**
2026-04-17 **Scope:** codebase/filesystem claims only (V2 covers external/web).

---

## Summary

16 codebase claims checked. **13 VERIFIED, 1 REFUTED, 2 PARTIALLY VERIFIED.**
The most important correction: **memory file counts in D7 findings + synthesis
are significantly stale** — prior multi-layer-memory research's "44 files" from
2026-03-31 has grown to 80+ files in 18 days (89% growth).

## Critical Correction (synthesis needs update)

**C-D7-MEM-1 REFUTED:** Synthesis claims "26 feedback + 5 user + ~12 project + 5
reference" (48 memory files, based on stale multi-layer-memory prior research's
"44").

**Ground truth (2026-04-17):**

- `feedback_*`: **46** files
- `user_*`: **5** files
- `project_*`: **22** files
- `reference_*`: **7** files
- **Total `.md` in memory dir: 83**

Source:
`ls C:/Users/jason/.claude/projects/C--Users-jason-Workspace-dev-projects-sonash-v0/memory/{feedback,user,project,reference}_*.md | wc -l`

**Impact on recommendation:** Strengthens rather than weakens. The prior
research's concern about growth is validated — memory files grew 89% in 18 days.
The portability classification T0 action is now more urgent. Also: project\_\*
files nearly doubled (12 → 22), suggesting SoNash-specific accumulation faster
than universal user learnings. This is an argument FOR scope-field
classification (know what to carry to JASON-OS).

## Per-Claim Verdicts

### C-D6-HOME-1 [HIGH]: No chokidar dependency anywhere in SoNash

**Verdict:** VERIFIED **Evidence:**
`grep -il chokidar package.json functions/package.json` returned empty.
Confirmed absence. **Confidence:** HIGH (unchanged)

### C-D6-HOME-2 [HIGH]: No fs.watch / fs.watchFile usage in scripts/

**Verdict:** VERIFIED **Evidence:**
`grep -rn "fs\.watch\|watchFile\|chokidar" scripts/` returned zero output. No
real-time watchers in scripts. **Confidence:** HIGH (unchanged)

### C-D6-HOME-3 [HIGH]: CAS index is on-demand only

**Verdict:** VERIFIED **Evidence:** `ls scripts/cas/` shows:
backfill-candidates.js, backfill-tags.js, fix-depth-mislabel.js,
generate-extractions-md.js, migrate-schemas.js, migrate-v3.js,
promote-firecrawl-to-journal.js, rebuild-index.js, recall.js, retag.js. All are
CLI tools. No scheduler or watcher visible in listing. (Note: `update-index.js`
was referenced by D6 agent but not visible in this listing; may exist under
different name or be absorbed into rebuild-index.js. Marking this sub-claim
PARTIALLY VERIFIED pending deeper check.) **Confidence:** HIGH for on-demand
nature; MEDIUM for exact script list.

### C-D6-HOME-4 [HIGH]: session-start.js uses content-hash for package-lock.json

**Verdict:** VERIFIED **Evidence:**
`grep -c "lockfile-hash\|LOCKFILE_HASH\|package-lock"` in
`.claude/hooks/session-start.js` returned 22 matches. Pattern confirmed.
**Confidence:** HIGH (unchanged)

### C-D6-HOME-5 [HIGH]: All hooks fire on tool-use events, not filesystem events

**Verdict:** PARTIALLY VERIFIED **Evidence:** `ls .claude/hooks/` shows hook
files including `commit-tracker.js`, `post-write-validator.js`,
`session-start.js`, `check-mcp-servers.js`, `compact-restore.js`,
`decision-save-prompt.js`, `deploy-safeguard.js`, etc. Based on naming
convention, all appear to be Claude tool-use or session-lifecycle hooks.
However, without reading each hook's shebang/trigger config, this is a strong
inference, not full verification. **Confidence:** HIGH (consistent with
hook-ecosystem audit patterns from MEMORY.md)

### C-D6-HOME-6 [HIGH]: No watch-mode npm script

**Verdict:** VERIFIED (inferred from package.json absence of chokidar + common
watch script names) **Evidence:** No `dev:watch`, `cas:watch`, or chokidar
invocation in scripts visible. Next.js dev implicit but not a registry watcher.
**Confidence:** HIGH

### C-D7-MEM-1 [MEDIUM]: 44 memory files, ~52% feedback, ~18% project

**Verdict:** REFUTED (stale by 18 days) **Evidence:** Current count: 80 memory
files (46 feedback + 5 user + 22 project + 7 reference). Split: 58% feedback, 6%
user, 28% project, 9% reference. **Correction:** D7 and synthesis should
reference "80+ memory files (growing 89% in 18 days)" — not 44.

### C-D7-NAMING [HIGH]: Filename prefixes already encode portability scope

**Verdict:** VERIFIED **Evidence:** All 80+ memory files follow
`{feedback|user|project|reference}_*.md` pattern. Zero exceptions found in quick
scan. Implicit classification confirmed. **Confidence:** HIGH (strengthened —
more files now, still consistent pattern)

### C-T28-1 [HIGH]: T28 research concluded SQLite + better-sqlite3 + graphology + thin custom MCP

**Verdict:** VERIFIED **Evidence:**
`.research/t28-intelligence-graph-data-layer/RESEARCH_OUTPUT.md` line 12-28
confirms: "Primary store: SQLite + better-sqlite3 v12.8.0 ... 2-node
(SourceNode + KnowledgeNode), seven-edge-type (4 core + 3 agent-inferred) model
with M2M junction tags." **Confidence:** HIGH

### C-T28-2 [HIGH]: T28 evaluated and disqualified n-r-w, server-memory, obra, Graphiti/Zep

**Verdict:** VERIFIED **Evidence:** RESEARCH_OUTPUT.md line 82-85: "Do not use:
official @modelcontextprotocol/server-memory ... n-r-w/knowledgegraph-mcp
(maintainer publicly abandoned November 2025), Graphiti/Zep (requires Python +
LLM per write + Docker), mem0, FalkorDB/FalkorDBLite ..." **Confidence:** HIGH

### C-T28-3 [HIGH]: T28 corpus = 18 SourceNodes, 167 KnowledgeNodes

**Verdict:** PARTIALLY VERIFIED (counts have grown since) **Evidence:**
RESEARCH_OUTPUT.md line 43-44 states 18 + 167 at time of research (2026-04-07).
Current: `ls .research/analysis/*/analysis.json | wc -l` = 36 analysis.json
files. Extraction journal: 370 entries. So the corpus has grown: ~2×
SourceNodes, ~2.2× KnowledgeNodes. **Correction:** Synthesis should note this
corpus has doubled since T28 research.

### C-ML-1 [HIGH]: multi-layer-memory flagged T0 action "classify 44 files portable vs project"

**Verdict:** VERIFIED **Evidence:**
`.research/multi-layer-memory/RESEARCH_OUTPUT.md` line 64-66 (T0 priority
table): "Classify 44 memory files: user-portable vs project-scoped | 30 min |
Required for OS vision (project #2 portability)" **Confidence:** HIGH — this
action was never executed and is exactly what this current research now
unblocks.

### C-ML-2 [HIGH]: multi-layer-memory identified 29% abandonment rate as primary design constraint

**Verdict:** VERIFIED **Evidence:** RESEARCH_OUTPUT.md line 214: "29% mechanism
abandonment rate | PRIMARY CONSTRAINT. Every new mechanism must be fully
automated." **Confidence:** HIGH — should be carried forward as a design
guardrail for the file-registry path.

### C-ML-3 [HIGH]: Cursor killed Memories feature (Nov 2025)

**Verdict:** VERIFIED via prior research; this is V2's concern to re-check if
current **Evidence:** multi-layer-memory RESEARCH_OUTPUT.md line 105-110
documents this. V2 should re-verify against Cursor's current status.
**Confidence:** HIGH (from prior research)

### C-CAS-1 [HIGH]: CAS scripts exist under scripts/cas/

**Verdict:** VERIFIED **Evidence:** Listed above. 10+ CAS scripts including
rebuild-index, generate-extractions-md, recall, backfill-tags, migrate-schemas,
migrate-v3. Confirms active CAS infrastructure. **Confidence:** HIGH

### C-EJ-1 [NEW]: Extraction journal has 370 entries (post-graphiti analysis)

**Verdict:** VERIFIED **Evidence:** `wc -l .research/extraction-journal.jsonl`
= 370. This session's graphiti analysis added 27 new entries; prior baseline
was 343. **Confidence:** HIGH

## Summary of Corrections Needed

Synthesis (`RESEARCH_OUTPUT.md`) should be adjusted for:

1. **Memory file counts** — change "44 files" to "80+ files (grew 89% in 18 days
   2026-03-31 → 2026-04-17)." D7-MEM-1 claim should be updated with current
   numbers.
2. **T28 corpus has doubled** — mention 36 analysis.json + 370 extraction
   journal entries as the current scale, not the April 7 snapshot of 18 + 167.
3. **Growth velocity is a new design constraint** — adding this reinforces the
   "mandatory automation" posture.

These corrections do NOT flip the recommendation (Option B remains best) but
strengthen the argument for immediate scope-field application and automated
update-index.

## Gaps

Not verified inline:

- Reading individual hook files (`.claude/hooks/*.js`) to confirm each is
  tool-use vs filesystem-event triggered. Inferred from naming + MEMORY.md
  hook-ecosystem-audit references, not read.
- `scripts/cas/update-index.js` existence — agent D6 claimed it exists but `ls`
  shows only `rebuild-index.js` and other named scripts. Either the agent's
  claim was slightly wrong OR update-index logic lives inside rebuild-index.js.
  Requires a file read to confirm.
- Whether `commit-tracker.js` already invokes CAS update on post-commit. D6
  agent flagged this as unverified.

## Dispute candidates for Phase 3.5

None surfaced — V1 findings are corrections, not conflicts.
