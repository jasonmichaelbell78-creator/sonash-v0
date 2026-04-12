## Summary

Consolidates 13 commits across Sessions #271–#274 implementing the T29 Synthesis
Consolidation initiative (Waves 1–4), landing `/synthesize` as a unified
cross-source synthesis skill, fixing a major schema mislabel bug in
`migrate-v3.js`, and producing the first two full Standard-depth repo analyses
(firecrawl + MinerU) as part of the Wave 4 Step 10 upgrade batch.

The branch also ships two important discipline resets:

- **`.claude/skills/repo-analysis/SKILL.md` default changed**: `--depth=quick` →
  `--depth=standard`. Quick Scan is now opt-in for triage only.
- **`CLAUDE.md` guardrail #16 added**: never defer or skip skill steps without
  explicit user approval. This is the codification of a repeated anti-pattern
  where skill runs silently deferred coverage items and interactive steps.

## Scope

| Session | Focus                                                                            | Commits |
| ------- | -------------------------------------------------------------------------------- | ------- |
| #271    | T29 Wave 1-2: schema + /synthesize skill creation                                | 4       |
| #272    | T29 Wave 3 Steps 7-8: reference updates + debt cleanup + Wave 4 scope correction | 1       |
| #273    | T29 Wave 4 Steps 8.5, 9, 10 #1 (firecrawl Standard) + security propagation fix   | 4       |
| #274    | T29 Wave 4 Step 10 #2 (MinerU Standard) + skill compliance reset                 | 2       |
| chore   | Metrics / session-end follow-ups                                                 | 2       |

**Wave 4 Step 10 progress: 2 of 12 TRUE quick-scan repos upgraded to Standard.**
Remaining 10: crawl4ai, marker, surya, reader, tesseract, ArchiveBox, outline,
qmd, nitter, lux-video-downloader.

## Commits (oldest to newest)

1. `3ff5c0b6` — chore: session #271 pre-flight cleanup + DEBT-45646
2. `f77ed4a0` — **feat(T29): Wave 1** — `synthesisRecord` Zod schema +
   source_tier migration (14 sub-schemas, 6 new enums, 34 analysis records
   migrated to v3.0)
3. `52e81a6a` — **feat(T29): Wave 2** — `/synthesize` SKILL.md + REFERENCE.md
   created (~290 + ~530 lines, 7 critical rules, 6-option state-aware menu, 8
   output sections, 10-dim self-audit)
4. `20516d40` — **feat(T29): Wave 3 partial** — deprecate `/repo-synthesis` +
   `/website-synthesis` (redirect stubs, REFERENCE.md files deleted)
5. `ba42c415` — docs: session #271 end marker
6. `2e641b96` — chore: session #271 metrics + state follow-up
7. `2717178b` — **feat(T29): Session #272** — Wave 3 Steps 7-8 + debt cleanup +
   Wave 4 scope correction (CONVENTIONS.md §17 Synthesis Output Contract added,
   12 TRUE quick-scan scope discovered)
8. `aa4b5fe7` — **fix(T29): Wave 4 Step 8.5** — depth mislabel fix + candidate
   backfill + `migrate-schemas.js` root cause patched (9 mislabeled repos
   repaired, migrate-v3.js self-heal rule added)
9. `ba78dfa2` — **fix: security propagation** — `validatePathInDir` +
   `refuseSymlinkWithParents` propagated to `self-audit.js`
10. `3de8e17e` — docs(T29): Wave 4 Step 9 — `_quick-scan-upgrade.md` v3.0
    revised to 12-repo scope
11. `5a0b6b0d` — **feat(T29): Wave 4 Step 10 #1 firecrawl Standard** + PLAN.md
    Step 10.5 (full-corpus audit gate) + T33 (PreToolUse node PATH bug) + state
    drift
12. `34e647fd` — **feat(T29): Session #274 Wave 4 Step 10 #2 MinerU Standard +
    skill compliance reset** (main Session #274 commit)
13. `037664ba` — chore: session #274 state drift (post-commit hook updates)

## Key architectural changes

### /synthesize skill (Waves 1-3)

**New files:**

- `.claude/skills/synthesize/SKILL.md` (287 lines)
- `.claude/skills/synthesize/REFERENCE.md` (552 lines, 12 sections)

**Deleted (deprecation):**

- `.claude/skills/repo-synthesis/REFERENCE.md`
- `.claude/skills/website-synthesis/REFERENCE.md`
- `.claude/skills/schemas/synthesis-schema.ts` (replaced by extended
  `analysis-schema.js`)

**Redirect stubs left:** `.claude/skills/repo-synthesis/SKILL.md` and
`.claude/skills/website-synthesis/SKILL.md` now point to `/synthesize`.

**Schema extension:** `scripts/lib/analysis-schema.js` extended with
`synthesisRecord` Zod schema (14 sub-schemas) and 6 new enums (`sourceTierEnum`,
`paradigmEnum`, `synthesisModeEnum`, `convergenceEnum`, `opportunityRouteEnum`,
`chainTierEnum`). `validate()` extended for `type=synthesis`.

**Migration completed:** `scripts/cas/migrate-v3.js` fills `source_tier`
defaults (T1 for repos, T2 for other sources). All 34 pre-existing analysis
records migrated cleanly.

**Conventions updated:** CONVENTIONS.md §17 (Synthesis Output Contract) added.
Family list and line 115 updated.

### Wave 4 depth mislabel fix (Step 8.5)

**Problem discovered in Session #272 pre-flight audit:**
`scripts/cas/migrate-v3.js` (Session #270 v3.0 migration) was stamping
`depth: quick` on repos that actually had full Standard artifact sets. This
inflated the Wave 4 Step 10 scope from a real 12 repos to an apparent 22.

**Fix in `aa4b5fe7`:**

- New script: `scripts/cas/fix-depth-mislabel.js` (182 lines) — detects repos
  with Standard artifacts but `depth: quick` in analysis.json and repairs both
  `analysis.json` and `research-index.jsonl` entries
- New script: `scripts/cas/backfill-candidates.js` (235 lines) — backfills
  missing extraction candidates from Standard artifact analysis
- Root cause patch: `scripts/cas/migrate-schemas.js` corrected to not overwrite
  depth; `migrate-v3.js` given a self-heal rule
- **9 repos repaired**: aws-media-extraction,
  bedrock-summarize-audio-video-text, bulk-transcribe-youtube-playlist,
  codecrafters-io-build-your-own-x, hkuds-cli-anything, karpathy-autoresearch,
  public-apis_public-apis, teng-lin_notebooklm-py, viktoraxelsen-memskill,
  youtube-transcript-api

### Security fix: path traversal propagation (`ba78dfa2`)

`validatePathInDir` and `refuseSymlinkWithParents` propagated from the main
security-helpers library to `scripts/cas/self-audit.js`. Closes a propagation
miss that was flagged by the hook system.

### MinerU Standard analysis (Wave 4 Step 10 #2)

**Artifacts produced (all new):**

- `analysis.json` — v3.0 schema, Healthy/Healthy/active-sprint, 7 candidates
- `creator-view.md` — 6 sections + Coverage Audit Expansion appendix (~38 KB)
- `summary.md` — Engineer view + 8-dim scoring bands
- `value-map.json` — 6 pattern + 9 knowledge + 3 content + 9 anti-pattern (22
  total)
- `findings.jsonl` — 88 entries
- `findings-{architecture,security,documentation,tests}.jsonl` — 4 dimension
  files
- `deep-read.md` — internal artifact catalog
- `content-eval.jsonl` — 13 items
- `coverage-audit.jsonl` — 17 items (0 deferred after Session #274 expansion)

**Critical first-pass correction (Session #274):**

- **`opendatalab/mineru-mcp` does NOT exist** (GitHub returns 404). First-pass
  Creator View treated it as a viable T2 knowledge candidate. Demoted to
  anti-mineru-007 (README integration claim unbacked by first-party code).

**Progressive extraction recommendation rewritten:**

- Original: adopt MinerU POST /tasks state machine.
- Corrected: **crawl4ai is the actually-adoptable reference** (Apache-2.0,
  persistent `resume_state` + `on_state_change` callbacks that survive
  restarts). MinerU pattern is shape-reference only — in-memory state, AGPL
  license.

### firecrawl Standard analysis (Wave 4 Step 10 #1)

**Artifacts produced (all new):**

- Full Standard artifact set in `.research/analysis/firecrawl/`
- 4 dimension files (architecture, documentation, security, tests)
- `creator-view.md` + `summary.md` + `value-map.json` + `content-eval.jsonl` +
  `coverage-audit.jsonl`

Note: Session #273 executed this analysis manually (anti-pattern) instead of via
the Skill tool. Caught mid-execution and documented in memory. Session #274 hit
the same class of error on MinerU — both corrections are codified as CLAUDE.md
guardrail #16.

## Discipline changes

### SKILL.md default change: quick → standard

**File:** `.claude/skills/repo-analysis/SKILL.md` **Change:** Critical Rule #1,
Flags table (line ~66), Phase 0 heading (line ~103) **Rationale:** Quick Scan as
default created a preview-then-gate flow that was repeatedly skipped
unilaterally. Standard as default eliminates the "did the user want Standard or
not" ambiguity. Quick is now opt-in via `--depth=quick` for triage scenarios
only.

### CLAUDE.md guardrail #16

**New rule added to Section 4 Behavioral Guardrails:**

> **Follow skills to the letter — never defer or skip without explicit
> approval.** When executing any skill (repo-analysis, analyze, deep-plan,
> synthesize, etc.), every phase, MUST/SHOULD step, interactive gate, coverage
> item, and candidate must be completed in full. If a step seems tangential,
> inefficient, or already-done, do NOT unilaterally skip. Present the concern to
> the user. Wait for answer. Interactive steps (tag suggestion, retro, routing
> menu) are NOT optional even in batch mode. Coverage audit items marked skipped
> or deferred require explicit user decision. Candidates marked blocked on
> decision must be surfaced in conversation immediately, not buried in JSONL
> fields. Completion summaries may only claim completion for items actually
> completed.

This codifies a pattern that caused real friction across Sessions #273 and #274.

## Files changed (summary)

| Category  | Count   |
| --------- | ------- |
| Added     | 28      |
| Deleted   | 8       |
| Modified  | 97      |
| **Total** | **133** |

**Line delta:** +21,054 / -20,092 (net +962 lines, dominated by raw TDMS data
rewrites in `docs/technical-debt/raw/*.jsonl`)

### Signal files (by area)

**Skills:**

- `.claude/skills/synthesize/{SKILL,REFERENCE}.md` — NEW
- `.claude/skills/repo-analysis/SKILL.md` — default + Phase 0 heading
- `.claude/skills/analyze/{SKILL,REFERENCE}.md` — synthesis integration
- `.claude/skills/{repo,website}-synthesis/SKILL.md` — redirect stubs
- `.claude/skills/document-analysis/SKILL.md` + `media-analysis/SKILL.md` — gate
  messaging updates
- `.claude/skills/shared/CONVENTIONS.md` — §17 Synthesis Output Contract
- `.claude/skills/schemas/validate-artifact.ts` — synthesis branch removed

**Scripts:**

- `scripts/lib/analysis-schema.js` — +199 lines (synthesisRecord)
- `scripts/cas/migrate-v3.js` — self-heal rule
- `scripts/cas/migrate-schemas.js` — root-cause fix
- `scripts/cas/backfill-candidates.js` — NEW (235 lines)
- `scripts/cas/fix-depth-mislabel.js` — NEW (182 lines)
- `scripts/cas/promote-firecrawl-to-journal.js` — NEW (164 lines)
- `scripts/cas/self-audit.js` — security propagation + schema checks
- `scripts/check-review-archive.js` — accepts string review IDs
- `scripts/archive-doc.js` — binary-file extension allowlist

**Research/analysis:**

- `.research/analysis/MinerU/*` — 13 new artifacts
- `.research/analysis/firecrawl/*` — 9 new artifacts
- `.research/analysis/_quick-scan-upgrade.md` — NEW (12-repo scope checklist)
- `.research/EXTRACTIONS.md` + `extraction-journal.jsonl` — 196→236 candidates
  across 23→25 sources

**Planning / docs:**

- `.planning/synthesis-consolidation/PLAN.md` — updated
- `CLAUDE.md` — guardrail #16
- `SESSION_CONTEXT.md` — Sessions #272/#273/#274 added
- `docs/SESSION_HISTORY.md` — #270 archived

**Technical debt:**

- `docs/technical-debt/raw/*.jsonl` — large rewrites from consolidation runs
  across sessions
- `docs/technical-debt/METRICS.md` + `metrics.json` — up-to-date as of
  2026-04-10

## Corrections landing in this PR

1. **`migrate-v3.js` depth mislabel** — 9 repos had `depth: quick` stamped on
   Standard artifact sets. Fixed + root-cause patched (commit `aa4b5fe7`).
2. **`opendatalab/mineru-mcp` does not exist** — first-pass Creator View treated
   it as a reference; corrected to anti-mineru-007. (commit `34e647fd`)
3. **Progressive extraction recommendation rewritten** — crawl4ai is the
   actually-adoptable reference, not MinerU. (commit `34e647fd`)
4. **`/repo-analysis` default** — quick→standard, the preview-then-gate flow was
   repeatedly bypassed. (commit `34e647fd`)
5. **Security propagation miss** — `validatePathInDir` +
   `refuseSymlinkWithParents` not propagated to `self-audit.js`. Fixed. (commit
   `ba78dfa2`)

## Known issues / follow-ups

The following items are **surfaced but not fixed** in this PR:

1. **T33 — PreToolUse hook node command not found** on every Write/Edit.
   Non-blocking stderr noise. Needs fnm/nvm PATH fix. Filed in SESSION_CONTEXT
   Next Goals.
2. **DEBT-45635 — `scripts/check-cc.js` exit 2** still blocks clean pushes
   without `SKIP_CC=1`. Session-end commits required workaround.
3. **Pre-push hook incompatibility with `sh -e`** — husky invokes pre-push with
   `set -e`, but the pre-push script has node command substitutions that exit 1
   by design (status codes). The `-e` flag kills the script before skip logic
   can run. Session #274 session-end used `--no-verify` (user-authorized) to
   bypass. Worth filing as a hook bug in a follow-up session.
4. **GitHub Dependabot 7 vulnerabilities** (1 high, 6 moderate) reported on
   push. Separate investigation needed.
5. **Ecosystem health at D/62** (down from 65, stable trend). 9 sub-categories
   below threshold: debt-aging (F/25), debt-velocity (F/20), test-pass-rate
   (F/25), learning-effectiveness (F/0), pattern-enforcement (F/43), and 4 more
   in D range.
6. **T29 Wave 4 Step 10** — 10 repos remaining (crawl4ai, marker, surya, reader,
   tesseract, ArchiveBox, outline, qmd, nitter, lux-video-downloader). Blocks
   Wave 5 (E2E testing of `/synthesize`).
7. **T29 Wave 5** — `/synthesize` E2E + 10-dim self-audit + code-reviewer pass.
   Gated on Wave 4 completion.
8. **`/recall` never tested with live data** — SQLite FTS5 query interface.
9. **T31 — hook state file tracking redesign** — cross-locale sync destroys
   Category B learning data daily.

## Test plan

- [ ] `npm run patterns:check` passes
- [ ] `node scripts/cas/self-audit.js --slug=MinerU` returns PASS
- [ ] `node scripts/cas/self-audit.js --slug=firecrawl` returns PASS
- [ ] `.research/extraction-journal.jsonl` validates — 19 MinerU entries +
      firecrawl entries present
- [ ] `.research/EXTRACTIONS.md` matches journal — 236 candidates across 25
      sources
- [ ] `analysis-schema.js` Zod validation passes for all records with
      `type=synthesis`
- [ ] `.claude/skills/repo-analysis/SKILL.md` Critical Rule #1 reads "Standard
      is the default"
- [ ] `CLAUDE.md` guardrail #16 present in Section 4
- [ ] `.claude/skills/repo-synthesis/SKILL.md` +
      `.claude/skills/website-synthesis/SKILL.md` are redirect stubs
- [ ] `.claude/skills/synthesize/{SKILL,REFERENCE}.md` exist and reference
      CONVENTIONS §17
- [ ] `scripts/cas/self-audit.js` imports `validatePathInDir` +
      `refuseSymlinkWithParents`
- [ ] `git log` shows all 13 commits on `planning-4826` vs `main`
- [ ] `npm test` passes (3564 tests baseline)
- [ ] Code-reviewer agent not yet invoked on script changes
      (`scripts/cas/backfill-candidates.js`, `fix-depth-mislabel.js`,
      `promote-firecrawl-to-journal.js`, `migrate-schemas.js`, `migrate-v3.js`)
      — needs review before merge

## Related

- **T28 CAS** — Content Analysis System (E2E complete in Session #270, prior to
  this branch)
- **T29 Synthesis Consolidation** — This PR delivers Waves 1-4 (partial Wave 4
  Step 10)
- **T30 Todo JSONL data loss** — Filed Session #270, separate work
- **T31 Hook state file tracking** — Filed Session #272, separate work
- **T33 PreToolUse node PATH** — Filed Session #273, separate work

## Notes for reviewer

- **Large diff size is mostly data file regeneration** —
  `docs/technical-debt/raw/{audits,deduped,normalized-all}.jsonl` account for
  the bulk of the line count. The actual code/doc changes are in the ~3,000 line
  range.
- **Research artifacts** (`.research/analysis/{firecrawl,MinerU}/*`) are
  append-only knowledge capture, not executable code. Review for accuracy of
  claims vs creator-view prose, not for correctness.
- **Script changes** under `scripts/cas/` are new and would benefit from a
  `code-reviewer` agent pass before merge (flagged as a known issue above).
- **Creator view files are opinionated prose** — review should check that cited
  file paths, line hints, and cross-repo comparisons are accurate rather than
  imposing a style preference.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
