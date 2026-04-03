# Reframing Analysis: Debt-Runner Research v1 → v2

**Date:** 2026-03-27 (Session #243) **Source:** Explore agent + inline analysis
comparing v1 CLI-only research against hybrid scope

## Context

The original debt-runner research (v1, 17 agents) was done with CLI-only
framing. Post-research, the user decided on hybrid CLI+Web architecture. This
analysis identified what needed to change in the research output.

## Findings (10 items)

### REWRITE (3 sections)

1. **Executive Summary (lines 34-42)** — Frames entire expansion as CLI skill
   with extended menu. Under hybrid, READ operations (trends, browsing) belong
   on web. "Extend the existing flat-menu model" is partially wrong.

2. **Section 3.2 Missing Consumers (lines 240-253)** — Lists 7 missing consumers
   implicitly as CLI output. Items 1,3,4,5,6 (trend viz, PR summary, source
   health, category velocity) are web dashboard features, not CLI.

3. **Section 7.4 Integration Points (lines 579-591)** — Missing web dashboard as
   integration point entirely. No mention of how web accesses JSONL/metrics.

### REFRAME (4 sections)

4. **Section 6.1-6.2 Interactive Design Patterns (lines 444-508)** — CLI
   terminal patterns (menus, cards, progress headers) are valid for write-side
   only. Web has its own React-based UX.

5. **Section 7.1 Current Modes Extended (lines 512-525)** — Some mode expansions
   (health trends, source status) belong on web, not CLI.

6. **Section 7.2 New Modes (lines 527-535)** — `sources` and `health` expansions
   are web content. Rendering trend graphs in terminal is wrong medium.

7. **Section 7.3 Sub-Menus (lines 537-577)** — Sources sub-menu items are web
   components, not CLI prompts. Triage/roadmap sub-menus stay CLI.

### MINOR (3 sections)

8. **Section 6.3 Delegation Spectrum (lines 494-508)** — Correct for CLI
   write-side. Just needs scope clarifier.

9. **Section 7.5 Full Refresh Workflow (lines 593-610)** — Step 8 "show
   dashboard" → web, not CLI. Steps 1-7 unchanged.

10. **Section 7.6 Reconciliation Summary (lines 612-624)** — CLI post-operation
    summary is correct. Also needs web persistent view.

## Codebase Facts Missed by v1 Research

- /app/dev/page.tsx already exists with Google OAuth + admin claim gate
- DevTabId type has 5 tabs: lighthouse, errors, sessions, docs, overrides
- Lighthouse tab reads from Firestore, not local files
- Zero charting libraries installed
- PlaceholderTab component reserves slots for future tabs
- output: "export" in next.config.mjs — static SPA, no API routes in prod
- Chart CSS variables (--chart-1 through --chart-5) already defined
- cmdk (command palette) already installed
- react-day-picker already installed

## Resolution

All findings were addressed in the v2 re-research (23 agents), producing a
941-line RESEARCH_OUTPUT.md with hybrid architecture throughout.
