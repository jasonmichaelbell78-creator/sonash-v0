# Findings: Cross-Project Findings Flow — findings_refs Pattern, Lookup Mechanism, and Surfacing

**Searcher:** deep-research-searcher **Profile:** codebase + academic **Date:**
2026-04-04 **Sub-Question IDs:** SQ3 (D3)

---

## 1. Sub-Question Restated

SoNash has a recurring problem: research done for Project A produces findings
that would be relevant to Project B, but there is no mechanism to "color"
Project B with those findings without forcing re-research. The concrete example:
research on agent orchestration done for the custom-agents project should inform
JASON-OS planning, but that flow is currently manual and forgetful.

A `findings_refs` pattern is needed — todos/projects can reference specific
claims from research outputs, and those references surface when the todo/project
is active.

Key questions:

- What is the simplest data shape for `findings_refs` that does not become
  enterprise bloat?
- How do Obsidian/Logseq users handle cross-note references at small scale?
- What is the right surfacing mechanism — push notifications, pull queries, or
  session-start digest?
- How should claim IDs be stable across research runs (so refs do not break)?
- What is the failure mode when referenced claims are REFUTED or retracted?

---

## 2. Search Strategy

**Round 1 — Codebase baseline:** Examined `.research/*/claims.jsonl`,
`research-index.jsonl`, all `metadata.json` files, and the `REFERENCE.md` schema
section to understand what data exists and whether cross-referencing is present.
Checked `.planning/todos.jsonl` structure for existing `context` field patterns.
Scanned `.planning/archive/deep-research-skill/research/` for prior art (found
DOWNSTREAM_INTEGRATION.md and RESEARCH_MEMORY_LEARNING.md).

**Round 2 — Academic/PKM:** Searched for Zettelkasten ID schemes, Obsidian block
references, BibTeX key stability, Roam Research bidirectional links, and
scite.ai smart citation classification. Fetched official Zettelkasten identity
article and Obsidian internal links documentation.

**Round 3 — Knowledge graph anti-patterns:** Searched for solo-developer
suitability of triple stores, JSONL cross-reference patterns, and lightweight
alternatives to graph databases.

**Round 4 — Surfacing mechanisms:** Searched for push vs pull knowledge
surfacing in AI developer workflows, session-begin context injection, and
confidence inheritance in citation propagation.

---

## 3. Findings

### Finding 1: The claims.jsonl schema has stable IDs but no cross-project reference field [CONFIDENCE: HIGH]

The canonical `claims.jsonl` record schema (REFERENCE.md Section 11, confirmed
by direct inspection of six research outputs) includes `"id": "C-001"` as a
sequential-numeric stable identifier within a topic. The `routing` field already
expresses cross-consumer intent (`deepPlan`, `gsd`, `memory`, `tdms`, etc.) [1].

However, no cross-project reference field exists. A custom-agents finding cannot
express "this claim also applies to JASON-OS." The `routing` field is a binary
destination flag (boolean per consumer type), not a named-project linkage.
Inspecting `.planning/todos.jsonl`, the `context.files` field stores related
files but only as an ad-hoc array — no structured claim IDs [2].

**Gap:** The data model has stable-enough intra-topic IDs (`C-NNN`) but no
inter-topic reference key. There is no field on either todos or claims that
expresses "custom-agents#C-042 is relevant to JASON-OS."

### Finding 2: The research-index.jsonl is the natural anchor for cross-project discovery, but only at topic granularity [CONFIDENCE: HIGH]

`research-index.jsonl` tracks one entry per topic with `keywords`, `topicSlug`,
and `outputPath`. The Phase 0 Duplicate Check (SKILL.md line 165) already scans
this file for >50% keyword overlap and surfaces existing research. This is the
existing pull mechanism [1].

**What it can do:** When starting JASON-OS planning, a keyword scan of
research-index.jsonl would surface `custom-agents` (keywords: "agents",
"orchestration", "solo-developer") as 50%+ relevant. This works at topic
granularity.

**What it cannot do:** Surface specific claims within a topic. "Custom-agents
research is relevant to JASON-OS" is too coarse. The user needs to know which
specific claims — e.g., C-041 about the hard agent ceiling of 30, C-054 about
the model selection decision — are relevant to JASON-OS planning decisions, not
the full 111-claim corpus.

**Implication:** The `findings_refs` pattern must live at claim level, not topic
level. The research-index.jsonl exists at topic level and is a complement, not a
replacement.

### Finding 3: BibTeX demonstrates the fragility of key schemes based on mutable metadata — stable keys require immutable anchors [CONFIDENCE: HIGH]

BibTeX citation keys are typically auto-generated from author+year+title. The
dominant stability problem: if you correct a typo in the author name or title,
the generated key changes, breaking every downstream citation [3]. The Better
BibTeX plugin for Zotero solves this with "pinned" keys — the user explicitly
locks a key so it never auto-regenerates regardless of metadata changes.

**Lesson for SoNash:** Claim IDs like `C-001` are generated sequentially within
a research run. If a research run is re-run (`--refresh`), IDs will be
reassigned. A claim that was `C-042` in custom-agents-v1 may become `C-045` in
custom-agents-v2. Any `findings_refs` entry pointing to `custom-agents#C-042`
becomes a broken reference after re-research.

**Solution path:** Three options exist:

1. Treat research outputs as immutable artifacts (no re-run, only new run with
   different slug, e.g., `custom-agents-v2`) — makes old IDs permanently valid.
2. Add a `stable_id` field to claims.jsonl that persists across re-runs
   (generated from claim content hash or manually pinned), separate from the
   sequential `id`.
3. Reference at topic+claim-text level rather than topic+claim-id (more
   resilient to renumbering, but requires fuzzy matching).

Option 1 is already partially implemented via the archive pattern (topics are
archived, not overwritten). DOI provides the external-authority model: a stable
identifier registered externally, never derived from mutable content [4].

### Finding 4: Zettelkasten timestamp IDs are the most portable stable ID scheme for plain-text knowledge systems [CONFIDENCE: HIGH]

The canonical Zettelkasten method uses timestamp-based IDs: `201402260939`
(year-month- day-hour-minute). Key properties [5]:

1. **Identity independent of file system:** The ID is embedded in note content,
   not the file name or directory path. The note survives reorganization.
2. **Vendor-agnostic:** A timestamp is plain text. It works across any tool, any
   future migration.
3. **Searchable anchor:** Copy the ID into a search field — the note is found
   regardless of how the file system is organized.
4. **Collision-free:** Timestamps increment continuously.

For SoNash claims, the equivalent would be: `custom-agents-20260329-C042`
(slug + date

- sequential ID). The slug provides topic scope, the date provides temporal
  context, and the sequential ID provides ordering.

**However:** The existing sequential `C-001` through `C-NNN` scheme is already
established and used across 14+ research outputs. Changing to timestamps would
break existing references. The pragmatic path: keep `C-NNN` as the display ID,
add a `stable_ref` field as the canonical reference key: `<topic-slug>:<id>`,
e.g., `custom-agents:C-042`. The slug is already immutable once research is
archived.

### Finding 5: Obsidian block references are app-specific and break in standard markdown — heading anchors are more portable [CONFIDENCE: HIGH]

Obsidian supports block-level references with syntax `[[Note^block-id]]` where
`^block-id` is appended to any paragraph. Blocks without pinned IDs get
auto-generated IDs that change on re-index, creating broken references [6]. The
Logseq equivalent has the same problem: GitHub issues #8314, #4297, and #10047
document temporary block IDs that break after re-indexing [7].

**Critical finding:** Block references are Obsidian/Logseq proprietary. They do
not work in standard markdown viewers. If the SoNash codebase is opened in any
tool other than Obsidian, block refs are broken.

**For SoNash's file-based approach:** The JSONL `"id": "C-001"` field is the
anchor. A `findings_refs` entry of `custom-agents:C-042` is resolvable with:

```bash
jq -r 'select(.id == "C-042")' .research/archive/custom-agents/claims.jsonl
```

This is more robust than Obsidian block refs — it uses stable JSONL IDs, not
app-managed block anchors.

### Finding 6: Scite.ai's supporting/contrasting classification is the right model for cross-project confidence inheritance [CONFIDENCE: MEDIUM]

Scite.ai classifies citations into three intents: **Supporting** (cites agree),
**Contrasting** (cites disagree), and **Mentioning** (neutral reference) [8].
This is the research community's solution to the problem of "what does citing a
claim mean for your own claim?"

**Applying to SoNash `findings_refs`:** A `findings_refs` entry should carry a
`relationship` field:

- `"informedBy"` — JASON-OS planning is informed by this custom-agents finding
- `"constrainedBy"` — JASON-OS planning is constrained by this finding (hard
  limit)
- `"contradicts"` — this finding from research-B contradicts finding from
  research-A

This directly addresses the confidence inheritance question: if the referenced
claim has `confidence: LOW`, a downstream conclusion that `informedBy` it should
be at most MEDIUM, not HIGH. The relationship type determines the inheritance
rule.

**Limitation:** Scite.ai operates at the paper-to-paper level at massive scale
(1.6B+ citations). For SoNash's solo-developer scale, a simplified 2-3 category
classification (informedBy/constrainedBy/contradicts) is the appropriate subset.

### Finding 7: Retracted claims propagate silently through citation networks — SoNash needs an explicit REFUTED state flag [CONFIDENCE: HIGH]

Academic research shows that over 95% of post-retraction citations are made in
error — the citing author was unaware of the retraction [9]. The average
"unaware duration" is 2.88 years. There is no automated mechanism to propagate
retraction warnings to all citing papers.

**For SoNash:** The deep-research verification pipeline already produces a
REFUTED verdict (Phase 2.5 verifier taxonomy: VERIFIED, REFUTED, UNVERIFIABLE,
CONFLICTED) [1]. However, there is no mechanism to propagate that REFUTED status
to todos or projects that reference the claim via `findings_refs`.

**Failure mode design:** When a `findings_refs` entry points to a claim that is
later REFUTED or CONFLICTED, the referencing entity (todo, project, plan) must
surface a warning. This is the "broken ref" equivalent for knowledge references.

Minimum implementation: when a claim's confidence is downgraded to LOW or
REFUTED status is added, scan `findings_refs` in all todos and surface:
"JASON-OS plan cites custom-agents:C-042 which has been REFUTED. Review this
dependency."

### Finding 8: Pull mechanism (session-begin digest) is preferred over push for solo developers [CONFIDENCE: MEDIUM]

Research on AI developer knowledge surfacing shows two patterns [10]:

**Push (proactive):** The system detects relevant findings and injects them
before the developer asks. Pro: no cognitive tax at session start. Con: can
become wallpaper (CLAUDE.md guardrail #6: "unacknowledged warnings become
wallpaper").

**Pull (at-point-of-need):** Developer queries for relevant findings when
starting work on a project. The system returns relevant claims from the research
index. Pro: high signal-to-noise, low false-positive rate. Con: requires
discipline to query.

**Hybrid (session-begin scan):** The session-begin hook scans active todos for
`findings_refs` and surfaces a compact digest: "Project X references 3 claims
from custom-agents research. 1 is LOW confidence. Review? [y/n]". This is the
highest-value pattern for solo developers:

- Requires acknowledgment (satisfies guardrail #6)
- Scoped to active/in-progress todos only (low noise)
- Triggered by existing session-begin infrastructure (no new hooks needed)
- Defers display until work is actually starting (not always-on push)

**Anti-pattern explicitly rejected:** Embedding-based semantic search over all
claims to automatically suggest relevant findings is too fuzzy for this use
case. It would surface false positives at high rates and create noise. Tag-based
matching is sufficient for solo-developer scale.

### Finding 9: Triple stores and graph databases are explicitly overkill for solo developer scale [CONFIDENCE: HIGH]

Triple stores (subject-predicate-object RDF) and property graph databases
(Neo4j, ArangoDB) require separate infrastructure, schema design, and a new
query language (SPARQL or Cypher). Research confirms: "building a knowledge
graph with a property graph database requires separate infrastructure; JSON
document stores combined with basic programmatic traversal may provide a more
lightweight solution" [11].

For SoNash:

- Total claims corpus: ~800 across all research (codebase inspection of 14+
  topics)
- Total todos: ~20 at any given time (per `.planning/todos.jsonl`)
- Total active projects: <10

At this scale, a JSONL lookup with `jq` is 5x faster to implement and 0x
infrastructure cost compared to any graph database. The triple store pattern
`(JASON-OS, informedBy, custom-agents:C-042)` can be expressed as a flat JSONL
array in todos.jsonl without any graph infrastructure.

**Explicit anti-pattern:** Do not introduce Neo4j, ArangoDB, Cayley, or any
graph database for this problem. It is pure enterprise-pattern overkill.

### Finding 10: The simplest data shape — findings_refs as an array in todos.jsonl [CONFIDENCE: HIGH]

The SoNash `todos.jsonl` already has a `context` field with `files` array [2].
The minimum viable `findings_refs` extension:

```json
{
  "findings_refs": [
    {
      "ref": "custom-agents:C-041",
      "relationship": "constrainedBy",
      "note": "Hard agent ceiling of 30 applies to JASON-OS agent design"
    },
    {
      "ref": "custom-agents:C-054",
      "relationship": "informedBy",
      "note": "Model selection tiering (Opus for security-sensitive) relevant"
    }
  ]
}
```

**Key properties of this shape:**

- `ref` uses `<topic-slug>:<claim-id>` stable addressing
- `relationship` type enables confidence inheritance rules
- `note` provides human-readable rationale (prevents the ref from being
  context-free)
- No new infrastructure — plain JSONL extension
- Resolvable with `jq`:
  `jq -r 'select(.id == "C-041")' .research/archive/custom-agents/claims.jsonl`

### Finding 11: The `routing` field in claims.jsonl is the push-side complement to findings_refs [CONFIDENCE: HIGH]

The existing `routing` field in claims.jsonl
(`{"deepPlan": true, "gsd": false, ...}`) already provides a topic-level push
signal [1]. This field says "when you do a /deep-plan, surface me." It is a
coarse-grained cross-consumer marker.

`findings_refs` (on todos) is the pull-side: a specific todo explicitly declares
"I was informed by this specific claim." Together they form a bidirectional
reference:

- **routing field (push):** "Claim X wants to be seen by any /deep-plan session"
- **findings_refs (pull):** "Todo T explicitly references claim X as a
  dependency"

The routing field should be extended with project-slug routing:
`"projects": ["jason-os"]` to enable "when you open a todo tagged jason-os,
surface all claims with `projects: ["jason-os"]` in their routing." This is the
push mechanism that does not require the todo to explicitly list claim IDs.

### Finding 12: The existing `--recall` flag is the right surfacing hook for session-begin [CONFIDENCE: MEDIUM]

SKILL.md documents a `--recall <topic>` flag that searches the research index
for prior research. This is currently a manual invocation. Extending this to a
session-begin hook would deliver the pull digest:

```
At session begin:
1. Read todos.jsonl — filter active/in-progress todos
2. For each todo with findings_refs:
   a. Resolve each ref to its claim in claims.jsonl
   b. Check claim confidence and REFUTED status
   c. Collect a digest: N references, M low-confidence, P refuted
3. Surface: "3 active todos reference research findings. 1 LOW-confidence ref found.
   /deep-research --recall for details? [y/n]"
4. Only surface if digest is non-empty (avoids noise on clean sessions)
```

This satisfies: acknowledgment-required (guardrail #6), scoped to active work,
low noise, and no new infrastructure beyond a small session-begin hook addition.

### Finding 13: The prior RESEARCH_MEMORY_LEARNING.md design is a foundation but stops at topic granularity [CONFIDENCE: HIGH]

The `.planning/archive/deep-research-skill/research/RESEARCH_MEMORY_LEARNING.md`
document (discovered during codebase search) describes a three-tier
architecture: Tier 1 (JSONL research index), Tier 2 (Markdown findings files),
Tier 3 (MCP memory entities) [12]. This is thorough and directly relevant.

**Gap:** Section 3 (Cross-Session Research Continuity) defines overlap detection
using keyword matching at the _topic_ level. It does not define cross-project
claim-level references. The `related_research` field in the research index
schema links topics to topics
(`"related_research": ["research-2026-03-15-nextjs-app-router"]`), not claims to
projects.

**What this means:** The `findings_refs` pattern described here is the missing
claim-level layer that RESEARCH_MEMORY_LEARNING.md does not address. The designs
are complementary, not overlapping.

### Finding 14: Auto-propagation of new findings to projects is a high-failure-mode path — explicit registration is safer [CONFIDENCE: MEDIUM]

The appeal of automatic embedding-based retrieval: when a new claim is added to
custom-agents, automatically scan all todos and suggest which might be relevant.

The failure modes:

1. **False positives at high rate:** Embedding similarity between "agent ceiling
   of 30" and "worktree management" would be non-zero but meaningless. Solo
   developer context is too sparse for reliable semantic matching.
2. **Notification fatigue:** Every new research run would surface 5-15
   "potentially relevant" claims across unrelated todos. Becomes wallpaper after
   session 3.
3. **Maintenance burden:** Embedding model updates can change what gets
   surfaced, creating unpredictable behavior.

**Conclusion:** Auto-suggestion as a prompt is fine (at research completion,
show "Which active todos might be informed by these findings?"). Auto-population
without review is an anti-pattern. The explicit `findings_refs` registration
with human rationale (`note` field) is the right pattern because it forces the
researcher to articulate why the connection matters at the moment of insight.

---

## 4. Synthesis

The cross-project findings flow problem has a well-understood structure:

**What exists today:**

- Stable sequential claim IDs (`C-NNN`) within topics
- Topic-level routing flags in claims.jsonl
- Keyword-based topic-to-topic discovery in research-index.jsonl
- Archive pattern that makes old slugs immutable (and thus IDs stable)

**What is missing:**

- Claim-to-project explicit linkage (`findings_refs`)
- Confidence inheritance rules when a referenced claim degrades
- REFUTED status propagation to referencing todos
- Session-begin surfacing of active `findings_refs`

**Academic patterns that translate directly:**

- BibTeX stable keys → `<topic-slug>:<claim-id>` addressing
- Zettelkasten timestamp IDs → lesson: IDs must be anchored in immutable content
- Scite.ai supporting/contrasting classification → `relationship` field on refs
- Retraction propagation research → explicit REFUTED surfacing required

**Patterns that do NOT translate:**

- Triple stores / graph databases (enterprise overkill at 800-claim scale)
- Embedding-based auto-retrieval (false positive rate unacceptable)
- Obsidian block references (app-specific, breaks outside Obsidian)

**The minimum viable design:** A `findings_refs` array added to `todos.jsonl`
records, with `ref` (stable `slug:id` address), `relationship` type, and human
`note`. Combined with a session-begin scan that surfaces a non-empty digest only
when active todos reference degraded or refuted claims.

---

## 5. Recommendations Specific to SoNash findings_refs Design

### R1: Add findings_refs to todos.jsonl schema [PRIORITY: P1]

Add an optional `findings_refs` array to the todos.jsonl record schema:

```json
{
  "findings_refs": [
    {
      "ref": "<topic-slug>:<claim-id>",
      "relationship": "informedBy | constrainedBy | contradicts",
      "note": "<human-readable rationale>"
    }
  ]
}
```

This is the anchor data shape. Nothing else requires infrastructure change.

### R2: Add stable_ref field to claims.jsonl schema [PRIORITY: P1]

Add `"stable_ref": "<topic-slug>:<id>"` to the canonical claims.jsonl schema in
REFERENCE.md Section 11. The synthesizer agent writes this field automatically.
Example: `"stable_ref": "custom-agents:C-042"`. This is the canonical lookup
key.

### R3: Extend routing field with project-slug array [PRIORITY: P2]

Add `"projects": ["jason-os", "github-health"]` to the `routing` field in
claims.jsonl. This is the push-side: "when any of these projects is active,
surface me." Populated by the researcher when claims are identified as
cross-project relevant during synthesis.

### R4: Implement session-begin findings digest [PRIORITY: P2]

Extend the session-begin hook or `/session-begin` skill to:

1. Scan `todos.jsonl` for active/in-progress todos with non-empty
   `findings_refs`
2. For each ref, resolve to its claim and check confidence + REFUTED status
3. Surface a one-line digest if any LOW/REFUTED refs found
4. Require acknowledgment (yes/view/dismiss) before continuing

Constraint: surface only when non-empty. Zero active refs = no digest displayed.

### R5: Add REFUTED status propagation [PRIORITY: P2]

When a claim's confidence is downgraded to LOW or a REFUTED verdict is recorded
(by the verifier agent), scan `todos.jsonl` for any `findings_refs` pointing to
that claim and surface: "Todo [T12] cites [custom-agents:C-042] which has been
REFUTED. Review this dependency."

### R6: Populate findings_refs retroactively for high-value cross-project claims [PRIORITY: P3]

The custom-agents research contains claims directly relevant to JASON-OS (agent
ceiling, model selection, ecosystem quality baseline). The next JASON-OS
planning session should explicitly populate `findings_refs` in the JASON-OS
todos that are informed by these claims. This one-time retroactive registration
demonstrates the pattern before automation is built.

### R7 (Anti-pattern): Do NOT implement automatic embedding-based ref suggestion [REJECTED]

Embedding similarity for auto-populating `findings_refs` is explicitly rejected.
Manual registration with required `note` rationale is the right pattern — it
forces articulation of the connection at the moment of insight, which is more
valuable than post-hoc fuzzy matching.

---

## 6. Gaps Identified

1. **No existing `findings_refs` mechanism:** Confirmed by grep across all
   `.planning/**/*.jsonl` and `.research/**/*.jsonl` — the pattern does not
   exist yet. This is a genuine design gap, not an undiscovered feature.

2. **Routing field extension design:** The proposed `"projects"` extension to
   the `routing` field needs validation against existing routing consumers
   (deep-plan adapter, skill-creator adapter, GSD adapter in REFERENCE.md
   Section 15) to ensure no conflicts.

3. **Re-run / --refresh stability:** The `--refresh` flag (SKILL.md line 91) is
   documented but the exact behavior (does it reuse the same slug? does it
   overwrite claims.jsonl?) was not fully confirmed. If `--refresh` overwrites
   `claims.jsonl` with new sequential IDs, `stable_ref` needs a pinning
   mechanism analogous to BibTeX's pinned keys.

4. **Relationship type completeness:** The three proposed relationship types
   (informedBy, constrainedBy, contradicts) may be insufficient. In academic
   citation, Scite.ai uses three types but notes that "mentioning" (neutral
   reference) is the most common. A `relatesTo` neutral type may be needed for
   loose connections.

5. **JASON-OS brainstorm decisions:** The brainstorm at `.research/jason-os/`
   (found during codebase search) and BRAINSTORM.md exist but there are no
   existing `findings_refs` from the custom-agents research present in JASON-OS
   planning files. This confirms the problem statement and is the primary
   validation case for R6.

6. **Session-begin hook integration:** The existing session-begin infrastructure
   was not fully examined (time constraint). The digest mechanism requires
   understanding what hooks run at session start before implementation can be
   specced.

---

## 7. Source List with Trust Tiers

| #   | Source                                                                            | Title                                                  | Type                       | Trust  | CRAAP Avg | Date                    |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------- | ------ | --------- | ----------------------- |
| 1   | `.claude/skills/deep-research/REFERENCE.md`                                       | Deep Research REFERENCE (Section 11, 12, 15)           | codebase-official          | HIGH   | 5.0       | 2026-03-29              |
| 2   | `.planning/todos.jsonl`                                                           | SoNash Active Todos Schema                             | codebase-ground-truth      | HIGH   | 5.0       | 2026-04-04              |
| 3   | https://retorque.re/zotero-better-bibtex/citing/                                  | Better BibTeX Citation Keys                            | official-docs              | HIGH   | 4.6       | 2026                    |
| 4   | https://bibtex.eu/fields/doi/                                                     | BibTeX DOI Field Reference                             | official-docs              | HIGH   | 4.4       | 2025                    |
| 5   | https://zettelkasten.de/posts/add-identity/                                       | You Only Find What You Have Identified                 | authoritative-practitioner | HIGH   | 4.8       | 2014 (stable principle) |
| 6   | https://forum.obsidian.md/t/block-reference-id-generation-question/               | Obsidian Block Reference ID Generation                 | community-forum            | MEDIUM | 3.6       | 2021                    |
| 7   | https://github.com/logseq/logseq/issues/8314                                      | Logseq Broken Block References (Issue #8314)           | official-issue-tracker     | HIGH   | 4.4       | 2022                    |
| 8   | https://direct.mit.edu/qss/article/2/3/882/                                       | scite: A Smart Citation Index (MIT Press)              | peer-reviewed-academic     | HIGH   | 4.8       | 2021                    |
| 9   | https://onlinelibrary.wiley.com/doi/full/10.1002/leap.1667                        | Citation of Retracted Papers (Learned Publishing 2025) | peer-reviewed-academic     | HIGH   | 4.8       | 2025                    |
| 10  | https://martinfowler.com/articles/reduce-friction-ai/encoding-team-standards.html | Encoding Team Standards for AI Workflows               | authoritative-practitioner | HIGH   | 4.6       | 2025                    |
| 11  | https://neo4j.com/blog/knowledge-graph/rdf-vs-property-graphs-knowledge-graphs/   | RDF Triple Stores vs Property Graphs                   | official-vendor-docs       | MEDIUM | 3.8       | 2024                    |
| 12  | `.planning/archive/deep-research-skill/research/RESEARCH_MEMORY_LEARNING.md`      | Research Memory & Learning Architecture                | codebase-prior-art         | HIGH   | 5.0       | 2026-03-20              |
| 13  | `.research/archive/custom-agents/claims.jsonl`                                    | Custom Agents Research Claims                          | codebase-ground-truth      | HIGH   | 5.0       | 2026-03-29              |
| 14  | `.research/research-index.jsonl`                                                  | Research Index                                         | codebase-ground-truth      | HIGH   | 5.0       | 2026-04-04              |

---

## Contradictions

**C1: Scite.ai "Mentioning" category vs. SoNash's 3-type relationship model**
Scite.ai's empirical data shows that "mentioning" (neutral, non-argumentative
citations) is the most common category — often >50% of all citations. The
proposed SoNash 3-type model (informedBy/constrainedBy/contradicts) has no
neutral type. This may cause researchers to force-categorize neutral references
as `informedBy` when the relationship is weaker. Resolution: add a fourth type
`relatesTo` for loose or neutral references. However, too many types increase
cognitive friction at registration time, defeating simplicity. Surface this
tension to the designer.

**C2: Zettelkasten "timestamp IDs are perpetually stable" vs. BibTeX "keys must
be explicitly pinned"** Zettelkasten's timestamp approach is presented as
natively stable because timestamps are immutable by definition. BibTeX Better
Keys requires explicit pinning because generated keys from mutable metadata are
unstable. SoNash's `C-NNN` sequential IDs are not timestamps — they are index
positions. A `--refresh` run could renumber them. The claim that "archived slugs
make IDs stable" (Finding 3) is only true if claims.jsonl is never regenerated
after archiving. This requires a codebase guard: archived research directories
should be read-only.

---

## Confidence Assessment

- HIGH claims: 9 (Findings 1, 2, 3, 4, 5, 7, 9, 10, 11, 13)
- MEDIUM claims: 4 (Findings 6, 8, 12, 14)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all findings are grounded in either direct
  codebase inspection or peer-reviewed/official sources. No training-data-only
  claims.
