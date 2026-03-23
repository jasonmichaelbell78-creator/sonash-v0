# Error Recovery & Resilience for Deep Research

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-20
**Status:** RESEARCH
**Author:** Claude (research agent, error recovery & resilience task)
<!-- prettier-ignore-end -->

---

## Executive Summary

Research systems are inherently fragile. They depend on external services
(WebSearch, WebFetch), spawn multiple agents that can crash independently, hit
rate limits, overflow context windows, and lose state to compaction. A
deep-research skill that lacks resilience architecture will produce incomplete,
unreliable, or lost work on a routine basis.

**Key principles for building resilient research:**

1. **Assume every external call will fail.** Design the system so that any
   single failure -- WebSearch returning nothing, WebFetch timing out, an agent
   crashing mid-research -- produces degraded output rather than no output.

2. **File-based state is the only reliable persistence.** In-memory state,
   conversation history, and agent context can all be wiped by compaction,
   crashes, or token limits. Only files on disk survive all failure modes.

3. **Checkpoint early, checkpoint often.** Research produces intermediate
   findings that have value even if the full process never completes. Every
   meaningful intermediate result should be persisted to disk before the next
   step begins.

4. **Partial results are acceptable; silent loss is not.** A research document
   that says "investigated 7 of 10 sub-topics; 3 remain unresearched" is far
   more valuable than one that silently omits 3 topics or one that is lost
   entirely because a crash happened before any output was written.

5. **Retry has bounds; fallback has chains.** Every retry must have a maximum
   attempt count. Every fallback must have a next-in-chain. The terminal
   fallback is always: flag the gap, present what you have, ask the user.

6. **Agent failures are expected, not exceptional.** In a multi-agent system
   with 3-4 concurrent searchers, at least one will fail or produce low-quality
   results in ~15-30% of runs. The architecture must handle this without
   requiring manual intervention.

---

## Failure Mode Catalog

### FM-1: WebSearch Returns No Results or Irrelevant Results

| Attribute       | Value                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------- |
| **Probability** | Medium (15-25% of queries, higher for niche/academic topics)                             |
| **Impact**      | Medium -- blocks one sub-query but not entire research                                   |
| **Detection**   | Zero results returned, or results have no topical overlap with query                     |
| **Root causes** | Query too specific/jargon-heavy, topic too niche, search API issues, query syntax errors |

**Current codebase handling:** None. GSD researchers have no fallback for empty
search results. The `gsd-project-researcher` and `gsd-phase-researcher` define a
source hierarchy (Context7 > Official Docs > WebSearch) but no protocol for when
all sources return nothing.

### FM-2: WebFetch Fails (Paywall, 403, Timeout, CAPTCHA)

| Attribute       | Value                                                                                 |
| --------------- | ------------------------------------------------------------------------------------- |
| **Probability** | Medium-High (20-40% of URLs, especially for academic sources)                         |
| **Impact**      | Low-Medium -- one source inaccessible, others may cover the gap                       |
| **Detection**   | HTTP error codes (403, 429, 503), timeout, CAPTCHA page content                       |
| **Root causes** | Paywalled content, bot detection, server overload, geographic restrictions, site down |

**Current codebase handling:** None explicit. The GSD researchers mention
WebFetch for official docs but have no error handling protocol when fetches
fail.

### FM-3: Agent Crash Mid-Research

| Attribute       | Value                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| **Probability** | Low-Medium (5-15% per agent, higher with complex queries)                     |
| **Impact**      | High -- one research stream's findings are lost unless checkpointed           |
| **Detection**   | Agent returns error or timeout; no structured return received by orchestrator |
| **Root causes** | Token limit exhaustion, internal error, infinite loop, excessive tool calls   |

**Current codebase handling:** `AGENT_ORCHESTRATION.md` has basic escalation:
"Agent exceeds 30 min -> Resume next session. Agent returns errors -> Log,
defer, notify." No specific research recovery protocol. The
`pre-compaction-save.js` hook captures task states including active agents, but
this only helps with compaction, not agent crashes.

### FM-4: Rate Limiting (Search API, Model API)

| Attribute       | Value                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------- |
| **Probability** | Medium (10-20% in parallel research with 3-4 agents hitting search concurrently)               |
| **Impact**      | Medium -- delays research but doesn't prevent it if handled correctly                          |
| **Detection**   | HTTP 429 responses, explicit rate limit messages in API responses                              |
| **Root causes** | Multiple agents querying concurrently, burst of searches in short window, API quota exhaustion |

**Current codebase handling:** CLAUDE.md Section 2.3 mentions "Rate Limiting --
handle 429 errors gracefully (use sonner toasts)" but this is for the frontend
app, not for research agents. No research-specific rate limit handling exists.

### FM-5: Context Window Overflow

| Attribute       | Value                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Probability** | Medium-High (20-35% for deep research on broad topics)                                                                |
| **Impact**      | High -- agent loses ability to reason coherently about accumulated findings                                           |
| **Detection**   | Agent starts dropping context, producing repetitive or contradictory output, internal token counter approaching limit |
| **Root causes** | Too many search results loaded, too many web pages fetched, too many findings accumulated without summarization       |

**Current codebase handling:** The codebase has a 4-layer compaction resilience
system (`CONTEXT_PRESERVATION.md`) including pre-compaction state save,
compact-restore, commit logging, and gap detection. However, these all operate
at the session level. Individual research agents have no context overflow
protection.

**Research finding:** A memory pointer architecture can reduce token usage by
approximately 7x by storing large data outside the context and referencing it
with short identifiers. Observation masking keeping the latest 10 turns provides
optimal balance between performance and efficiency. Multi-layer defense systems
(like OpenClaw's 4-layer approach) combine pruning, summarization, compaction,
and hard limits.

### FM-6: Compaction Wipes Agent Context Mid-Research

| Attribute       | Value                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Probability** | Medium (10-20% for research sessions lasting 30+ minutes)                                             |
| **Impact**      | Critical -- orchestrator loses track of which agents are running, what's been found, and what remains |
| **Detection**   | Post-compaction recovery hook fires, `compact-restore.js` outputs recovery context                    |
| **Root causes** | Long-running research sessions, large context accumulation, manual compaction trigger                 |

**Current codebase handling:** Strong. The codebase has the most mature
compaction handling of any failure mode:

- `pre-compaction-save.js` captures full session state to `handoff.json`
- `compact-restore.js` restores context after compaction with task states,
  commits, git status, active plans, session notes, and active audits
- `deep-plan` has topic-specific state files
  (`.claude/state/deep-plan.<topic>.state.json`) that survive compaction
- Task state files (`task-*.state.json`) persist step-by-step progress

### FM-7: MCP Server Disconnection

| Attribute       | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| **Probability** | Low (5-10%, varies by MCP server stability)                    |
| **Impact**      | Medium -- loses access to Context7, memory, or SonarCloud data |
| **Detection**   | MCP tool calls return connection errors                        |
| **Root causes** | MCP server process crash, timeout, resource exhaustion         |

**Current codebase handling:** `check-mcp-servers.js` hook exists but only
checks at session start. No mid-session MCP recovery protocol.

### FM-8: Network Failures During Web Access

| Attribute       | Value                                                               |
| --------------- | ------------------------------------------------------------------- |
| **Probability** | Low (3-8%)                                                          |
| **Impact**      | High -- blocks all external research until connectivity is restored |
| **Detection**   | All WebSearch/WebFetch calls fail with network errors               |
| **Root causes** | Internet connectivity loss, DNS resolution failure, proxy issues    |

**Current codebase handling:** None. No distinction between "source doesn't
exist" and "network is down."

### FM-9: Search Returns Outdated or Incorrect Information

| Attribute       | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| **Probability** | Medium (10-20%, higher for fast-moving technology topics)                          |
| **Impact**      | Medium-High -- incorrect findings propagate through synthesis if undetected        |
| **Detection**   | Temporal mismatch (old dates on sources), contradictions with other sources        |
| **Root causes** | Search index lag, outdated cached pages, SEO spam outranking authoritative sources |

**Current codebase handling:** GSD researchers have a verification protocol that
checks source authority and cross-references, but no explicit temporal
validation step.

### FM-10: Budget/Token Exhaustion Before Research Completes

| Attribute       | Value                                                                             |
| --------------- | --------------------------------------------------------------------------------- |
| **Probability** | Medium (15-25% for deep research with many sub-queries)                           |
| **Impact**      | High -- research is incomplete; findings for unresearched sub-queries are missing |
| **Detection**   | Token usage approaching session limit, agent team budget approaching cap          |
| **Root causes** | Too many sub-queries, too many search iterations, inefficient context usage       |

**Current codebase handling:** `AGENT_ORCHESTRATION.md` defines team token
budgets (Exploration: 100K, Audit: 250K) and instructs: "If a team approaches
its token budget, the lead should: 1) Message teammates to wrap up current
work, 2) Collect partial results, 3) Shut down teammates, 4) Continue as single
agent with collected context." This pattern directly applies to research agents.

---

## Current Resilience Infrastructure

### What the Codebase Already Provides

#### 1. Compaction Resilience (4-Layer System)

The strongest resilience feature in the codebase. Defined in
`docs/agent_docs/CONTEXT_PRESERVATION.md` and implemented in `.claude/hooks/`:

| Layer         | Hook                     | What it does                                                            |
| ------------- | ------------------------ | ----------------------------------------------------------------------- |
| A: Commit Log | `commit-tracker.js`      | Appends every commit to `commit-log.jsonl` (survives all failure modes) |
| C: PreCompact | `pre-compaction-save.js` | Full state snapshot to `handoff.json` at compaction time                |
| Restore       | `compact-restore.js`     | Outputs structured recovery context after compaction                    |
| D: Gap Detect | `check-session-gaps.js`  | Detects missing sessions at next session start                          |

**Relevance to deep-research:** The compaction system is directly reusable. The
deep-research skill should write its research state to a topic-specific state
file (e.g., `deep-research.<topic>.state.json`) following the `deep-plan`
pattern, so the compaction hooks automatically capture and restore it.

#### 2. File-Based State Persistence

Pattern from `CONTEXT_PRESERVATION.md`: "For any multi-step task (3+ steps),
write progress to `.claude/state/task-{name}.state.json`." The state file format
includes task name, timestamps, step status (completed/in_progress/pending), and
context notes.

**Examples in current codebase:** 67+ state files exist in `.claude/state/`
including task states, deep-plan states, PR review states, audit histories, and
logging files.

**Relevance to deep-research:** The state file pattern is proven and well-
supported. Research agents should write findings to files immediately (not hold
them in context), and the orchestrator should track which sub-queries are
complete/in-progress/pending in a state file.

#### 3. Structured Returns from Agents

All GSD agents use structured return formats (`## RESEARCH COMPLETE`,
`## VERIFICATION COMPLETE`) that enable orchestrators to parse status. This
convention means the orchestrator can detect whether an agent completed
successfully, completed with issues, or failed.

**Relevance to deep-research:** Searcher agents should return structured status
including findings count, confidence distribution, gaps identified, and any
errors encountered. This enables the orchestrator to distinguish between
"completed successfully," "completed with partial results," and "failed."

#### 4. Agent Orchestration Escalation Triggers

From `AGENT_ORCHESTRATION.md`:

| Situation            | Action              |
| -------------------- | ------------------- |
| Agent exceeds 30 min | Resume next session |
| 3+ file conflicts    | Re-run sequentially |
| Agent returns errors | Log, defer, notify  |

#### 5. Team Budget Monitoring

The team budget system provides a model for resource-bounded research: "If a
team approaches its token budget, the lead should: 1) Message teammates to wrap
up current work, 2) Collect partial results, 3) Shut down teammates, 4) Continue
as single agent with collected context."

### What the Codebase Does NOT Provide

| Gap                                                    | Impact on Deep Research                                      |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| No WebSearch fallback protocol                         | If search returns nothing, agents have no alternative        |
| No WebFetch error handling                             | Paywalled/blocked URLs silently fail                         |
| No rate limit handling for research                    | Concurrent agents may all hit limits simultaneously          |
| No agent crash recovery for research                   | If a searcher crashes, its sub-query findings are lost       |
| No context overflow protection for individual agents   | Agents accumulate context until they fail                    |
| No mid-session MCP recovery                            | Context7 loss is unrecoverable mid-session                   |
| No distinction between "no results" and "network down" | Can't differentiate temporary from permanent failures        |
| No partial result protocol                             | No standard way to present incomplete research               |
| No research-specific checkpoint format                 | General task states don't capture research-specific metadata |

---

## Graceful Degradation Strategies

### Strategy GD-1: Search Failure Cascade

When WebSearch returns no results for a sub-query:

```
Attempt 1: Original query
  |--- fail ---> Attempt 2: Simplified/broadened query
                   |--- fail ---> Attempt 3: Alternative query formulation
                                    |--- fail ---> Fallback: Training data with [UNVERIFIED] flag
                                                     |--- Flag gap in findings
                                                     |--- Log: "No web sources found for: <query>"
```

**Query reformulation strategies:**

- Remove jargon: "Bayesian confidence propagation" -> "combining evidence from
  multiple sources probability"
- Broaden scope: "LangGraph checkpoint DynamoDB" -> "LLM agent state persistence
  database"
- Add context: "circuit breaker AI" -> "circuit breaker pattern AI agent failure
  2025"
- Try synonyms: "graceful degradation" -> "fault tolerance" -> "failure
  recovery"

**Maximum attempts:** 3 reformulations per sub-query. After 3 failures, fall
back to training data with explicit `[UNVERIFIED]` markers.

### Strategy GD-2: WebFetch Failure Handling

When a specific URL is inaccessible:

```
Attempt 1: Direct fetch
  |--- 403/paywall ---> Try cached/archive version (Wayback Machine URL)
  |--- timeout -------> Retry once with longer timeout
  |--- CAPTCHA -------> Skip, log as inaccessible
  |--- other error ---> Skip, log error type

After skip:
  |--- Search for alternative source covering same content
  |--- If no alternative: Reduce confidence of claims that depended on this source
  |--- Log: "Source inaccessible: <url> (<error>). Claims based on this source
             are downgraded to [PARTIALLY VERIFIED]"
```

### Strategy GD-3: Agent Crash Recovery

When a searcher agent crashes or times out:

```
1. Check: Did the agent write any FINDINGS.md file before crashing?
   |--- Yes ---> Use partial findings, flag as INCOMPLETE
   |--- No ----> Sub-query has zero findings

2. Assess criticality of the lost sub-query:
   |--- Critical (core to research question) ---> Respawn agent for that sub-query
   |--- Important (adds depth) ----------------> Add to "gaps" in synthesis
   |--- Nice-to-have (peripheral) -------------> Note in synthesis, move on

3. Respawn rules:
   - Maximum 1 respawn per sub-query (prevent infinite retry loops)
   - Respawned agent gets simplified scope (fewer sources, lower depth)
   - If respawn also fails: flag as unresearched gap
```

### Strategy GD-4: Rate Limit Handling

```
On HTTP 429 or rate limit signal:
  1. Parse retry-after header if present
  2. Apply exponential backoff: 2s, 4s, 8s, 16s (max 30s)
  3. Add jitter: random 0-25% of backoff time
  4. Maximum 4 retries per call
  5. After max retries: skip this search, log, flag gap

For concurrent agents hitting limits:
  - Orchestrator should stagger agent launches (2-3s between spawns)
  - Agents should add random initial delay (0-5s) before first search
  - If rate limiting is detected across multiple agents: reduce
    parallelism (drop from 4 agents to 2)
```

### Strategy GD-5: Budget Exhaustion

```
At 70% budget consumed:
  - Signal: "Research at 70% budget. N of M sub-queries complete."
  - Action: Prioritize remaining sub-queries by importance
  - Reduce depth on remaining queries (fewer sources per query)

At 85% budget consumed:
  - Signal: "Approaching budget limit. Wrapping up."
  - Action: Stop spawning new agents
  - Tell active agents to write current findings and terminate
  - Begin synthesis with whatever findings exist

At 95% budget consumed:
  - Signal: "Budget critical. Synthesizing available results."
  - Action: Write synthesis from available findings
  - Skip verification pass
  - Flag output as BUDGET-LIMITED with completeness assessment
```

### Strategy GD-6: Context Overflow in Individual Agents

```
Prevention:
  - Write findings to disk after each search cycle (don't accumulate in context)
  - Summarize web page content before storing (don't hold full page text)
  - Keep running token estimate; reduce search depth when approaching 60% capacity

Recovery:
  - If agent detects context pressure: write all current findings to disk,
    return structured result with what was found
  - Orchestrator treats this as a successful-but-partial completion
```

### Strategy GD-7: Network Failure

```
Detection: 3+ consecutive WebSearch/WebFetch calls fail with network errors
  (not 403/404, but connection refused/timeout/DNS failure)

Response:
  1. Flag: "Network connectivity issue detected"
  2. Pause all web-dependent research (don't waste retries)
  3. Continue with codebase-only research if applicable
  4. After 30s: retry one WebSearch to test connectivity
  5. If restored: resume normal research
  6. If still down: present codebase findings + training data with
     [UNVERIFIED - WEB UNAVAILABLE] flags
```

---

## Checkpoint & Resume Architecture

### What to Checkpoint

Research state for the deep-research skill should be persisted in
`.claude/state/deep-research.<topic-slug>.state.json`:

```json
{
  "task": "Deep Research: <topic>",
  "topic": "<topic-slug>",
  "status": "phase_1_research | phase_2_synthesis | phase_3_verification | complete",
  "started": "ISO datetime",
  "lastUpdated": "ISO datetime",
  "research_plan": {
    "question": "Original research question",
    "sub_queries": [
      {
        "id": "sq-1",
        "query": "Sub-query text",
        "status": "pending | in_progress | complete | failed | partial",
        "agent_id": "agent identifier if spawned",
        "findings_file": "path to FINDINGS.md if written",
        "attempt_count": 0,
        "error": "error message if failed",
        "confidence": "HIGH | MEDIUM | LOW | UNVERIFIED"
      }
    ],
    "total_sub_queries": 8,
    "completed_sub_queries": 5,
    "failed_sub_queries": 1
  },
  "findings_summary": {
    "total_findings": 24,
    "by_confidence": { "HIGH": 8, "MEDIUM": 12, "LOW": 3, "UNVERIFIED": 1 },
    "gaps": ["Sub-query 6 failed - no findings on X"],
    "contradictions": ["Sources disagree on Y"]
  },
  "synthesis": {
    "status": "not_started | in_progress | complete",
    "file": "path to SYNTHESIS.md if written"
  },
  "errors": [
    {
      "timestamp": "ISO datetime",
      "type": "search_empty | fetch_failed | agent_crash | rate_limit | network",
      "detail": "Human-readable description",
      "resolution": "retried | reformulated | skipped | fallback"
    }
  ],
  "budget": {
    "agents_spawned": 3,
    "searches_performed": 15,
    "pages_fetched": 8,
    "estimated_tokens_used": 45000
  }
}
```

### When to Checkpoint

| Event                                           | Action                   |
| ----------------------------------------------- | ------------------------ |
| Research plan created (sub-queries defined)     | Write initial state file |
| Each agent completes or fails                   | Update sub-query status  |
| After each batch of findings is written to disk | Update findings summary  |
| Synthesis begins                                | Update synthesis status  |
| Any error occurs                                | Append to errors array   |
| Research completes                              | Set status to "complete" |

**Checkpoint frequency rule:** After every state-changing event. File-based
JSONL writes are cheap; losing state to a crash is expensive. Research on AI
agent checkpointing shows that with long-running tasks failing up to 30% of the
time, proper checkpointing can save over 60% of wasted processing.

### Resume Protocol After Crash/Compaction

```
On resume (invoked via /deep-research <same-topic>):

1. Look for .claude/state/deep-research.<topic-slug>.state.json
   |--- Not found ---> Start fresh research
   |--- Found -------> Read state, determine resume point

2. Check status field:
   |--- "phase_1_research" --->
   |      Check sub_queries: which are complete? which are pending/failed?
   |      Re-spawn agents only for pending/failed sub-queries
   |      Do NOT re-run completed sub-queries (idempotent resume)
   |
   |--- "phase_2_synthesis" --->
   |      Check if SYNTHESIS.md exists on disk
   |      If exists: skip to verification
   |      If not: re-read all FINDINGS.md files, spawn synthesizer
   |
   |--- "phase_3_verification" --->
   |      Run verification on existing synthesis
   |
   |--- "complete" --->
          Research already done. Present existing results.

3. Verify findings files exist on disk:
   For each sub-query marked "complete":
     - Check if findings_file exists and is non-empty
     - If file missing: downgrade status to "failed" and queue for re-research
     - This catches cases where state says "complete" but files were lost
```

### Idempotent Research Operations

Research operations must be safe to re-run:

| Operation                  | Idempotency Strategy                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Web search for a sub-query | Same query returns same results (modulo time). Safe to re-run. Mark findings with search timestamp to detect duplicates. |
| Writing findings file      | Overwrite mode (not append). Re-running writes a fresh file.                                                             |
| Synthesis                  | Reads all findings files and produces fresh synthesis. Safe to re-run.                                                   |
| State file update          | Atomic write (write to temp file, rename). Prevents partial writes.                                                      |

**Key principle:** A completed sub-query's findings are stored in a file. The
state file records which sub-queries are complete. On resume, only incomplete
sub-queries are re-run. This means re-running the research flow with the same
topic is always safe -- it never duplicates work for completed sub-queries.

---

## Partial Result Protocol

### Completeness Assessment

Every research output must include a completeness assessment in its header:

```markdown
## Research Completeness

| Metric                          | Value               |
| ------------------------------- | ------------------- |
| Sub-topics researched           | 7 of 10             |
| Findings with HIGH confidence   | 8 of 24 (33%)       |
| Findings with MEDIUM confidence | 12 of 24 (50%)      |
| Findings with LOW confidence    | 3 of 24 (13%)       |
| Unverified claims               | 1 of 24 (4%)        |
| Known gaps                      | 3 (listed below)    |
| Budget status                   | 85% consumed        |
| Research terminated early?      | Yes -- budget limit |

### Known Gaps

1. **Sub-topic X:** Agent crashed; no findings recovered. Impact: [assessment]
2. **Sub-topic Y:** All sources paywalled; only abstract-level information
   available. Impact: [assessment]
3. **Sub-topic Z:** Not researched due to budget exhaustion. Impact:
   [assessment]
```

### Gap Highlighting

Every gap must include:

1. **What is missing:** Specific sub-topic or question that was not answered
2. **Why it is missing:** The failure mode that caused the gap (crash, paywall,
   no results, budget, network)
3. **Impact assessment:** How much this gap affects the overall research quality
   (critical / moderate / minor)
4. **Remediation path:** What the user could do to fill the gap (re-run with
   more budget, try different search terms, consult domain expert)

### Confidence Downgrading for Incomplete Research

When research is incomplete, the overall confidence of the synthesis must be
adjusted:

| Completeness                       | Max Overall Confidence | Flag                                    |
| ---------------------------------- | ---------------------- | --------------------------------------- |
| 90-100% of sub-topics researched   | HIGH                   | None                                    |
| 70-89% of sub-topics researched    | MEDIUM                 | "Some areas not fully researched"       |
| 50-69% of sub-topics researched    | LOW                    | "Significant gaps in research coverage" |
| Below 50% of sub-topics researched | UNVERIFIED             | "Research substantially incomplete"     |

**Individual finding confidence is never upgraded due to incomplete research.**
If a finding was LOW confidence, it stays LOW regardless of how much other
research was completed. Completeness affects only the synthesis-level confidence
assessment.

### User Decision Points

When research is incomplete, the system must present the user with explicit
options rather than silently accepting partial results:

```
Research Status: 7 of 10 sub-topics complete (70%)
3 gaps identified (see above)

Options:
  A) Accept current results (MEDIUM overall confidence)
  B) Continue research on remaining 3 sub-topics (estimated: 15 min, ~30K tokens)
  C) Continue research on critical gaps only (sub-topic X) (estimated: 5 min)
  D) Accept results and manually research gaps
```

This follows the codebase's behavioral guardrail #6: "All passive surfacing must
force acknowledgment." Unacknowledged gaps become wallpaper.

---

## Retry & Fallback Patterns

### Retry Strategy: Exponential Backoff with Jitter

```
Base delay:    2 seconds
Multiplier:    2x per attempt
Max delay:     30 seconds
Max attempts:  4
Jitter:        Random 0-25% of calculated delay

Attempt 1: 2s + jitter
Attempt 2: 4s + jitter
Attempt 3: 8s + jitter
Attempt 4: 16s + jitter (capped at 30s)
```

**When to apply:**

- HTTP 429 (rate limited): Always retry with backoff
- HTTP 500-503 (server error): Retry up to 2 times
- Timeout: Retry once with 2x timeout
- Network error: Retry once, then flag as network failure (FM-8)

**When NOT to retry:**

- HTTP 403 (forbidden): No retry. Source is blocked.
- HTTP 404 (not found): No retry. Source doesn't exist.
- CAPTCHA: No retry. Source requires human interaction.
- Validation error: No retry. Fix the query instead.

### Fallback Chains

#### For WebSearch:

```
Chain 1: Primary search query
  -> Chain 2: Simplified query (remove jargon)
    -> Chain 3: Broadened query (more general terms)
      -> Chain 4: Alternative framing (different angle on same topic)
        -> Terminal: Use training data with [UNVERIFIED] flag
```

#### For WebFetch:

```
Chain 1: Direct URL fetch
  -> Chain 2: Wayback Machine / cached version
    -> Chain 3: Search for alternative source with same content
      -> Terminal: Reduce confidence; note source was inaccessible
```

#### For Context7 (MCP):

```
Chain 1: Context7 library resolution + doc query
  -> Chain 2: WebSearch for official documentation
    -> Chain 3: WebFetch of known documentation URL
      -> Terminal: Use training data with version-specific caveat
```

### Maximum Retry Bounds

| Resource    | Max Retries                                      | Max Total Time | After Exhaustion                |
| ----------- | ------------------------------------------------ | -------------- | ------------------------------- |
| WebSearch   | 3 reformulations + 4 retries each = 12 max calls | 2 minutes      | Flag gap, use training data     |
| WebFetch    | 1 retry + 2 alternative sources = 3 max calls    | 1 minute       | Reduce confidence, skip source  |
| Context7    | 2 retries                                        | 30 seconds     | Fall back to WebSearch chain    |
| Agent spawn | 1 respawn                                        | 5 minutes      | Use partial results or flag gap |

### Anti-Infinite-Loop Safeguards

1. **Global search counter:** Track total searches across all agents. Hard limit
   of 50 searches per research session. After 50, no more WebSearch calls --
   synthesize what exists.

2. **Per-query attempt counter:** Maximum 4 search attempts per sub-query
   (including reformulations). After 4, the sub-query is flagged as
   unresearched.

3. **Diminishing returns detector:** If 3 consecutive searches for the same
   sub-query return overlapping results (>80% URL overlap), stop searching --
   the available information has been exhausted.

4. **Time budget per sub-query:** Maximum 5 minutes per sub-query including all
   retries and fallbacks. After 5 minutes, write whatever was found and move on.

---

## Multi-Agent Fault Tolerance

### Failure Detection

The orchestrator (SKILL.md) must detect agent failures through structured
returns:

| Signal                                                 | Meaning             | Response                                |
| ------------------------------------------------------ | ------------------- | --------------------------------------- |
| Agent returns `## RESEARCH COMPLETE` with findings     | Success             | Proceed normally                        |
| Agent returns `## RESEARCH COMPLETE` with partial flag | Partial success     | Accept findings, note gaps              |
| Agent returns error                                    | Agent-level failure | Check for partial findings file on disk |
| Agent times out (no response within limit)             | Agent crash or hang | Check for partial findings file on disk |
| Agent returns but findings file is empty/corrupt       | Silent failure      | Treat as failure, flag gap              |

### What Happens When One Agent Fails

Based on research into multi-agent system resilience (Byzantine fault tolerance,
failure attribution, and swarm resilience patterns):

```
Agent failure detected:
  |
  |--- Check: Did agent write any findings to disk?
  |     |--- Yes (partial findings exist) --->
  |     |     1. Read partial findings
  |     |     2. Mark sub-query as "partial"
  |     |     3. Note which aspects are missing
  |     |     4. Include partial findings in synthesis with reduced confidence
  |     |
  |     |--- No (nothing on disk) --->
  |           1. Mark sub-query as "failed"
  |           2. Assess criticality (see below)
  |
  |--- Assess criticality:
        |--- Critical sub-query --->
        |     Respawn ONE replacement agent with simplified scope
        |     If replacement also fails: accept gap, flag in synthesis
        |
        |--- Non-critical sub-query --->
              Accept gap, note in synthesis
              Do NOT respawn (cost/time not justified)
```

### Quarantining Bad Results

An agent may complete but produce low-quality results. Detection signals:

1. **Zero citations:** Findings contain claims with no source references
2. **All sources from same domain:** Suggests single-source reliance
3. **Confidence levels inconsistent with evidence:** Claims HIGH confidence with
   only 1 source
4. **Internal contradictions:** Findings contradict themselves
5. **Fabrication indicators:** URLs that return 404 (citation doesn't exist)

**Quarantine protocol:**

- Flag the findings as QUARANTINED
- Do not include quarantined findings in synthesis
- Log the quality issue for the research session report
- If the sub-query is critical: respawn with explicit instruction to verify all
  citations

### Reassignment vs. Gap Acceptance

| Scenario                                       | Action                                     | Rationale                                          |
| ---------------------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| Critical sub-query fails, budget available     | Reassign to new agent                      | Core research question depends on this             |
| Non-critical sub-query fails, budget available | Accept gap                                 | Cost of respawn exceeds value of marginal findings |
| Any sub-query fails, budget exhausted          | Accept gap                                 | No resources to retry                              |
| Agent produces quarantined results             | Reassign if critical, accept gap otherwise | Bad data is worse than no data                     |

### Hierarchical Resilience (Informed by Research)

Research on multi-agent system reliability shows that hierarchical structures
exhibit superior resilience, with the lowest performance drop (5.5%) compared to
flat structures. The recommended deep-research architecture is inherently
hierarchical:

```
SKILL.md (orchestrator) -- survives agent failures via state file
  |
  |-- Searcher Agent 1 (independent, writes to disk)
  |-- Searcher Agent 2 (independent, writes to disk)
  |-- Searcher Agent 3 (independent, writes to disk)
  |
  |-- Synthesizer Agent (reads from disk, independent of searchers)
```

Each agent is independent: failure of Agent 1 does not affect Agent 2 or 3. The
orchestrator coordinates through files on disk, not through shared context. This
means:

- If a searcher fails, other searchers continue unaffected
- If the orchestrator compacts, it can resume from the state file
- If the synthesizer fails, it can be re-spawned (findings files still exist)
- The only catastrophic failure is losing the filesystem itself

---

## Design Recommendations

### R1: Research State File as First-Class Artifact

Create `.claude/state/deep-research.<topic>.state.json` at research plan
creation time. Update after every state change. Follow the `deep-plan` pattern
for topic-slug naming and per-topic isolation.

The state file schema should include: research plan with sub-queries and their
statuses, findings summary with confidence distribution, error log, budget
tracking, and synthesis status. See the Checkpoint & Resume Architecture section
for the full schema.

### R2: Write-to-Disk-First Research Pattern

Every searcher agent must write its findings to a file in
`.planning/<topic>/research/<sub-query>-FINDINGS.md` before returning to the
orchestrator. The file IS the result, not the return value. This ensures
findings survive agent crashes, compaction, and context overflow.

**Anti-pattern:** Accumulating findings in agent context and only writing at the
end. This is the single most common cause of research loss.

### R3: Structured Error Handling in Searcher Agents

Searcher agents should implement this error handling hierarchy:

```
try_search(query):
  result = WebSearch(query)
  if no_results:
    result = WebSearch(simplify(query))       // Reformulation
    if no_results:
      result = WebSearch(broaden(query))      // Broader scope
      if no_results:
        return { status: "no_results", fallback: "training_data", confidence: "UNVERIFIED" }

  for url in result.urls:
    try_fetch(url):
      content = WebFetch(url)
      if error:
        log_error(url, error)
        continue                              // Skip this source, try next
      findings.append(extract(content))

  if findings.length == 0:
    return { status: "no_usable_sources", confidence: "UNVERIFIED" }

  write_to_disk(findings)
  return { status: "complete", confidence: assess(findings) }
```

### R4: Circuit Breaker for External Services

Implement a circuit breaker pattern for WebSearch and WebFetch. If more than 3
consecutive calls to the same service fail (across all agents), trip the
circuit:

```
CLOSED (normal):   All calls pass through
  |--- 3+ consecutive failures --->
OPEN (tripped):    No calls pass through; immediate fallback for 30 seconds
  |--- 30 seconds elapsed --->
HALF-OPEN (probe): Allow 1 call through to test
  |--- success ---> CLOSED
  |--- failure ---> OPEN (reset 30s timer)
```

This prevents wasting retries and tokens when an external service is down. The
orchestrator should maintain circuit state and share it with agents through a
file-based signal (e.g., `.claude/tmp/circuit-state.json`).

### R5: Progressive Output Architecture

Research should produce usable output at every stage, not just at completion:

| Stage                 | Output Available                  | Quality                     |
| --------------------- | --------------------------------- | --------------------------- |
| Plan created          | Sub-queries and research strategy | Metadata only               |
| 1 agent completes     | Findings for 1 sub-query          | Partial, single-perspective |
| 50% agents complete   | Multi-perspective findings        | Partial, improving          |
| All agents complete   | Full findings set                 | Complete, pre-synthesis     |
| Synthesis complete    | Coherent research document        | Full quality                |
| Verification complete | Verified research document        | Highest quality             |

At any interruption point, the best available output can be presented. This is
the key principle from progressive rendering applied to research: every
intermediate state has user value.

### R6: Compaction-Aware Research Orchestration

The orchestrator should:

1. Write state after every agent completion (not just at the end)
2. Include a `resume_point` field in the state file that says exactly where to
   pick up (e.g., "Phase 1: 3 of 5 searchers complete, spawn 2 more")
3. When resumed after compaction, read the state file and skip completed work
4. Never re-run a completed sub-query unless its findings file is missing

### R7: Failure Budget per Research Session

Define a failure budget: the maximum number of failures the system will tolerate
before triggering graceful termination:

| Failure Type            | Budget         | After Exhaustion                           |
| ----------------------- | -------------- | ------------------------------------------ |
| WebSearch empty results | 5 per session  | Switch to training-data-only mode          |
| WebFetch errors         | 10 per session | Stop fetching, use search snippets only    |
| Agent crashes           | 2 per session  | Stop spawning agents, synthesize available |
| Rate limit hits         | 8 per session  | Reduce parallelism to 1 agent              |

When ANY failure budget is exhausted, log the event, notify the user, and shift
to degraded mode rather than continuing to fail.

### R8: Post-Research Error Report

Every research session should produce a brief error report alongside its
findings:

```markdown
## Research Session Report

- **Duration:** 12 minutes
- **Agents spawned:** 4 (3 completed, 1 crashed)
- **Searches performed:** 23 of 50 budget
- **Pages fetched:** 11 (3 failed: 2 paywalled, 1 timeout)
- **Rate limits hit:** 2 (resolved with backoff)
- **Findings produced:** 18 (HIGH: 6, MEDIUM: 9, LOW: 2, UNVERIFIED: 1)
- **Gaps:** 1 sub-query unresearched (agent crash, non-critical)
- **Quarantined findings:** 0
```

This enables the user to assess research quality at a glance and informs future
research sessions (e.g., "this topic needs more budget" or "this search approach
has high failure rates").

---

## Sources

### Graceful Degradation & Failure Modes

- [FAILURE.md -- AI Agent Failure Mode Protocol](https://failure.md/)
- [FAILSAFE.md -- The AI Agent Safe Fallback Standard](https://failsafe.md/)
- [COLLAPSE.md -- AI Agent Context Collapse Prevention](https://collapse.md/)
- [Building AI That Never Goes Down: The Graceful Degradation Playbook (MOTA AI)](https://medium.com/@mota_ai/building-ai-that-never-goes-down-the-graceful-degradation-playbook-d7428dc34ca3)
- [Graceful Degradation Patterns (PraisonAI Documentation)](https://docs.praison.ai/docs/best-practices/graceful-degradation)
- [Building Reliable AI Agents: Patterns for Error Handling and Recovery](https://magicfactory.tech/artificial-intelligence-developers-error-handling-guide/)
- [When AI Breaks: Building Degradation Strategies (ItSoli)](https://itsoli.ai/when-ai-breaks-building-degradation-strategies-for-mission-critical-systems/)
- [Error Recovery and Fallback Strategies in AI Agent Development (GoCodeo)](https://www.gocodeo.com/post/error-recovery-and-fallback-strategies-in-ai-agent-development)

### Checkpoint & Resume

- [AI Agent State Checkpointing: A Practical Guide (Fast.io)](https://fast.io/resources/ai-agent-state-checkpointing/)
- [Build Durable AI Agents with LangGraph and Amazon DynamoDB (AWS)](https://aws.amazon.com/blogs/database/build-durable-ai-agents-with-langgraph-and-amazon-dynamodb/)
- [Bulletproof Agents with Durable Task Extension (Microsoft)](https://techcommunity.microsoft.com/blog/appsonazureblog/bulletproof-agents-with-the-durable-task-extension-for-microsoft-agent-framework/4467122)
- [Checkpointing Strategies for AI Systems (Resumable Agents)](https://medium.com/@arajsinha.ars/checkpointing-strategies-for-ai-systems-that-wont-blow-up-later-resumable-agents-part-4-d7a0688e6939)
- [CONTINUITY: Session State Persistence for AI Systems (GitHub)](https://github.com/duke-of-beans/CONTINUITY)
- [Debugging Non-Deterministic LLM Agents: Checkpoint-Based State Replay](https://dev.to/sreeni5018/debugging-non-deterministic-llm-agents-implementing-checkpoint-based-state-replay-with-langgraph-5171)

### Multi-Agent Fault Tolerance

- [Rethinking Reliability of Multi-agent Systems: Byzantine Fault Tolerance (arxiv)](https://arxiv.org/abs/2511.10400)
- [Reliable Decision-Making for Multi-Agent LLM Systems](https://multiagents.org/2025_artifacts/reliable_decision_making_for_multi_agent_llm_systems.pdf)
- [Which Agent Causes Task Failures and When? (ICML 2025)](https://github.com/mingyin1/Agents_Failure_Attribution)
- [Multi-Agent AI Failure Recovery That Actually Works (Galileo)](https://galileo.ai/blog/multi-agent-ai-system-failure-recovery)
- [On the Resilience of LLM-Based Multi-Agent Collaboration (OpenReview)](https://openreview.net/forum?id=bkiM54QftZ)
- [ALAS: A Stateful Multi-LLM Agent Framework for Disruption (arxiv)](https://arxiv.org/pdf/2505.12501)
- [Towards a Science of AI Agent Reliability (arxiv)](https://arxiv.org/html/2602.16666v1)
- [Understanding and Mitigating Failure Modes in Multi-Agent Systems (MarkTechPost)](https://www.marktechpost.com/2025/03/25/understanding-and-mitigating-failure-modes-in-llm-based-multi-agent-systems/)

### Rate Limiting & Retry Patterns

- [How to Handle Rate Limits (OpenAI Cookbook)](https://cookbook.openai.com/examples/how_to_handle_rate_limits)
- [AI Agent Rate Limiting Strategies & Best Practices (Fast.io)](https://fast.io/resources/ai-agent-rate-limiting/)
- [Mastering Exponential Backoff in Distributed Systems (Better Stack)](https://betterstack.com/community/guides/monitoring/exponential-backoff/)
- [Dealing with Rate Limiting Using Exponential Backoff (Substack)](https://substack.thewebscraping.club/p/rate-limit-scraping-exponential-backoff)

### Context Window Management

- [Solving Context Window Overflow in AI Agents (arxiv)](https://arxiv.org/html/2511.22729v1)
- [Smarter Context Management for LLM-Powered Agents (JetBrains Research)](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)
- [Context Window Overflow in 2026: Fix LLM Errors Fast (Redis)](https://redis.io/blog/context-window-overflow/)
- [Top Techniques to Manage Context Length in LLMs (Agenta)](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms)

### Circuit Breaker & Agent Design Patterns

- [8 Foundational AI Agent Design Patterns (Bala's Blog)](https://blog.balakumar.dev/2025/07/28/8-essential-ai-agent-design-patterns-every-developer-should-know/)
- [Algorithmic Circuit Breakers: Preventing Flash Crashes of Logic (Arion Research)](https://www.arionresearch.com/blog/algorithmic-circuit-breakers-preventing-flash-crashes-of-logic-in-autonomous-workflows)
- [How to Set Graceful Degradation Timeouts for AI Agents](https://how2.sh/posts/how-to-build-agent-tool-timeout-envelopes-for-safer-rollouts-for-mission-critical-automations/)

### Budget & Resource Management

- [Adaptive Computational Budgeting for AI Agents (TDCommons)](https://www.tdcommons.org/cgi/viewcontent.cgi?article=9826&context=dpubs_series)
- [The AI Agent Cost Crisis (AICosts.ai)](https://www.aicosts.ai/blog/ai-agent-cost-crisis-budget-disaster-prevention-guide)
- [The Hidden Economics of AI Agents (Stevens Online)](https://online.stevens.edu/blog/hidden-economics-ai-agents-token-costs-latency/)

### Idempotency & Distributed Systems

- [Idempotency in Distributed Systems: Design Patterns (DEV Community)](https://dev.to/aloknecessary/idempotency-in-distributed-systems-design-patterns-beyond-retry-safely-k66)
- [What is Idempotency in Distributed Systems? (AlgoMaster)](https://blog.algomaster.io/p/idempotency-in-distributed-systems)
- [Designing Robust APIs with Idempotency (Stripe)](https://stripe.com/blog/idempotency)

### Codebase-Internal References

- `docs/agent_docs/CONTEXT_PRESERVATION.md` -- 4-layer compaction resilience
- `docs/agent_docs/AGENT_ORCHESTRATION.md` -- agent parallelization, escalation
- `.claude/hooks/pre-compaction-save.js` -- pre-compaction state capture
- `.claude/hooks/compact-restore.js` -- post-compaction context recovery
- `.claude/skills/deep-plan/SKILL.md` -- compaction-resilient state pattern
- `.claude/state/deep-plan.*.state.json` -- topic-specific state file examples
- `.planning/deep-research-skill/research/GAP_ANALYSIS.md` -- current research
  gaps
- `.planning/deep-research-skill/research/SOURCE_VERIFICATION.md` --
  verification patterns
- `.planning/deep-research-skill/research/CUSTOM_AGENT_DESIGN.md` -- agent
  architecture
