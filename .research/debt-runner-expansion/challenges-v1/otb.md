# Outside-the-Box Challenge Analysis: debt-runner Expansion

**Author:** OTB Challenge Agent **Date:** 2026-03-26 **Research read:**
RESEARCH_OUTPUT.md (607 lines), claims.jsonl (70 claims, all HIGH confidence)

---

## What This Document Is

The research is thorough, technically accurate, and internally consistent. The
12-agent team did excellent work mapping 30 scripts, 25+ skills, 11 CI
workflows, and 8,470 live debt items. This document is not a quality critique.

It is a deliberate adversarial lens — raising questions, alternative framings,
and risk vectors that confident, well-sourced research tends to route around
precisely because the evidence is so strong. The better the research, the more
important it is to ask: what did the framing itself prevent from being seen?

---

## Challenge 1: The Expansion Frame Is a Trap

### What the Research Assumed

The entire research is structured around the premise that the answer is "expand
debt-runner." The question it answered was "how should debt-runner become a
complete debt dashboard?" — not "should it?" Every sub-question presupposed
expansion. The conclusion — 6 new modes, multiple new scripts, new sub-menus —
was baked into the research design.

### Alternative Perspective

The research itself reveals a more uncomfortable finding: the existing 7-mode
debt-runner already struggles to be used (evidence: 2,125 items stuck in the
verification queue, 1,115 resolved items but only 14 entries in the resolution
log). Adding 6 more modes to a skill that isn't being fully utilized is not
expansion — it is complexity accumulation.

The user's original request mentions "menus and submenus," "complete debt
dashboard," and "completely run a debt-refresh." These phrases could describe
either:

- A) An expanded CLI skill (the research's answer), or
- B) A separate, purpose-built orchestration skill that _calls_ debt-runner
  rather than absorbing all functionality into it.

Option B was not explored at all.

### Potential Impact

HIGH. If debt-runner grows to 13+ modes with 4-5 sub-menus each, a non-developer
director will face a 3-4 level deep interactive tree on a topic (technical debt)
that is already cognitively taxing. The current 7-mode design is already at the
upper edge of what the research found (maximum 3-level depth across all 13
surveyed skills). Adding a second level of sub-menus to 6 new modes means users
need to hold a mental model of ~40+ distinct interaction paths.

### Recommendation

Before designing the expansion, answer the threshold question the research
didn't ask: is the problem that debt-runner is missing modes, or that the
existing modes are underutilized? If the verification queue has 2,125 stuck
items, the bottleneck is not the absence of a `triage` mode — it is something
upstream (cognitive load, invocation friction, unclear ownership). Adding more
modes to an underused skill without diagnosing the utilization gap is the wrong
sequence.

---

## Challenge 2: The User Is a Non-Developer Director — Not a Power User

### What the Research Assumed

The research correctly documents the user profile (non-developer director, 240+
sessions), and it does note the 3-level depth limit. But the interaction design
proposals in Section 7 do not reflect this user profile. Sub-menus with named
flags (`sync-sonarcloud.js --dry-run --severity BLOCKER,CRITICAL,MAJOR`), source
health tables listing last-sync timestamps, and script-name-level transparency
assume a user who is comfortable thinking in script execution terms.

The research also recommends the roadmap sub-menu expose five distinct options
including `sync-roadmap-refs.js --check-only` and `reconcile-roadmap.js --write`
as separate user choices. This is engineer-level granularity presented to a
director.

### Alternative Perspective

The user's actual vocabulary from the original request: "run a debt-refresh,"
"complete debt dashboard," "manage all DEBT," "invoke different types of
audits." This is outcome language, not mechanism language. The user thinks about
_what happens_ (debt is refreshed, debt is visible, audits run), not _which
script in which order with which flags_.

A "guided mode" vs "expert mode" distinction would let the skill serve both the
director-as-operator (who wants to say "refresh everything" and confirm at key
gates) and a future technical contributor (who wants fine-grained script
control). The current design goes straight to expert mode.

Natural language shortcut phrases are also worth considering: "show me all S0
items," "run a full refresh," "what debt is blocking the current roadmap phase."
The MCP SonarCloud server already exists (`scripts/mcp/sonarcloud-server.js`).
The research catalogued it but did not propose using it for AI-native query
paths that bypass menus entirely.

### Potential Impact

MEDIUM-HIGH. If the expanded skill is built to the research's proposed design
without a guided/simplified path, adoption will be low for the same reason the
current verification queue has 2,125 stuck items: the cognitive cost of
navigating the interface exceeds the perceived value of each individual action.

### Recommendation

Add a "guided mode" that presents only three options at any given moment (not
6-8), describes actions in outcome language ("refresh all debt sources" not "run
sync-sonarcloud.js --force"), and handles confirmation gates with plain English
summaries. Expert mode can still exist with full menu depth for power use. The
`_shared/ecosystem-audit` library already implements outcome-language finding
cards — the same philosophy should apply to mode selection.

---

## Challenge 3: Fix the Bugs First — Sequencing Is Not Optional

### What the Research Assumed

Section 8 documents 6 bugs and suggests they be fixed "in a dedicated
pre-expansion PR." This framing treats bug-fixing and expansion as parallel work
streams with a light sequencing preference. The research does not assess whether
the bugs invalidate the expansion's assumptions.

### Why This Is Wrong

BUG-03 (`resolve-bulk.js` does not call `sync-deduped.js`) and BUG-05
(`consolidate-all.js` can overwrite CI resolutions) are not minor housekeeping
issues — they are data integrity hazards that can silently destroy work.
Specifically: the proposed "Full Debt Refresh" workflow (Section 7.5) includes
`consolidate-all.js` at step 4. If BUG-03 is present when this workflow runs (CI
has merged one or more `Resolves: DEBT-XXXX` PRs), step 4 will silently
overwrite those CI resolutions in MASTER_DEBT.jsonl. The research documents this
hazard in BUG-05 and in the "Full Debt Refresh" workflow note. But it does not
draw the explicit conclusion: the Full Debt Refresh workflow cannot safely be
built until BUG-03 and BUG-05 are resolved.

BUG-01 (lowercase status filter in `debt-health.js`) means the health scores and
benchmarks driving the "health" mode are currently wrong. Building an expanded
health mode on top of miscalculated baselines will produce a dashboard that
looks authoritative but reports incorrect averages.

### Potential Impact

HIGH. The canonical-memory note on the MASTER_DEBT overwrite hazard exists
precisely because this scenario has already caused data loss (Session #179
reference in `resolve-item.js` comments). Shipping an expanded skill that
includes a "full refresh" mode without first fixing the sync sequencing bug is
shipping a data destruction vector with a friendly UI on top.

### Recommendation

The 6 bugs are not pre-expansion prep — they are blockers. BUG-01, BUG-03, and
BUG-05 specifically must be fixed and verified before any expansion work begins.
BUG-02 (missing `--dry-run` flag) must be fixed before the dedup mode is usable
in any form. The correct sequence is: bugs first, expansion second. This is not
just a hygiene preference — it is a data safety requirement.

---

## Challenge 4: The Research Treats "13% Resolution Rate" as a Metric, Not a Symptom

### What the Research Found

13% resolution rate, 7,281 open items, 2,125 items in the verification queue
with no age escalation, resolution log with 14 entries vs. 1,115 resolved items.

### What the Research Did Not Ask

Why is the resolution rate 13%? This is not a display gap — the health mode
already shows this. It is not a tooling gap — the verify, plan, and cleanup
modes exist. So what is preventing resolution?

Possible answers the research did not investigate:

1. The items in MASTER_DEBT.jsonl are not actionable. With 2,942 items from
   "audit" source and 2,561 from SonarCloud, many items may be noise, false
   positives classified as open, or items that require architectural work that
   simply will not happen in the near term. More dashboard visibility doesn't
   fix a fundamentally unactionable backlog.

2. The resolution mechanism is broken for the primary use case. CI resolution
   via `Resolves: DEBT-XXXX` in PR bodies requires the developer to know the
   DEBT ID at PR write time. There is no workflow that surfaces "which DEBT
   items does this PR address?" before the PR is written. The resolution path is
   pull-not-push: items don't come to developers, developers have to remember to
   go get them.

3. The 7,281 open items cannot be prioritized in a useful way. The S0/S1
   distinction exists but the research found (C023) that ecosystem audits
   hardcode `category: "engineering-productivity"` for ALL items regardless of
   domain. If the data is miscategorized, any category-based planning mode will
   produce plans the user does not trust.

### Potential Impact

HIGH. Building a richer dashboard on top of an unactionable backlog produces a
better-looking problem, not a solved one. The user's goal ("manage all DEBT")
requires the backlog to be trustworthy and actionable, not just more visible.

### Recommendation

Before expanding the dashboard, run a backlog audit: what fraction of the 2,125
NEW items are genuine (not already resolved or false positives)? The research
found (C052) that `reverify-resolved.js` had a 52% false alarm rate on "possibly
unresolved" items. If the same rate applies to the verification queue, ~1,000 of
the 2,125 NEW items may be resolvable with a single sweep. That sweep —
shrinking the queue from 2,125 to ~1,000 real items — would deliver more
resolution rate improvement than any dashboard feature.

---

## Challenge 5: The "New Scripts" Assumption Is Premature

### What the Research Proposed

Section 7.2 and 7.4 propose four new scripts: `sync-npm-audit.js`,
`sync-baseline-debt.js`, `sync-code-scanning.js`, `sync-github-issues.js`. These
are presented as implementation details of the new modes.

### What the Research Did Not Consider

New scripts mean new maintenance surface. The current TDMS has 30 scripts, two
of which (`check-phase-status.js` and `sync-roadmap-refs.js`) already have ESM
inconsistencies that create potential runtime issues. The research found
multiple scripts that are partially documented (non-existent `--dry-run` flag in
REFERENCE.md), have silent failure modes (`sync-deduped.js` errors swallowed in
a try/catch), and have circular dependency risks (BUG-05).

Adding 4 more scripts to this ecosystem increases the surface area for the same
class of bugs. The research catalogued 6 confirmed bugs in existing scripts.
Historical base rate: ~1 significant bug per 5 scripts. Four new scripts
statistically expects at least 1 new bug.

Additionally, `sync-npm-audit.js` and `sync-code-scanning.js` require network
access (npm registry and GitHub API respectively). These will fail in offline
environments, fail with expired tokens, and require maintenance as APIs evolve.
The research notes (C037) that `sync-sonarcloud.js` already has a scale limit of
10,000 issues before truncation. New sync scripts will inherit similar
constraints.

### Alternative Perspective

Instead of new scripts for each source, consider a single extensible
`sync-external-source.js` with a source-adapter pattern — one script, multiple
source adapters registered by name. This is how `sync-sonarcloud.js` could have
been designed and wasn't; a second chance to establish the pattern before adding
three more source-specific scripts.

### Potential Impact

MEDIUM. Four new bespoke scripts is the path of least initial resistance but
highest long-term maintenance cost. The research's recommendation to build
`sync-npm-audit.js` and `sync-baseline-debt.js` as standalone scripts follows
the existing one-source-one-script pattern. This is consistent but not optimal.

### Recommendation

Propose the source-adapter pattern before writing any new sync scripts. Even if
it isn't implemented immediately, naming the pattern prevents the codebase from
accreting four more standalone sync scripts with no shared interface.

---

## Challenge 6: SQLite Timing — The Research Punted on the Most Important Dependency

### What the Research Found

The research (C004) documents 8,470 items in MASTER_DEBT.jsonl and mentions the
ROADMAP's SQLite migration research item, but does not investigate it. The
"known limitations" section acknowledges the omission indirectly.

### What the Research Did Not Assess

At what point does JSONL break? This is not a hypothetical — it is an active
risk. Current state: 8,470 lines. Growth rate: the research found 112
metrics-log.jsonl entries (one per session-end), which suggests ~112 sessions of
operation. That implies roughly 75 debt items added per session on average to
reach 8,470 from 0. If that rate continues, the file reaches 15,000 items in
another 75 sessions, and 25,000 in ~225 sessions.

JSONL files of 8,470 lines are not slow for Node.js `fs.readFileSync` with
`split('\n')`. But `writeMasterDebtSync` (which rewrites the entire file
atomically for every mutation) scales at O(N) per write. At 8,470 items, this is
acceptable. At 25,000 items, every `resolve-bulk.js` run writes a 25,000-line
file atomically. The full-refresh workflow would perform multiple such writes in
sequence.

The research proposes a Full Debt Refresh workflow with 8 steps. At least 3 of
those steps write MASTER_DEBT.jsonl fully (generate-views.js --ingest,
consolidate-all.js, assign-roadmap-refs.js). At current scale that is
manageable. The proposed expansion, if SQLite migration does not happen first,
builds the dashboard on a data layer that has a known scaling cliff ahead.

### Potential Impact

MEDIUM now, HIGH in 12-18 months. Building the expanded dashboard with JSONL as
the data layer is not wrong today. But if the expansion is designed without
SQLite in mind, migration will require rewriting every new script that assumes
JSONL line-by-line I/O. The research's proposed scripts (`sync-npm-audit.js`,
etc.) would all need rewriting.

### Recommendation

The expansion design should explicitly answer: "If we migrate to SQLite in 12
months, which parts of this expansion would need to change?" If the answer is
"all of them," the expansion should at minimum abstract MASTER_DEBT reads and
writes behind a data-access layer rather than calling `fs.readFileSync` and
`JSON.parse` inline. The existing `safe-fs.js` helpers are a partial version of
this abstraction — the new scripts should use them exclusively rather than
adding new direct file access patterns.

---

## Challenge 7: Single Point of Failure Risk

### What the Research Assumed

The research frames debt-runner becoming the "hub" for all debt management as
unambiguously good. More integration, more visibility, more control.

### What It Missed

If debt-runner becomes the mandatory entry point for all debt operations, it
becomes a single point of failure. Currently, each pathway (SonarCloud sync,
bulk resolution, audit intake, PR review deferral) operates independently. If
debt-runner's state file becomes corrupted, if the skill itself has a bug, or if
the user is mid-session when context compacts, work can still proceed via
individual script invocations.

The research notes (C066) that every skill persists state to disk after every
decision. This is true, but it applies to individual mode sessions. If
debt-runner accumulates a `full-refresh` mode that coordinates 8 steps across
multiple scripts, a failure mid-sequence leaves the system in an unknown
intermediate state. The research documents (BUG-05) that the existing 2-step
sequence (CI resolution followed by consolidate-all.js) already has a dangerous
interaction. An 8-step sequence amplifies that risk.

### Potential Impact

MEDIUM. The risk is not that the skill fails catastrophically — the data is
always protected by `safe-fs.js` atomic writes. The risk is that a failed
full-refresh leaves the user unable to determine the data state without running
several diagnostic commands manually. That is a recovery burden the research
does not address.

### Recommendation

The full-refresh mode must be checkpointed — each step should write its
completion status to the state file before proceeding to the next step. A failed
run at step 4 should be resumable from step 4, not require re-running from step
1 (which would risk re-running the destructive `--ingest` step on
already-refreshed data). The research recommends "resume status from
debt-runner.state.json" in the warm-up display. This principle must be extended
to the full-refresh workflow specifically.

---

## Challenge 8: The "Adjacent Systems" Scope Is Undefined and Unbounded

### What the User Asked For

"Adjacent systems that search for debt to add deep-research agent procedures."

### What the Research Did Not Address

This phrase from the original request was not investigated in any of the 9
sub-questions. The research catalogued 26 intake gaps and 6 dark debt stores,
but it did not address the user's apparent intention: running automated
deep-research agents to discover new debt from adjacent codebase areas.

This is a fundamentally different capability from everything else in the
expansion. Running a deep-research agent against the codebase (à la
`/deep-research`) to proactively find debt is:

1. Not orchestrated by any existing skill
2. Not a `sync-*` script operation (it requires AI judgment, not just API calls)
3. Potentially very high token cost if run on a large codebase
4. Entirely absent from the research's proposed architecture

The research's proposed `intake` mode covers scripted ingestion from known
sources. It does not cover AI-driven discovery of debt in sources that are not
already connected to TDMS (e.g., "scan all components for architectural patterns
that suggest technical debt" or "identify all files where the complexity exceeds
the baseline but the items aren't in MASTER_DEBT").

### Potential Impact

HIGH. If the user's vision includes an AI-driven debt discovery mode, the
research has described a dashboard for managing known debt but has not designed
the discovery layer at all. A plan built from the research alone will deliver a
more comprehensive TDMS manager, not the AI-assisted debt discovery platform the
user may be envisioning.

### Recommendation

Before finalizing the expansion design, clarify the "adjacent systems +
deep-research procedures" intent. Is this:

- A) Running existing audit skills (which the research covers via the `intake`
  mode's invocation of single-session audits)?
- B) Running `/deep-research` as a sub-task within debt-runner (a new
  capability, high cost, not designed)?
- C) Automated scheduled discovery (requires a CI workflow, not a CLI skill)?

The answer changes the architecture substantially. Option A is already in the
research. Options B and C are missing entirely.

---

## Challenge 9: The pr-retro Anti-TDMS Philosophy Is a Design Signal Being Ignored

### What the Research Found

C028 documents that `/pr-retro` actively discourages TDMS routing: "DEBT is NOT
an option unless the user explicitly requests it. Do not offer defer to DEBT as
a choice." This is documented as a "pattern" in claims.jsonl.

### What the Research Did Not Ask

Why does `/pr-retro` have an explicit anti-TDMS philosophy? This is not an
oversight or a gap — it is an intentional design decision. The REFERENCE.md says
"Filing into TDMS where it gets lost is NOT a default option." Someone decided
this.

That decision implies a critique of TDMS itself: items filed there get lost.
This critique, embedded in a skill written by the project's own maintainer, is
stronger evidence about the usability of TDMS than the 13% resolution rate
statistic. If the person who built the system designed an escape valve that says
"don't file into TDMS because it gets lost," the expansion plan needs to address
the "gets lost" problem, not just add more modes for filing things.

### Potential Impact

HIGH. The research proposes expanding the intake surface (more sources, more
modes, better coverage). But if the core problem is that items filed into TDMS
are never acted on, expanding intake makes the problem worse — the backlog grows
faster, the 13% resolution rate drops, and the dashboard shows increasingly bad
metrics despite more investment.

### Recommendation

The expansion plan needs a resolution acceleration strategy, not just an intake
expansion strategy. Specifically: what makes an item in TDMS actionable? The
research notes that S0/S1 items are surfaced in `/alerts` and `/session-begin`.
But 11 open S0 items still exist. Surface is not the problem. The problem is
that debt items have no clear owner, no due date, no connection to the active
sprint, and no consequence for remaining open. A dashboard that shows them more
clearly but does not add ownership, urgency, or sprint connection will produce a
higher-fidelity view of the same unresolved backlog.

---

## Challenge 10: The Minimum Viable Expansion Question Was Not Asked

### What the Research Delivered

A comprehensive expansion proposal: 6 new modes, 5+ new scripts, new sub-menus,
statusline widget, full-refresh workflow, deep-plan style reconciliation. This
is the maximum viable expansion.

### What Was Not Proposed

A minimum viable expansion that delivers the user's core stated goals with the
smallest possible scope increase. Consider what the user specifically said:

1. "Menus and submenus" — the existing design already has a menu; one level of
   sub-menus on existing modes would satisfy this without adding 6 new modes.
2. "Invoke different types of internal and external audits" — a single new
   `audit` mode with a sub-menu listing the 13 existing single-session audit
   skills would satisfy this entirely with zero new scripts.
3. "Completely run a debt-refresh" — a `refresh` mode that sequences the 5
   most-commonly-needed operations (SonarCloud sync, consolidate, views,
   metrics, roadmap check) would satisfy this. The research's 8-step
   full-refresh includes 4 new scripts and handles edge cases; a simpler 5-step
   refresh using only existing scripts is achievable in days.
4. "Complete debt dashboard where all DEBT can be managed" — the existing 7
   modes, with the 6 bugs fixed, already handle the core management operations.

A phase-1 minimal expansion (fix 6 bugs, add `audit` mode, add `refresh` mode,
add 2 sub-menus to `health` and `sync`) could be shipped in a week and would
address the majority of the user's stated goals without the risk of the larger
expansion.

### Potential Impact

MEDIUM. The risk of not asking this question is scope creep. The research
identifies 26 gaps and 6 new modes — implementing all of them is a multi-week
project. If the user's actual need is satisfied by a 1-week minimal expansion,
the research has been valuable for understanding the full landscape but
dangerous if taken as a literal implementation spec.

### Recommendation

Present the user with a tiered expansion plan:

- Phase 1 (1 week): Fix 6 bugs + add audit mode + add refresh mode
- Phase 2 (2-3 weeks): Add triage, dark-debt, sources modes + new sync scripts
- Phase 3 (later, post-SQLite): Full dashboard with trend visualization, roadmap
  alignment, statusline widgets

This respects the research's findings while giving the user a faster path to
value and a natural checkpoint before committing to the full expansion.

---

## Summary: What the Research Got Right vs. What It Missed

### Got Right

- Complete, accurate mapping of existing system (30 scripts, 25 skills, 11 CI
  workflows, 70 HIGH-confidence claims)
- Identified and confirmed 6 real bugs with file-level specificity
- Correctly limited interactive depth to 3 levels
- Recognized that the expansion should be additive, not a rewrite
- Identified the most critical intake gaps (code-reviewer, SonarCloud CI
  auto-sync)
- Documented the `_shared/ecosystem-audit` library as the right interaction
  pattern

### What It Missed

| #   | Missed Element                                                                  | Severity    |
| --- | ------------------------------------------------------------------------------- | ----------- |
| 1   | Whether to expand vs. create a new skill (threshold question unasked)           | HIGH        |
| 2   | Guided/simplified mode for non-developer director user profile                  | MEDIUM-HIGH |
| 3   | Bug fixes as blockers, not prep work (BUG-03/05 block Full Refresh)             | HIGH        |
| 4   | Why resolution rate is 13% — symptom vs. root cause                             | HIGH        |
| 5   | SQLite migration timing dependency on new script design                         | MEDIUM      |
| 6   | Source-adapter pattern vs. 4 new standalone sync scripts                        | MEDIUM      |
| 7   | Single point of failure + checkpoint/resume for multi-step workflows            | MEDIUM      |
| 8   | "Adjacent systems + deep-research" intent is undefined and absent               | HIGH        |
| 9   | pr-retro's anti-TDMS philosophy as diagnostic signal for actionability gap      | HIGH        |
| 10  | Minimum viable expansion not scoped — research presented as implementation spec | MEDIUM-HIGH |

---

## Confidence

These are challenges, not findings. They are backed by observations from the
research itself (cited by claim/section) and logical analysis of what those
observations imply. They are not grounded in additional filesystem reads. None
should be treated as HIGH-confidence conclusions — they are questions that
deserve a deliberate answer before the expansion plan is written.

The most important three, if prioritization is required:

1. Fix BUG-03 and BUG-05 before building anything (data integrity blocker)
2. Clarify "adjacent systems + deep-research" intent (missing architecture)
3. Diagnose why items are not being resolved before expanding intake (root
   cause)
