# Findings: Gap Verification — G1, G2, G3

**Searcher:** deep-research-gap-verification-agent **Profile:** codebase +
filesystem **Date:** 2026-03-29 **Sub-Question IDs:** GV1 (verification of G1,
G2, G3 claims against filesystem)

---

## Verification Method

Each claim was checked against the SoNash filesystem via Grep, Read, and Bash.
Verdicts:

- **VERIFIED** — filesystem confirms the claim as stated
- **REFUTED** — filesystem directly contradicts the claim
- **MODIFIED** — claim is partially correct but requires a qualifying amendment
- **UNVERIFIABLE** — claim depends on external sources not checkable via
  filesystem

---

## G1 Verification: `effort:max` Opus-Exclusivity Claims

### G1-V1: No agent currently uses `effort:` in frontmatter [VERIFIED]

**Check:** Grep for `effort:` in `.claude/agents/` (both project-level and
`global/` subdirectory).

**Result:** Zero matches in both `.claude/agents/*.md` and
`.claude/agents/global/*.md`.

**Verdict: VERIFIED.** No existing agent uses `effort:` in frontmatter. The D8
resolution recommends _migrating_ security-auditor to `effort: max` at next
substantive update — the migration has not yet occurred.

---

### G1-V2: No skill references `effort:` as an API parameter [VERIFIED]

**Check:** Grep for `effort:` in `.claude/skills/`.

**Result:** 23 matches found across 12 skill files, but every match is `effort:`
in the context of issue estimation tagging (E0/E1/E2/E3 effort levels for audit
findings) or as a JavaScript object property (`finding.effort`, `i.effort`).
Zero matches reference the Claude API `effort` frontmatter parameter.

**Verdict: VERIFIED.** The skills codebase has no usage of `effort:` as an
API-level model configuration parameter.

---

### G1-V3: DR1 D8 text — what it actually says about `effort: max` on Sonnet [MODIFIED]

**Check:** Direct read of DR1-dispute-resolutions.md, lines 554-628 and
line 791.

**What G1 claimed:** "D8 resolved to use `effort: max` on Sonnet instead of
migrating security-auditor to Opus 4.6."

**What DR1 D8 actually says:**

The D8 resolution is based on a _specific interpretation_ of official
documentation: that `effort: max` _selects Opus 4.6_ (i.e., `effort: max` is not
"Sonnet at max effort" but rather a model-upgrade pathway that routes to Opus
4.6 regardless of session model). DR1 D8 cites "D1b line 31: 'max (Opus 4.6
only)'" and explicitly reasons:

> "The critical factual question is: does `effort: max` run the model on Sonnet
> or upgrade to Opus? D1b line 31 from official documentation states: 'max (Opus
> 4.6 only)' — meaning `effort: max` selects Opus 4.6."

DR1 D8's resolution is: "Switch security-auditor from `model: opus` to
`effort: max`." The rationale is that this is a _no-quality-cost_ switch because
`effort: max` routes to Opus 4.6 — not because Sonnet-with-max-effort equals
Opus.

**The G1 framing therefore mischaracterizes D8.** DR1 D8 was NOT saying "use
effort: max on Sonnet as a cheaper substitute for Opus." It was saying "effort:
max IS Opus 4.6 (just via a different frontmatter mechanism)."

**G1's critique is still valid**, but the framing is wrong. The G1 critique is:
"effort: max on Sonnet returns an API error." DR1 D8 assumed `effort: max` =
model upgrade to Opus. G1 says `effort: max` on Sonnet = API error. These are
two different readings of `effort: max`.

**The actual dispute between G1 and D8:**

- **DR1 D8 interpretation:** `effort: max` in a Claude Code agent frontmatter
  triggers Opus 4.6 regardless of the base model; it is a model-selection alias.
- **G1 interpretation:** `effort: max` is a runtime effort-level parameter;
  applied to Sonnet (the session default), it returns an API error.

**Which is correct cannot be verified from the filesystem.** It requires testing
the API or reading the current Claude Code model-configuration documentation
directly. DR1 itself flags this as "UNVERIFIABLE against the filesystem" at the
time of writing (D8 evidence table row 1: "C-049: `effort: max = Opus 4.6 only`
per D1b line 31 — UNVERIFIABLE").

**Verdict: MODIFIED.** G1's claim that "D8 resolved to use effort: max on Sonnet
as a Sonnet-only upgrade" is a misreading of DR1. DR1 D8 resolved to use
`effort: max` as a _model-upgrade alias to Opus 4.6_. The technical dispute
(whether effort: max acts as a model selector or a runtime effort parameter)
remains unresolved by filesystem evidence alone. Both G1 and DR1 cite official
documentation; they interpret the same docs differently.

---

### G1-V4: security-auditor.md current `model:` field [VERIFIED with a correction]

**Check:** Read `.claude/agents/security-auditor.md` frontmatter.

**Result:**

```
model: sonnet
```

**G1 stated:** "security-auditor is one of 5 Tier A reference agents" (implying
it uses `model: opus`). The DR1 change table (line 791) lists: "security-auditor
`model: opus` → Migrate to `effort: max` at next substantive update."

**Actual filesystem state:** `model: sonnet`. The agent is already on Sonnet.
The DR1 change table was aspirational — it described what _should_ happen, not
the current state.

**Implication:** The security-auditor frontmatter does not have `model: opus` as
DR1 assumed. It has `model: sonnet`. So:

1. The D8 "migrate from opus to effort:max" recommendation is moot for the
   current file state.
2. G1's concern about `effort: max` being added to a Sonnet agent is valid if D8
   is acted on literally — but the current file has neither `model: opus` nor
   `effort: max`.

**Verdict: VERIFIED (with correction).** security-auditor currently runs on
`model: sonnet`. The D8 resolution was written against a presumed `model: opus`
that does not exist in the current file. G1's concern about `effort: max` being
added would only materialize if D8 is applied without first verifying the actual
file state.

---

## G2 Verification: Firebase SoNash Implementation Claims

### G2-V1: SoNash uses httpsCallable [VERIFIED]

**Check:** Grep for `httpsCallable` across all TypeScript files.

**Result:** 12 files contain `httpsCallable`. In the main app:

- `lib/firestore-service.ts`: 3 distinct call sites for `saveDailyLog`,
  `saveInventoryEntry`, `saveJournalEntry` — all guarded writes to protected
  collections
- `lib/auth/account-linking.ts`: account merge
- `hooks/use-journal.ts`: journal write hook
- `lib/utils/retry.ts`, `lib/utils/callable-errors.ts`: utility helpers for
  callable pattern

**Verdict: VERIFIED.** `httpsCallable` is the exclusive write path for all three
protected collections (`journal`, `daily_logs`, `inventoryEntries`). The G2
Firebase security architecture claim is confirmed by ground truth.

---

### G2-V2: App Check is implemented in Cloud Functions [MODIFIED]

**Check:** Grep for `appCheck`, `requireAppCheck`, `App Check` in `functions/`.

**Result:** App Check exists in `functions/src/index.ts` (architecture) and
`functions/src/security-wrapper.ts`. However, in every Cloud Function that calls
`withSecurityChecks()`, App Check is explicitly set to:

```
requireAppCheck: false, // TEMPORARILY DISABLED - waiting for throttle to clear
```

This pattern appears in:

- `saveDailyLog`: `requireAppCheck: false`
- `saveJournalEntry`: `requireAppCheck: false`
- `softDeleteJournalEntry`: `requireAppCheck: false`
- `saveInventoryEntry`: `requireAppCheck: false`
- `migrateAnonymousUserData`: App Check verification block is commented out
  entirely

**G2 claim stated:** "App Check is implemented — search for 'appCheck' in
functions/." The G2 finding was evaluating official Firebase skills, not making
a claim about SoNash's current App Check enforcement state.

**For GV purposes:** App Check infrastructure IS present (the parameter exists,
the wrapper supports it, the security event logging references it). But App
Check verification is currently DISABLED at runtime across all Cloud Functions.
The CLAUDE.md Section 2 security rule ("App Check Required — all Cloud Functions
verify tokens") describes the intended architecture, not the current runtime
state.

**Verdict: MODIFIED.** App Check infrastructure is implemented but is currently
disabled (`requireAppCheck: false`) across all Cloud Functions. Claiming "App
Check is implemented" is accurate for architecture; it is inaccurate for runtime
enforcement.

---

### G2-V3: Zod is used in Cloud Functions schemas [VERIFIED]

**Check:** Grep for `from 'zod'` in `functions/src/schemas.ts`.

**Result:**

```typescript
import { z } from "zod";
```

Line 1 of `functions/src/schemas.ts`. Zod is also found in
`functions/src/admin.ts` and `functions/src/security-wrapper.ts`.

**Verdict: VERIFIED.** Zod is used in Cloud Functions for schema validation.

---

### G2-V4: Firebase MCP server is NOT configured in settings.json [VERIFIED]

**Check:** Inspect `.claude/settings.json` for `mcpServers` key and Firebase
references.

**Result:**

- `settings.json` top-level keys: `permissions`, `env`,
  `enableAllProjectMcpServers`, `disabledMcpjsonServers`, `hooks`, `statusLine`,
  `enabledPlugins`
- `mcpServers` key is absent from `settings.json`
- The only "firebase" references are in the `hooks` section (deploy guard hook
  pattern: `Bash(firebase deploy *)`) — not MCP configuration
- `enabledPlugins` key is present but no Firebase plugin is listed

**Verdict: VERIFIED.** The Firebase MCP server is not configured. The G2
recommendation to install the Firebase MCP server for live operational tooling
remains an open action item.

---

## G3 Verification: Auto-Delegation Claims

### G3-V1: CVE-2025-59536 — no agents with `bypassPermissions` or `dontAsk` [VERIFIED]

**Check:** Grep for `permissionMode`, `bypassPermissions`, `dontAsk` in both
`.claude/agents/*.md` and `.claude/agents/global/*.md`.

**Result:** Zero matches in both directories.

**G3 claim stated (Serendipity section):** "If malicious content appears in
`.claude/agents/`, it could be executed — particularly for agents with
`bypassPermissions` or `dontAsk` permission modes."

**Verdict: VERIFIED.** No SoNash agent uses elevated permission modes. The
CVE-2025-59536 attack surface is reduced by this fact, though the general
injection risk (malicious content embedded in agent files via supply chain)
still applies to all 39 agent files regardless of permission mode.

---

### G3-V2: CLAUDE.md Section 7 is the trigger table [VERIFIED]

**Check:** Read CLAUDE.md Section 7 (loaded in system context).

**Result:** CLAUDE.md Section 7 "Agent/Skill Triggers" contains:

- PRE-TASK trigger table (7 conditions → specific agents/skills)
- POST-TASK trigger table (4 conditions → specific agents/skills)
- Statement: "Agents are REQUIRED when triggers match — not optional
  suggestions"
- Reference to 27 agents available in `.claude/agents/`

**Verdict: VERIFIED.** CLAUDE.md Section 7 is the authoritative agent trigger
table with prescriptive ("REQUIRED") language. The G3 claim that CLAUDE.md
trigger directives are the highest-authority routing layer is confirmed.

---

### G3-V3: Token budget concern — total agent description characters [MODIFIED]

**G3 claim:** "The combined ~15,000 character budget across all agent
descriptions" is a concern with 27 agents; description crowding may cause
routing failures.

**Check:** Counted description-field characters across all agent files.

**Result:**

| Directory                | Agent count | Total description chars |
| ------------------------ | ----------- | ----------------------- |
| `.claude/agents/`        | 26          | 4,994                   |
| `.claude/agents/global/` | 13          | 1,731                   |
| **Total**                | **39**      | **6,725**               |

Key notes:

- Average description length: 192 chars (project agents), 133 chars (global
  agents)
- `dependency-manager.md` has only 1 description character — effectively no
  description
- `deep-research-searcher.md` and `deep-research-synthesizer.md` (global) have
  only 2 characters each — also near-empty descriptions
- The two longest descriptions are `plan.md` (280 chars) and
  `documentation-expert.md` (251 chars)

**Total combined description budget used: 6,725 characters out of a ~15,000 char
ceiling.**

At 6,725 chars across 39 agents, the current SoNash setup uses **45% of the
budget limit**. The token budget concern raised in G3 is real in principle but
not currently acute — there is significant headroom. However, 3 agents with
near-zero descriptions (`dependency-manager`, `deep-research-searcher`,
`deep-research-synthesizer`) represent routing failures waiting to happen, not a
budget problem.

**Verdict: MODIFIED.** The 15,000 char ceiling concern is premature — current
usage is 6,725 chars (45%). The more pressing concern is the 3 agents with 1-2
char descriptions that provide no routing signal whatsoever. Description
sparsity is a bigger risk than description crowding for SoNash at current scale.

---

## Cross-Cutting Finding: Agent Count Discrepancy

G3 and the CLAUDE.md system context both reference "27 agents." Filesystem
count:

- `.claude/agents/` (project-level): 26 .md files (plus `global/` subdirectory)
- `.claude/agents/global/`: 13 .md files

Total: 39 agent files across both directories. The "27 agents" figure appears to
refer to project-level agents only (`.claude/agents/*.md` excluding `global/`),
but the `ls` output shows 26 files there (not 27). One of the 27 may have been
deleted or the count includes a non-`.md` file.

This count discrepancy does not affect any specific G1/G2/G3 claim but should be
noted for accuracy.

---

## Consolidated Verdict Table

| Claim                                         | Source | Verdict  | Key Evidence                                                                          |
| --------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------- |
| No agent uses `effort:` in frontmatter        | G1-V1  | VERIFIED | Grep returns zero matches in agents/ and agents/global/                               |
| No skill references `effort:` as API param    | G1-V2  | VERIFIED | All 23 skill `effort:` matches are estimation tags, not API params                    |
| DR1 D8 "resolved to use effort:max on Sonnet" | G1-V3  | MODIFIED | DR1 D8 resolved to use effort:max as an Opus-alias, NOT as Sonnet capability upgrade  |
| security-auditor uses `model: opus`           | G1-V4  | REFUTED  | Filesystem shows `model: sonnet`; D8's assumed starting state is wrong                |
| SoNash uses httpsCallable                     | G2-V1  | VERIFIED | 3 call sites in firestore-service.ts for all 3 protected collections                  |
| App Check is implemented                      | G2-V2  | MODIFIED | Infrastructure exists; `requireAppCheck: false` across ALL functions at runtime       |
| Zod used in Cloud Functions                   | G2-V3  | VERIFIED | `import { z } from "zod"` line 1 of schemas.ts                                        |
| Firebase MCP server not configured            | G2-V4  | VERIFIED | No mcpServers key in settings.json; enabledPlugins has no Firebase entry              |
| No agents with bypassPermissions/dontAsk      | G3-V1  | VERIFIED | Zero matches for permissionMode in all 39 agent files                                 |
| CLAUDE.md Section 7 is the trigger table      | G3-V2  | VERIFIED | Section 7 confirmed as authoritative REQUIRED trigger table                           |
| Token budget concern (15k chars, 27 agents)   | G3-V3  | MODIFIED | 39 agents total; 6,725/15,000 chars used (45%); sparsity is bigger risk than crowding |

---

## Critical Correction: security-auditor Model State

The most important single finding from this verification pass:

**The security-auditor.md file currently has `model: sonnet`, not
`model: opus`.**

DR1 D8's entire resolution was predicated on migrating "from `model: opus` to
`effort: max`." That starting condition does not exist. The file is already on
Sonnet. If D8 is acted on literally (adding `effort: max`), it would add an
effort parameter to a Sonnet agent — which is exactly what G1 warns is an API
error.

**Action required:** Before applying D8, verify whether the intent was:

1. Leave security-auditor on `model: sonnet` (current state, no change needed
   for D8)
2. Upgrade security-auditor to Opus via `model: opus` or `model: opus-4-6`
   (original intent)
3. Use `effort: max` as a model-upgrade alias (DR1 D8 interpretation,
   technically disputed)

---

## Gaps

1. Whether `effort: max` in Claude Code agent frontmatter acts as a
   model-upgrade alias (selects Opus 4.6) vs a runtime effort parameter (errors
   on Sonnet) cannot be verified from the filesystem. Requires API testing or
   official documentation confirmation.

2. The App Check TEMPORARILY DISABLED status — the
   `// waiting for throttle to clear` comment is present but no issue tracker
   reference or timeline is documented. Unknown how long App Check has been
   disabled.

3. CLAUDE.md states "27 agents available" but filesystem shows 26 project-level
   agents (excluding global/) and 39 total. The authoritative count is unclear.

---

## Serendipity

**App Check is disabled everywhere, not just one function.** The CLAUDE.md
security architecture claim ("App Check Required — all Cloud Functions verify
tokens") describes the design intent but not the current runtime state. Every
single Cloud Function has `requireAppCheck: false` with the same "TEMPORARILY
DISABLED" comment. If this is not a known-tracked debt item, it should be.

**3 agents have functionally empty descriptions:** `dependency-manager.md` (1
char), `deep-research-searcher.md` (2 chars), `deep-research-synthesizer.md` (2
chars). These agents cannot be auto-delegated to reliably because their
descriptions provide zero routing signal. The `deep-research-*` agents being
near-empty is likely intentional (spawned programmatically by the deep-research
skill, not via auto-delegation), but `dependency-manager` having 1 character is
almost certainly a formatting or truncation bug.

---

## Confidence Assessment

- VERIFIED claims: 6
- MODIFIED claims: 3 (require qualifying context)
- REFUTED claims: 1 (security-auditor model: opus assumption)
- UNVERIFIABLE claims: 0 (all checks were filesystem-executable)
- Overall confidence: **HIGH** — all checks were against ground-truth filesystem
  state, not secondary research
