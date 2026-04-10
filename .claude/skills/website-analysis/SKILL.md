---
name: website-analysis
description: >-
  Creator-first website analysis skill. Dual-lens (Creator View + Engineer View)
  three-tier (Quick/Standard/Deep) analysis of arbitrary websites with
  superpowers-chrome extraction, compliance gates, and multi-mode operation
  (Page/Site/Expedition/Cross-site).
---

<!-- prettier-ignore-start -->
**Document Version:** 1.1
**Last Updated:** 2026-04-06
**Status:** ACTIVE
<!-- prettier-ignore-end -->

**Shared conventions:** See `.claude/skills/shared/CONVENTIONS.md`

# Website Analysis

Creator-first analysis of websites as knowledge artifacts. Mirrors
`/repo-analysis` architecture but designed for web content — what a site KNOWS,
ARGUES, and LINKS TO.

**Effort:** Quick Scan ~30 seconds. Standard 2-4 minutes. Deep 5-10 minutes.
Expedition: open-ended (HITL pacing).

## Critical Rules (MUST follow)

1. **Compliance check before ANY extraction.** Pre-flight runs first. HARD_BLOCK
   stops the skill with a minimal analysis.json explaining why.
2. **superpowers-chrome is primary extractor.** If unavailable, fall back to
   WebFetch + Playwright MCP + curl. Log a warning.
3. **Write-to-disk-first.** Every phase writes output before proceeding. Do not
   hold results in memory across phases.
4. **State file on every phase transition.** Update
   `.claude/state/website-analysis.<site-slug>.state.json` after each phase.
5. **Creator View is mandatory** for Standard/Deep. Written as conversational
   prose, NOT tables or clinical output.
6. **No silent skips.** If a SHOULD step fails, retry once, then report to user.
7. **Bands over numbers.** Display categorical bands with scores in parentheses.
8. **Home context MUST be loaded** for Creator View — SESSION_CONTEXT.md,
   ROADMAP.md, CLAUDE.md, `.claude/skills/` listing, MEMORY.md user entries.

## When to Use

- User provides a URL and wants to understand what the site knows
- User invokes `/website-analysis` explicitly
- Domain/technology scouting (JASON-OS Domain 02a)
- Evaluating a website as a knowledge source for ongoing work
- Comparing a site's perspective to our documented approach

## When NOT to Use

- Testing OUR webapp — use `/webapp-testing` instead
- Library/package documentation lookup — use `context7` MCP
- Simple URL fetch for content — use WebFetch directly
- Analyzing a GitHub repo — use `/repo-analysis`
- Cross-site synthesis — use `/website-synthesis` (requires 3+ analyzed sites)
- Researching a topic across sources — use `/deep-research` (query-centric)

## Input

```
/website-analysis <URL>                        # Page mode, Quick Scan default
/website-analysis <URL> --depth=standard       # Standard depth
/website-analysis <URL> --depth=deep           # Deep depth
/website-analysis <URL> --depth=quick          # Explicit Quick Scan
/website-analysis --urls=URL1,URL2,...          # Site mode, explicit pages
/website-analysis <URL> --site                 # Site mode, auto-discovery
/website-analysis <URL> --expedition           # Expedition mode (HITL multi-hop)
```

Re-invoking with the same URL auto-resumes from last completed phase.

**Output location:** `.research/analysis/<site-slug>/` **Produces:**
analysis.json, findings.jsonl, value-map.json, creator-view.md, summary.md,
deep-read.md (if multi-page), content-eval.jsonl, coverage-audit.jsonl,
extraction-journal.jsonl entries. Handler-specific: meta.json. Full schemas in
REFERENCE.md Section 1.

---

## Process Overview

```
VALIDATE   → URL valid? Prior analysis? Tool check (superpowers-chrome?)
PREFLIGHT  → Compliance (robots.txt, cf-mitigated, RSS, HARD_BLOCK/WARN/PROCEED)
PHASE 0    → Quick Scan (navigate + eval + screenshot analysis)
GATE       → Interactive (Run Standard/Deep? [y/N]) — flags bypass gate
PHASE 1    → Content extraction (WebFetch processed content)
PHASE 1b   → Multi-page (replaces Phase 1 in Site/Expedition mode)
PHASE 2    → Creator View (7 sections, home context, 13 value axes)
PHASE 3    → Engineer View (6 dimensions, 4-band scoring)
PHASE 4    → Value Map (knowledge candidates ranked)
SELF-AUDIT → Verify artifacts, schema, completeness (9 dimensions)
ROUTING    → Menu (7 options)
```

**VALIDATE checks (MUST):** URL is well-formed HTTP/HTTPS, not localhost. If
prior analysis exists in output directory, offer: (a) re-analyze with
trends.jsonl comparison, (b) resume, (c) view previous. Authenticated sites: set
superpowers-chrome profile first via `use_browser set_profile`.

**Prior feedback replay (SHOULD):** If a prior state file exists with
`process_feedback`, present: "Last run feedback: {response}" before proceeding.

Use phase transition markers: `========== PHASE N: [NAME] ==========`

---

## Extraction Pipeline

**Primary (superpowers-chrome available):**

```
Step 1: use_browser navigate URL        → HTML + MD + PNG + console (auto)
Step 2: use_browser eval (metadata JS)  → title, meta, OG, JSON-LD, counts
Step 3: WebFetch URL with prompt        → processed content    [Standard/Deep]
Step 4: curl -sI URL                    → HTTP headers          [Deep only]
```

**Fallback (superpowers-chrome unavailable):**

```
Step 1: WebFetch URL                    → processed content
Step 2: Playwright navigate + run_code  → metadata + counts + screenshot
Step 3: curl -sI URL                    → HTTP headers          [Deep only]
```

---

## Modes

### Page Mode (default)

Single URL analysis. All three tiers available.

### Site Mode

Multi-page analysis of one domain. Two input methods:

- **Explicit:** `--urls=URL1,URL2,...` — analyze each URL
- **Auto-discovery:** `--site` — start from root URL, follow top-scored internal
  links

With `--urls`, each URL runs the full pipeline without per-URL gates.
Auto-discovery mode uses the 5-page approval gate below.

**Page gate (MUST):** No hard cap. Pause for approval every 5 pages showing
progress: themes found, links scored, knowledge candidates. User decides to
continue or wrap up. At page 20+, include advisory: "Extensive coverage
reached."

> See REFERENCE.md Section 11 for full Site mode spec.

### Expedition Mode

Multi-hop HITL navigation across domains. Present 5 link options per hop (4
high-relevance + 1 wildcard). Controls: stop, back, view tree.

- Depth limit: 3 hops (default, configurable)
- State: 3-file pattern (meta.json, snap.json, .jsonl append-only)
- Resume: detect prior expedition files, reconstruct tree, offer resume

> See REFERENCE.md Section 10 for full Expedition spec.

### Cross-site (routing only)

When routing menu is shown and 3+ sites exist, offer cross-site synthesis via
`/website-synthesis`.

---

## Quick Scan (Phase 0)

Runs on every invocation. Produces:

- Metadata snapshot (title, description, OG tags, JSON-LD)
- Structural counts (links, headings, code blocks, tables)
- Screenshot analysis (visual design quality signal — SHOULD)
- Compliance status
- Absence pattern detection (detectable at Quick tier)
- Lightweight Creator View teaser (2-3 sentences)

**Writes:** meta.json, analysis.json (partial, Quick tier). Write to disk before
gate.

**Gate:** Quick Scan is a **preview**. Standard produces the full artifact set
needed for `/synthesize` cross-source intelligence.

```
Quick Scan complete. [health bands].

Quick Scan is a preview — it confirms whether this site is worth your time.
Standard analysis produces the full artifact set needed for /synthesize
cross-source intelligence.

Run Standard? (Standard ~5-10 min) [Y/n]
```

All flags (`--depth=standard`, `--depth=deep`, `--site`, `--expedition`) bypass
this gate.

**source_tier:** Websites span `T1`-`T4` based on editorial authority. Default
`T2`; handler may suggest a different tier from content signals (academic
sources → T1, anonymous blogs → T3-T4). User can override during `/synthesize`
pre-flight.

## Standard (Phases 1-4)

Adds:

- WebFetch processed content (primary content source)
- Full Creator View (7 sections, conversational prose)
- Engineer View (6 dimensions, 4-band scoring)
- Value Map (knowledge candidates ranked)
- Link scoring (all links scored for relevance)
- Full 11-pattern absence detection across all extracted content

## Deep

Adds to Standard:

- HTTP header analysis (security headers, cache, CSP)
- Extended link scoring with cross-reference density
- Agent wave for parallel dimension analysis (up to 3 agents)
- Deeper absence pattern detection

---

## Creator View (MUST for Standard/Deep)

Seven sections, conversational prose. Write creator-view.md before Engineer
View. Per REFERENCE.md Section 4.

1. **What's Relevant To Your Work** — map to active projects
2. **What This Site Understands** — 13 value axes as backbone
3. **Voice and Editorial POV** — editorial stance, implied author
4. **Where Your Approach Differs** — productive vs fundamental divergence
5. **The Challenge** — what makes this site hard to use as knowledge source
6. **The Warning** (OPTIONAL) — genuine risks only (ToS, bias, misinfo)
7. **Knowledge Candidates** — extractable items with type, confidence, effort

## Engineer View (SHOULD for Standard/Deep)

Six dimensions, 4-band scoring. Per REFERENCE.md Section 5.

Performance | Security Headers | Accessibility | SEO | Technical Stack | Mobile
Readiness

> See REFERENCE.md Section 5 for dimension definitions and thresholds.

---

## Routing Menu

After Standard/Deep, present:

1. **Extract knowledge** — pick from value-map, write
   `.research/extraction-journal.jsonl`, regenerate `.research/EXTRACTIONS.md`
2. **Start Expedition** — launch Expedition mode from analyzed page
3. **Deep-plan this** — inject analysis.json + creator-view.md as
   `## Research Context` in deep-plan DIAGNOSIS.md
4. **Save to memory** — persist key findings
5. **Explore insights** — deeper Creator View conversation
6. **Done** — list all output files with sizes, remove state file, run retro
7. **Cross-site synthesis** — if 3+ sites analyzed, suggest `/website-synthesis`

> See REFERENCE.md Section 12 for routing behavior details.

---

## Compliance Pre-flight (MUST — runs before extraction)

1. Fetch robots.txt via WebFetch (cache for session)
2. Check Anthropic user agents (ClaudeBot, Claude-User, Claude-SearchBot)
3. Check `cf-mitigated` header — WARN if Cloudflare detected
4. Check for RSS/Atom feeds — surface as option if found
5. Check `X-Robots-Tag` headers
6. Classify: HARD_BLOCK | WARN | PROCEED
7. HARD_BLOCK → write minimal analysis.json with compliance reason, stop.
   Suggest: check in regular browser, try different page, or different URL.
8. WARN → surface to user, require acknowledgment before continuing

> See REFERENCE.md Section 7 for full compliance procedures.

---

## State File & Resume

**Location:** `.claude/state/website-analysis.<site-slug>.state.json`

Update after every phase. On resume, read state file, skip completed phases.
Re-invoke `/website-analysis <same-URL>` to trigger recovery. The state file
also stores `process_feedback` (string, nullable) from the retro prompt.

**Artifacts as checkpoints:** analysis.json, creator-view.md, meta.json persist
independently even if state file is lost. State file and disk artifacts survive
`/session-end` and session restarts.

**High-link-density trigger (SHOULD):** When >40 unique external links, suggest
Expedition or cross-site synthesis. See REFERENCE.md Section 8.

**Invocation tracking (MUST):** Log via `write-invocation.ts` with skill, depth,
mode context. See REFERENCE.md Section 15.

---

## Integration

- **Sibling:** `/repo-analysis` (same dual-lens architecture for code repos)
- **Companion:** `/website-synthesis` (cross-site synthesis, requires 3+ sites)
- **Shared artifacts:** extraction-journal.jsonl, EXTRACTIONS.md,
  reading-chain.jsonl in `.research/` (reading-chain.jsonl written during
  Extract Knowledge routing option, same flow as extraction-journal.jsonl)
- **Consumers:** JASON-OS Domain 02a, `/deep-plan` (as research context)

---

## Tag Suggestion (MUST for Standard/Deep)

After writing value-map.json, suggest 5-8 tags for the analysis record based on:

1. Source type: `website`
2. Site type: e.g., `documentation`, `blog`, `api-docs`
3. Topic keywords from content: e.g., `react`, `mcp`, `ai-agents`
4. Candidate types found: e.g., `pattern`, `anti-pattern`
5. Ecosystem tags already detected

Present to user: "Suggested tags: [list]. Accept, modify, or add your own?"
Store accepted tags in `analysis.json` `tags` array. Per CONVENTIONS.md
Section 14.

---

## Self-Audit (MUST — penultimate phase)

Before presenting results, verify all 9 dimensions:

1. **Completeness** — all requested artifacts exist on disk
2. **Orphan detection** — no references to files that weren't written
3. **Schema integrity** — all JSON artifacts have `schema_version` field
4. **Gap analysis** — Creator View sections reference actual extracted content
5. **Functional verification** — state file updated to current phase
6. **Multi-agent** — dispatch code-reviewer on creator-view.md (Standard/Deep)
7. **Regression** — if prior analysis exists, compare finding/candidate counts
8. **Contract** — verify analysis.json matches REFERENCE.md Section 1 schema
9. **Partial recovery** — detect stale artifacts from interrupted runs, warn

## Retro (SHOULD)

Before presenting the routing menu, ask: "What worked well? What would you
change next time?" Save the response to `process_feedback` in the state file.
Per CONVENTIONS.md Section 10.

---

## Version History

| Version | Date       | Description                                                                                                                         |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1.2     | 2026-04-09 | CONVENTIONS alignment: SITE-ANALYSIS.md→creator-view.md, add summary.md, remove links.json from output list (Session #270 E2E test) |
| 1.1     | 2026-04-06 | Convergence: CONVENTIONS.md ref, --depth= flags, retro persistence                                                                  |
| 1.0     | 2026-04-06 | Initial implementation                                                                                                              |
