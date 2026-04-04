# Findings: Gap Verification — G4 Teams + CL1 Confidence Claims

**Searcher:** gap-verification-agent **Profile:** codebase (filesystem
ground-truth) **Date:** 2026-03-29 **Sub-Question IDs:** GV2

---

## Verification Scope

Eight specific claims from two prior findings files (G4 and CL1) verified
directly against the SoNash filesystem. All verdicts are based on primary
filesystem evidence — no web search involved.

---

## G4 Team Config Verifications

### GV2-G4-1: SoNash team configs exist and match described structure [VERDICT: CONFIRMED — HIGH]

Both team config files exist at `.claude/teams/`:

- `.claude/teams/audit-review-team.md` — confirmed present and read
- `.claude/teams/research-plan-team.md` — confirmed present and read

**Structure match against G4 description:**

| G4 Claim                                                                     | Filesystem Reality                                                                                               | Match? |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| audit-review-team: 2 members (reviewer + fixer)                              | Roster table: reviewer (sonnet, Read/Grep/Glob/Bash) and fixer (sonnet, Read/Write/Edit/Bash/Grep/Glob)          | YES    |
| research-plan-team: 3 members (researcher, planner, verifier)                | Roster table: researcher (sonnet, WebSearch/WebFetch), planner (opus), verifier (sonnet)                         | YES    |
| audit-review-team is reviewer → fixer sequential pipeline                    | Message flow section documents Lead→reviewer→fixer→Lead sequential path                                          | YES    |
| research-plan-team uses opus for planner only                                | Member roster confirms: planner = opus, researcher = sonnet, verifier = sonnet                                   | YES    |
| Both teams are ephemeral (per-cycle)                                         | Both files have "Ephemeral (per-audit invocation)" / "Ephemeral (per research-plan cycle)"                       | YES    |
| Token cost: audit-review ~3x, research-plan ~4x                              | audit-review-team.md: "2-member teams run ~3x solo cost"; research-plan-team.md: "3-member team: ~4x solo cost"  | YES    |
| "idle notification flood increases with team size (50%+ inbox at 4 members)" | audit-review-team.md: "Idle notification flood increases with team size (50%+ inbox at 4 members)" — exact quote | YES    |

No discrepancies found. G4's description of both team configs is accurate.

---

### GV2-G4-2: TeammateIdle hook configured in SoNash [VERDICT: NOT CONFIGURED — CONFIRMED ABSENT]

Search of `.claude/settings.json` (the authoritative hook config): no
`TeammateIdle` key found anywhere in the file. The full settings.json was read —
hook types present are `SessionStart`, `PreToolUse`, `PostToolUse`,
`PreCompact`, `UserPromptSubmit`, `Notification`, `PostToolUseFailure`. No
`TeammateIdle` hook entry.

Broader search across all `.claude/` files (excluding worktrees) found
`TeammateIdle` only in:

- `.claude/worktrees/research/.planning/agent-environment-analysis/RESEARCH_SYNTHESIS.md`
  — listed as gap item #18 ("Team quality hooks TeammateIdle/TaskCompleted
  validation")
- `.claude/worktrees/research/.planning/agent-environment-analysis/AGENT_TEAMS_RESEARCH.md`
  — listed as "No TeammateIdle/TaskCompleted hooks — no quality gates on
  teammate output"

**Conclusion:** G4's description of TeammateIdle as a "powerful quality
enforcement mechanism not mentioned in SoNash's current team configs" is
confirmed accurate. The hook is documented as a gap/recommendation, not as a
configured artifact. G4's serendipity note about this is correctly framed as a
recommendation, not a description of current state.

---

### GV2-G4-3: AGENT_TEAMS env var set [VERDICT: CONFIRMED — HIGH]

`.claude/settings.json` line 25: `"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"` —
exact value, confirmed present. G4 states the feature "must be explicitly opted
in via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`" and the SoNash project has done
this.

---

### GV2-G4-4: Both team configs include TeamDelete cleanup [VERDICT: CONFIRMED — HIGH]

`TeamDelete` appears explicitly in both team config files:

- `audit-review-team.md` line 111: lifecycle step 5 = "TeamDelete after final
  target + debrief"
- `audit-review-team.md` line 156: `TeamDelete("audit-review-team")` in example
  teardown code
- `research-plan-team.md` line 170: lifecycle step 8 = "TeamDelete after user
  approves or modifies plan"
- `research-plan-team.md` line 246: `TeamDelete("research-plan-team")` in
  example teardown code

G4's claim that "both teams use `TeamDelete` at the end of their lifecycle" and
"ephemeral team design with explicit TeamDelete is the right approach" is
confirmed.

---

## CL1 Confidence Claim Verifications

### GV2-CL1-C003: Case-insensitivity DOWNGRADE — explore.md uses lowercase name [VERDICT: CONFIRMED LOWERCASE — DOWNGRADE VALIDATED]

`.claude/agents/explore.md` frontmatter (line 2): `name: explore` — lowercase,
confirmed.

CLAUDE.md references this agent as `\`Explore\`
agent`(capital E, line 193, Section 7 PRE-TASK table). This is the same discrepancy CL1 flagged: the agent file defines the canonical name as`explore`(lowercase) while CLAUDE.md uses the display-cased form`Explore`. Since the official docs mandate "lowercase letters and hyphens only" for the `name`field,`explore`is the correct canonical name. The capital-E`Explore`
in CLAUDE.md is either:

(a) A display-only styling choice in documentation prose, or (b) A case mismatch
that would matter if agent resolution were case-sensitive.

CL1's downgrade rationale is sound: no official source confirms case-insensitive
runtime resolution. The canonical agent name is unambiguously lowercase.
Downgrade of C-003 from MEDIUM to LOW is validated.

---

### GV2-CL1-C014: Plugin count — CL1 says 6 not 5 [VERDICT: 6-AGENT COUNT PLAUSIBLE BUT NOT LOCALLY VERIFIABLE]

CL1 identified that the `pr-review-toolkit` plugin contains 6 agents (not 5),
with `comment-analyzer.md` as the sixth. This was based on external GitHub
inspection of the official `anthropics/claude-code` repository.

Local filesystem search results:

- The pr-review-toolkit plugin is registered in `.claude/REQUIRED_PLUGINS.md` as
  `pr-review-toolkit@claude-plugins-official`
- The plugin is noted as "Enabled (user only)" in worktree research docs
- No local copies of the plugin agent files exist in `.claude/agents/` — plugin
  agents are installed globally at `~/.claude/` not project-scoped
- No `silent-failure-hunter`, `pr-test-analyzer`, `code-simplifier`,
  `type-design-analyzer`, or `comment-analyzer` files found under `.claude/`
- `code-simplifier@claude-plugins-official` appears as a separate listed plugin
  in REQUIRED_PLUGINS.md — this is distinct from the pr-review-toolkit plugin,
  suggesting `code-simplifier` may not be part of the pr-review-toolkit bundle
  at all

**Assessment:** The CL1 claim that the toolkit contains 6 agents (including
`comment-analyzer`) was sourced from GitHub inspection of the official repo (CL1
source [3]). Local filesystem cannot confirm or deny this — plugin agents are
installed at user-scope (`~/.claude/`), not at project scope. The separate
listing of `code-simplifier@claude-plugins-official` as its own plugin in
REQUIRED_PLUGINS.md raises a question about whether CL1's count of
pr-review-toolkit agents was correct. The 6-vs-5 count remains an
external-source claim that cannot be confirmed from local filesystem alone.

**Verdict:** Cannot confirm or deny from local filesystem. CL1's claim
originates from external source inspection and should be treated as MEDIUM
confidence pending direct plugin inspection at `~/.claude/plugins/`.

---

### GV2-CL1-C028: Skill model: field — check if any SKILL.md uses model: frontmatter [VERDICT: NO SKILL USES model: FIELD — CONFIRMS BUG SIGNIFICANCE]

Exhaustive search: `grep -rn "^model:" .claude/skills/ --include="SKILL.md"`
returned zero results. No SKILL.md in the project uses a `model:` frontmatter
field.

Cross-check of 3 representative SKILL.md frontmatter blocks (deep-plan,
deep-research, session-end): all use only `name:` and `description:` fields.
None use `model:`.

This is consistent with the GitHub Issue #21679 finding that `model:` is
documented but non-functional — the SoNash project has not adopted the field
(whether intentionally or because the bug made it pointless). The absence of
`model:` in SoNash skills confirms the field is not in active use, supporting
the HIGH confidence upgrade for C-028.

---

### GV2-CL1-C002: example blocks in agent descriptions [VERDICT: NONE IN LOCAL AGENTS — CLAIM APPLIES TO PLUGIN AGENTS ONLY]

Search of `.claude/agents/` for `<example>` blocks: zero matches found across
all 27 agent files.

This aligns with CL1's framing: the `<example>` blocks evidence cited for C-002
came from the official pr-review-toolkit plugin agents (external GitHub source),
not from local SoNash agents. The claim that `<example>` blocks improve
delegation is supported by Anthropic's own plugin agents using them — but
SoNash's local agents do not currently employ this pattern.

**Implication for C-002 upgrade (MEDIUM → HIGH):** The upgrade to HIGH is based
on Anthropic's own plugin agents demonstrating the pattern, plus official docs
confirming description-based routing. The absence of `<example>` blocks in
SoNash local agents is a gap (potential improvement opportunity), not a
contradiction of the C-002 claim. The upgrade stands.

---

## Summary of Verdicts

| Claim                                          | Source Finding | Verdict              | Notes                                                                     |
| ---------------------------------------------- | -------------- | -------------------- | ------------------------------------------------------------------------- |
| GV2-G4-1: Team configs exist + match structure | G4             | CONFIRMED (HIGH)     | All structural details verified exactly                                   |
| GV2-G4-2: TeammateIdle hook configured         | G4             | ABSENT (CONFIRMED)   | Not in settings.json; documented as gap only                              |
| GV2-G4-3: AGENT_TEAMS env var set              | G4             | CONFIRMED (HIGH)     | settings.json line 25 exact match                                         |
| GV2-G4-4: Both teams use TeamDelete            | G4             | CONFIRMED (HIGH)     | Both files have lifecycle steps + example code                            |
| GV2-CL1-C003: explore.md uses lowercase        | CL1 downgrade  | VALIDATED            | `name: explore` confirmed; CLAUDE.md uses `Explore` (capital) for display |
| GV2-CL1-C014: 6 agents in pr-review-toolkit    | CL1 upgrade    | UNVERIFIABLE LOCALLY | Plugin at user-scope; code-simplifier listed as separate plugin           |
| GV2-CL1-C028: No SKILL.md uses model: field    | CL1 upgrade    | CONFIRMED CONSISTENT | Zero model: fields found; supports C-028 HIGH upgrade                     |
| GV2-CL1-C002: example blocks in local agents   | CL1 upgrade    | NOT PRESENT LOCALLY  | Pattern exists in plugin agents only; upgrade basis remains valid         |

---

## Contradictions

**CLAUDE.md `Explore` vs `explore.md` name field:** CLAUDE.md Section 7
references `\`Explore\`
agent`with a capital E. The agent file at`.claude/agents/explore.md`uses`name:
explore`(lowercase). These are the same agent — the discrepancy is display-casing in CLAUDE.md vs the canonical frontmatter name. This does not affect functionality if the runtime matches case-insensitively (which CL1 found no evidence to support) but is technically inconsistent. The CLAUDE.md reference should arguably be`\`explore\``
to match the canonical name.

**code-simplifier as standalone plugin vs pr-review-toolkit member:**
REQUIRED_PLUGINS.md lists `code-simplifier@claude-plugins-official` as a
standalone plugin in the "Claude Plugins Official" section, separate from
`pr-review-toolkit@claude-plugins-official`. If `code-simplifier` is both a
standalone plugin AND a member of pr-review-toolkit, the count would need
clarification. If it's only one or the other, the pr-review-toolkit agent count
may differ from what CL1 reported. This cannot be resolved from local filesystem
alone.

---

## Gaps

- **pr-review-toolkit agent count cannot be confirmed locally.** Plugin agents
  installed globally at `~/.claude/` are not inspectable from this filesystem
  read. Would require direct inspection of
  `~/.claude/plugins/pr-review-toolkit/agents/` or reading the published GitHub
  source.
- **TeammateIdle hook — no local config:** Confirmed absent. The hook exists as
  a recommendation in research docs but has not been implemented. Whether this
  is a deliberate deferral or an oversight is not recorded anywhere in the
  project state files.
- **No SKILL.md model: field in use:** Confirmed. Whether this is because (a)
  developers are unaware of the field, (b) aware of the bug and waiting for the
  fix, or (c) deliberately not using it — is not documented in any accessible
  file.

---

## Serendipity

**CLAUDE.md case mismatch is a minor doc debt item.** The `Explore` (capital E)
reference in CLAUDE.md Section 7 does not match the canonical `name: explore`
(lowercase) in the agent frontmatter. While functionally harmless if runtime
matching is case-insensitive (unconfirmed), it contradicts the docs' own naming
standard ("lowercase letters and hyphens only"). Worth noting as a minor
documentation consistency issue.

**code-simplifier plugin ambiguity.** REQUIRED_PLUGINS.md lists
`code-simplifier@claude-plugins-official` as a separate plugin alongside
`pr-review-toolkit@claude-plugins-official`. CL1's research (sourced from
GitHub) found `code-simplifier.md` as a file inside `pr-review-toolkit/agents/`.
This suggests `code-simplifier` may exist as both a plugin agent within
pr-review-toolkit AND as a standalone plugin offering — or the
REQUIRED_PLUGINS.md listing may be redundant/erroneous. The relationship between
these two is unresolved.

---

## Confidence Assessment

- HIGH claims: 4 (G4-1, G4-3, G4-4, C003 downgrade validation)
- MEDIUM claims: 2 (C014 plugin count, C002 example blocks — correct framing but
  external-only)
- LOW claims: 0
- UNVERIFIED claims: 1 (C014 from local filesystem alone)
- Overall confidence: HIGH for G4 verifications; MEDIUM for CL1 plugin-related
  claims (external source dependency)
