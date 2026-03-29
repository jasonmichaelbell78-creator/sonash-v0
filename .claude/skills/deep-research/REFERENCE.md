<!-- prettier-ignore-start -->
**Document Version:** 1.4
**Last Updated:** 2026-03-29
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Deep Research Reference

Output templates, question type classification, source evaluation framework,
prompt templates, schemas, domain modules, and management commands for the
deep-research skill.

---

## Table of Contents

1. [Question Type Classification](#1-question-type-classification)
2. [Depth Level Detail](#2-depth-level-detail)
3. [Source Hierarchy by Domain](#3-source-hierarchy-by-domain)
4. [CRAAP+SIFT Framework](#4-craapsift-framework)
5. [RESEARCH_OUTPUT.md Template](#5-research_outputmd-template)
6. [Interactive Decomposition Protocol](#6-interactive-decomposition-protocol)
7. [Budget Estimation Heuristics](#7-budget-estimation-heuristics)
8. [Contrarian Challenge Prompt Template](#8-contrarian-challenge-prompt-template)
9. [Outside-the-Box Prompt Template](#9-outside-the-box-prompt-template)
10. [Self-Audit Checklist](#10-self-audit-checklist)
11. [Output Format Schemas](#11-output-format-schemas)
12. [Research Index Schema](#12-research-index-schema)
13. [Gemini CLI Cross-Model Verification](#13-gemini-cli-cross-model-verification)
14. [Convergence-Loop Research-Claims Behaviors](#14-convergence-loop-research-claims-behaviors)
15. [Downstream Adapter Contract](#15-downstream-adapter-contract)
16. [Strategy Log Schema](#16-strategy-log-schema)
17. [Source Reputation Schema](#17-source-reputation-schema)
18. [Management Sub-Commands](#18-management-sub-commands)
19. [State File Schema](#19-state-file-schema)
20. [Phase Details (moved from SKILL.md)](#20-phase-details-moved-from-skillmd)
21. [Extracted Phase Detail](#21-extracted-phase-detail)
22. [Gap Pursuit, Verification, and Final Re-Synthesis](#22-gap-pursuit-verification-and-final-re-synthesis)

---

## 1. Question Type Classification

### 8 Question Types

| Type          | Signal Words                           | Decomposition Strategy               | Termination Condition                   |
| ------------- | -------------------------------------- | ------------------------------------ | --------------------------------------- |
| Factual       | "what is", "how many", "when"          | Direct lookup, cross-verify sources  | 2+ sources agree                        |
| Descriptive   | "how does", "explain", "describe"      | Feature survey + working examples    | Mechanism documented with evidence      |
| Comparative   | "vs", "compare", "which is better"     | Matrix + tradeoffs + recommendation  | All criteria evaluated for all options  |
| Evaluative    | "is it good", "should we", "worth it"  | Criteria-based assessment + evidence | Clear recommendation with confidence    |
| Exploratory   | "best practices", "patterns", "how to" | Landscape survey + categorization    | Major approaches covered with tradeoffs |
| Investigative | "why", "root cause", "what happened"   | Hypothesis -> evidence -> conclusion | Root cause identified with evidence     |
| Predictive    | "will", "future", "trend"              | Trend analysis + signals + scenarios | Scenarios documented with likelihoods   |
| Relational    | "interact", "depend", "connect"        | Dependency mapping + interface docs  | All relationships documented            |

### Decomposition Examples

**Factual:** "What is the latest stable version of React?"

- SQ-001: What does the official React repo show as latest release? (docs)
- SQ-002: What do package registries report? (web)

**Comparative:** "Next.js vs Remix for a sobriety tracking app?"

- SQ-001: What are Next.js's strengths for this use case? (docs)
- SQ-002: What are Remix's strengths for this use case? (docs)
- SQ-003: How do they compare on offline support? (web)
- SQ-004: How do they compare on Firebase integration? (web)
- SQ-005: What do teams who've switched report? (web)

**Exploratory:** "Best practices for WebSocket connections in Next.js 16?"

- SQ-001: What does Next.js 16 officially support for WebSockets? (docs)
- SQ-002: What patterns does the community use? (web)
- SQ-003: What are common failure modes? (web)
- SQ-004: How do connection lifecycle and reconnection work? (docs)
- SQ-005: What are the performance implications at scale? (web)

---

## 2. Depth Level Detail

### Summary Table

| Level | Name               | Typical Agents | Search Rounds | Contrarian                       | OTB                 | Self-Audit         |
| ----- | ------------------ | -------------- | ------------- | -------------------------------- | ------------------- | ------------------ |
| L1    | Exhaustive         | 4-5            | 5-8           | 1 agent (CL preset)              | 1 agent (CL preset) | Summary            |
| L2    | Comprehensive      | 3-4            | 3-5           | 1 agent                          | 1 agent             | Summary            |
| L3    | Investigation      | 5-7            | 5-8           | 2 agents (different strategies)  | 2 agents            | Full               |
| L4    | Deep Investigation | 8-10           | 8+            | 3 agents + red team + pre-mortem | 3 agents            | Full + adversarial |

> **Precedence:** The allocation formula `D + 3 + floor(D/5)` determines actual
> agent count. The "Typical Agents" column shows ranges for common sub-question
> counts. When they conflict, the formula wins. L4 additionally uses agent team
> orchestration when sub-questions are interdependent.

### L1: Exhaustive (Default)

- **Agents:** 4-5 searchers
- **Search rounds:** 5-8 per agent (initial + reformulations)
- **Contrarian:** 1 agent using convergence-loop preset
- **OTB:** 1 agent using convergence-loop preset
- **Self-audit:** Summary line ("6/6 passed")
- **When:** Default for all research. Appropriate for most questions.

### L2: Comprehensive

- **Agents:** 3-4 searchers
- **Search rounds:** 3-5 per agent
- **Contrarian:** 1 agent
- **OTB:** 1 agent
- **Self-audit:** Summary line
- **When:** User explicitly requests lighter research via `--depth L2`.

### L3: Investigation

- **Agents:** 5-7 searchers
- **Search rounds:** 5-8 per agent
- **Contrarian:** 2 agents with different adversarial strategies
  - Agent 1: Seek disconfirming evidence from overlooked sources
  - Agent 2: Challenge methodology and reasoning quality
- **OTB:** 2 agents with different lateral strategies
  - Agent 1: Adjacent domain insights and analogies
  - Agent 2: Second-order effects and downstream implications
- **Self-audit:** Full report (all 6 checks with evidence)
- **When:** Multi-domain questions, high-stakes decisions, conflicting sources.

### L4: Deep Investigation

- **Agents:** 8-10 searchers
- **Search rounds:** 8+ per agent
- **Contrarian:** 3 agents + red team pass + pre-mortem
  - Agent 1: Source-level disconfirmation
  - Agent 2: Methodology challenge
  - Agent 3: Assumption audit
  - Red team: Adversarial attack on conclusions
  - Pre-mortem: "This research led to a bad decision -- why?"
- **OTB:** 3 agents with distinct lateral approaches
- **Self-audit:** Full + adversarial (self-audit is itself challenged)
- **When:** Critical architecture decisions, new domain entry,
  regulatory/compliance.

---

## 3. Source Hierarchy by Domain

### Default Priority

| Tier | Source Type                      | Trust Level | Confidence Eligible |
| ---- | -------------------------------- | ----------- | ------------------- |
| 1    | Context7 MCP                     | Highest     | HIGH                |
| 1    | Official docs via WebFetch       | Highest     | HIGH                |
| 2    | WebSearch (verified with Tier 1) | High        | MEDIUM-HIGH         |
| 3    | Community (blog, SO, forums)     | Medium      | MEDIUM              |
| 4    | Training data (Claude's memory)  | Low         | UNVERIFIED          |

### Domain-Specific Overrides

**Technology/Framework:**

- Tier 1: Context7 -> official docs -> GitHub releases/changelogs
- Tier 2: Framework community (Next.js blog, React RFC discussions)
- Tier 3: General tech blogs, conference talks

**Academic/Scientific:**

- Tier 1: Peer-reviewed papers, arxiv preprints
- Tier 2: Survey papers, meta-analyses
- Tier 3: Blog summaries, talks

**Business/Market:**

- Tier 1: Company filings, official announcements
- Tier 2: Industry reports (Gartner, etc.)
- Tier 3: News articles, analyst blogs

### Confidence Assignment Rules

- 2+ independent sources agree -> MEDIUM minimum
- Official/authoritative source confirms -> HIGH eligible
- Training data only -> always UNVERIFIED
- Sources contradict -> MEDIUM at best, surface contradiction
- Single unverified blog post -> LOW

---

## 4. CRAAP+SIFT Framework

Evaluate sources using combined CRAAP + SIFT criteria.

### CRAAP Score (1-5 each)

| Criterion | 5 (Best)                        | 1 (Worst)                         |
| --------- | ------------------------------- | --------------------------------- |
| Currency  | Published within 6 months       | 3+ years old on fast-moving topic |
| Relevance | Directly addresses the question | Tangentially related              |
| Authority | Official maintainer, core team  | Anonymous, no credentials         |
| Accuracy  | Verifiable, cited, reproducible | Unsourced, anecdotal              |
| Purpose   | Inform/educate                  | Sell/persuade                     |

### SIFT Checks

- **Stop:** Don't reflexively share or believe
- **Investigate the source:** Who published this? What's their track record?
- **Find better coverage:** Is this the best source, or is there a more
  authoritative one?
- **Trace claims:** Follow citations upstream to original source

---

## 5. RESEARCH_OUTPUT.md Template

```markdown
# Research Report: [Topic]

**Date:** [ISO 8601] **Depth:** [L1-L4] ([label]) **Question Type:** [type]
**Domain:** [domain] **Overall Confidence:** [HIGH | MEDIUM | LOW]

---

## Executive Summary

[3-5 paragraphs synthesizing all findings. Someone reading only this section
should understand the research conclusions and key recommendations.]

---

## Key Findings

### [Theme 1]

[Finding with inline citations [1][2]. Explain significance and implications.]

**Confidence:** [HIGH | MEDIUM | LOW]

### [Theme 2]

[Finding with inline citations [3]. Note any caveats or limitations.]

**Confidence:** [HIGH | MEDIUM | LOW]

---

## Contradictions & Open Questions

| Claim   | Source A Says  | Source B Says  | Assessment                          |
| ------- | -------------- | -------------- | ----------------------------------- |
| [claim] | [position] [n] | [position] [n] | [which is better supported and why] |

### Unresolved Questions

- [Question that research could not definitively answer]
- [Area where more investigation is needed]

---

## Confidence Assessment

| Category   | Confidence | Evidence Quality               | Notes         |
| ---------- | ---------- | ------------------------------ | ------------- |
| [category] | [level]    | [N sources, tier distribution] | [any caveats] |

---

## Recommendations

1. **[Recommendation]** -- [rationale with citations]
2. **[Recommendation]** -- [rationale with citations]

---

## Unexpected Findings

[High-value findings outside the original research scope -- discoveries made
along the way that are worth noting.]

---

## Challenges

### Contrarian Findings

[Summary of contrarian challenge results -- what was challenged, what held up,
what was weakened. Full details in challenges/CONTRARIAN.md]

### Outside-the-Box Insights

[Summary of OTB findings -- what structured research missed, adjacent domain
insights, second-order effects. Full details in challenges/OUTSIDE_THE_BOX.md]

---

## Sources

### Tier 1 (Authoritative)

| #   | Title   | URL   | Type            | Date   |
| --- | ------- | ----- | --------------- | ------ |
| [1] | [title] | [url] | [official-docs] | [date] |

### Tier 2 (Verified)

| #   | Title | URL | Type | Date |
| --- | ----- | --- | ---- | ---- |

### Tier 3 (Community)

| #   | Title | URL | Type | Date |
| --- | ----- | --- | ---- | ---- |

---

## Methodology

- **Depth:** [L1-L4]
- **Agents:** [N] searchers, 1 synthesizer, [N] challenge agents
- **Search rounds:** [total across all agents]
- **Duration:** [time from start to completion]
- **Self-audit:** [summary line]
```

---

## 6. Interactive Decomposition Protocol

### Level B (Default: 2-3 Rounds)

**Round 1 -- Scope & Boundaries:**

- What specifically do you want to learn about [topic]?
- What's the context -- are you planning to build something, evaluating options,
  or exploring a domain?
- What do you already know? (so we don't re-research known ground)
- Are there specific technologies, constraints, or systems involved?

**Round 2 -- Priorities & Angles:**

- Which aspects matter most -- technical depth, practical patterns, tradeoffs,
  risks?
- Any specific concerns or hypotheses you want tested?
- What would make this research actionable for you?

**Round 3 (if needed) -- Refinement:**

- Based on your answers, I'm planning to investigate [sub-questions]. Any gaps
  or angles I'm missing?

### Level C (Escalated: Deep-Plan-Style)

Use the full deep-plan discovery protocol (batched questions, 5-8 per batch,
inter-batch synthesis, mid-discovery check). Escalate when:

- Question spans 3+ domains
- User explicitly requests exhaustive decomposition
- Initial decomposition reveals 8+ sub-dimensions
- Stakes are high (architectural decisions, technology commitments)

---

## 7. Budget Estimation Heuristics

| Depth | Typical Agents             | Est. Tokens | Est. Cost (Opus) |
| ----- | -------------------------- | ----------- | ---------------- |
| L1    | 4-5 searchers + 3 support  | 200K-400K   | $3-$8            |
| L2    | 3-4 searchers + 3 support  | 150K-300K   | $2-$6            |
| L3    | 5-7 searchers + 5 support  | 400K-700K   | $8-$15           |
| L4    | 8-10 searchers + 8 support | 700K-1.2M   | $15-$30          |

Budget allocation (not a constraint, a guardrail):

- 50% -- search (Phase 1)
- 20% -- verification + challenges (Phases 2.5, 3, 3.5)
- 10% -- synthesis (Phase 2)
- 10% -- gap pursuit + gap verification + final re-synthesis (Phases 3.95-3.97)
- 10% -- overhead (Phases 0, 4, 5)

Gap-pursuit agents add ~15-25% to total agent count when actionable gaps exist.
When no actionable gaps are found, Phases 3.95-3.97 cost near zero (scan only).

| Depth | Gap Agent Cap | Typical Gap Agents | Est. Additional Tokens |
| ----- | ------------- | ------------------ | ---------------------- |
| L1    | 4             | 1-2                | 30K-80K                |
| L2    | 3             | 1-2                | 25K-60K                |
| L3    | 6             | 2-4                | 60K-150K               |
| L4    | 10            | 3-6                | 100K-250K              |

---

## 8. Contrarian Challenge Prompt Template

```
You are a contrarian researcher. Your job is to challenge the findings in this
research report. For each key claim:

1. What evidence would DISPROVE this claim?
2. What alternative explanations exist?
3. What biases might have led to this conclusion?
4. What sources were NOT consulted that might disagree?
5. What would change if the claim's context were different?

Rules:
- Write specific challenges with evidence, not generic skepticism
- Use WebSearch to find disconfirming evidence where possible
- If a claim holds up under challenge, say so -- don't force disagreement
- Rate each claim: CONFIRMED (withstands challenge) | WEAKENED (valid concerns)
  | REFUTED (disconfirming evidence found)

Input: [RESEARCH_OUTPUT.md content]

Write your challenges to: .research/<topic>/challenges/CONTRARIAN.md
```

---

## 9. Outside-the-Box Prompt Template

```
You are a lateral thinker. The structured research has answered the questions
it asked. Your job is to find what it DIDN'T ask:

1. What adjacent domains have relevant insights that weren't consulted?
2. What analogies from other fields illuminate this problem?
3. What second-order effects were not considered?
4. What would a complete non-expert notice that experts miss?
5. What emerging trends could change these conclusions in 6-12 months?

Rules:
- Write specific insights, not vague "think differently" suggestions
- Each insight should be actionable or decision-relevant
- Use WebSearch to explore adjacent domains
- Connect insights back to the original research question
- Rate each insight: HIGH (decision-changing) | MEDIUM (worth noting) |
  LOW (interesting but not actionable)

Input: [RESEARCH_OUTPUT.md content]

Write your insights to: .research/<topic>/challenges/OUTSIDE_THE_BOX.md
```

---

## 10. Self-Audit Checklist

| #   | Check                   | Pass Criteria                                           | Fail Example                            |
| --- | ----------------------- | ------------------------------------------------------- | --------------------------------------- |
| 1   | Completeness            | Every sub-question has findings in RESEARCH_OUTPUT.md   | SQ-003 not addressed at all             |
| 2   | Citation density        | Every substantive claim has >=1 inline citation `[n]`   | "React is faster" with no citation      |
| 3   | Confidence distribution | Not >80% HIGH and not >80% LOW                          | All 12 claims marked HIGH               |
| 4   | Source diversity        | Sources from >=2 tiers AND >=3 distinct domains/authors | All sources from one blog               |
| 5   | Contradiction handling  | All contradictions surfaced in dedicated section        | Source A and B disagree but not noted   |
| 6   | Challenge integration   | Contrarian + OTB findings acknowledged in report        | Challenges completed but not referenced |

---

## 11. Output Format Schemas

### claims.jsonl Record

```json
{
  "id": "C-001",
  "claim": "string -- the assertion",
  "confidence": "HIGH | MEDIUM | LOW | UNVERIFIED",
  "evidence": "string -- what supports this",
  "sourceIds": ["S-001", "S-003"],
  "category": "stack | features | architecture | pitfalls | general",
  "subQuestionId": "SQ-001",
  "routing": {
    "deepPlan": true,
    "gsd": false,
    "convergenceLoop": false,
    "memory": false,
    "tdms": false
  }
}
```

### sources.jsonl Record

```json
{
  "id": "S-001",
  "url": "string",
  "title": "string",
  "type": "official-docs | blog | academic | community | codebase | training-data",
  "accessDate": "ISO 8601",
  "trustLevel": "HIGH | MEDIUM | LOW",
  "craapScore": {
    "currency": 4,
    "relevance": 5,
    "authority": 5,
    "accuracy": 4,
    "purpose": 5
  }
}
```

### metadata.json

```json
{
  "topic": "string",
  "depth": "L1 | L2 | L3 | L4",
  "questionType": "string",
  "domain": "string",
  "startedAt": "ISO 8601",
  "completedAt": "ISO 8601",
  "agentCount": 0,
  "searchRounds": 0,
  "sourceCount": 0,
  "claimCount": 0,
  "confidenceDistribution": {
    "HIGH": 0,
    "MEDIUM": 0,
    "LOW": 0,
    "UNVERIFIED": 0
  },
  "selfAuditResult": "6/6 passed",
  "consumerHints": {
    "hasStackClaims": false,
    "hasPitfallClaims": false,
    "hasDebtCandidates": false,
    "hasMemoryCandidates": false,
    "lowConfidenceCount": 0
  },
  "gapFillRounds": 0,
  "gapAgentCount": 0,
  "gapClaimsAdded": 0,
  "gapVerificationAgentCount": 0,
  "finalReSynthesisPerformed": false,
  "totalClaimsPostGap": 0,
  "gapSources": []
}
```

---

## 12. Research Index Schema

Location: `.research/research-index.jsonl`

```json
{
  "topicSlug": "string -- kebab-case",
  "topic": "string -- original question",
  "depth": "L1 | L2 | L3 | L4",
  "domain": "string",
  "completedAt": "ISO 8601",
  "claimCount": 0,
  "sourceCount": 0,
  "confidenceDistribution": {
    "HIGH": 0,
    "MEDIUM": 0,
    "LOW": 0,
    "UNVERIFIED": 0
  },
  "keywords": ["array", "of", "topic", "keywords"],
  "outputPath": ".research/<topic-slug>/",
  "status": "complete | partial | stale"
}
```

### Staleness Rules

| Domain     | Stale After  | Expired After |
| ---------- | ------------ | ------------- |
| Technology | 7 days       | 30 days       |
| Business   | 14 days      | 60 days       |
| Academic   | 90 days      | 365 days      |
| Historical | No staleness | No expiry     |

---

## 13. Gemini CLI Cross-Model Verification

### Setup

```bash
npm install -g @google/gemini-cli
# One-time: Google auth required
```

### Verification Prompt Template

```
Is the following claim accurate and current as of [current date]?
Provide evidence for or against.

Claim: [claim text]
Context: [research domain and topic]

Respond with:
- AGREE or DISAGREE
- Evidence supporting your assessment
- Confidence level (HIGH/MEDIUM/LOW)
```

### Invocation

```bash
echo '<prompt>' | gemini --json 2>/dev/null
```

Parse JSON response for `agree/disagree` + evidence. If Gemini disagrees with a
HIGH-confidence claim, downgrade to MEDIUM and note the disagreement in the
research output.

### Rate Limits

1,000 free queries/day. Typical L1 session uses 9-30 queries (HIGH claims only).

### Depth Scaling

- **L1:** Verify top 5 HIGH-confidence claims
- **L2:** Verify all HIGH-confidence claims
- **L3-L4:** Full verification suite (all claims above LOW)

If Gemini CLI is not available, skip with a note in the self-audit.

---

## 14. Convergence-Loop Research-Claims Behaviors

Six research-specific behaviors for the `research-claims` preset:

| #   | Behavior           | Purpose                                                  |
| --- | ------------------ | -------------------------------------------------------- |
| 1   | verify-sources     | Check cited URLs exist and support the claims            |
| 2   | cross-reference    | Find independent corroborating sources                   |
| 3   | temporal-check     | Verify information is current per domain staleness rules |
| 4   | completeness-audit | Check all sub-questions were addressed                   |
| 5   | bias-check         | Assess perspective diversity and source concentration    |
| 6   | synthesis-fidelity | Verify synthesis accurately represents findings          |

Input: `claims.jsonl` from deep-research output. Output: Verified claims with
upgraded/downgraded confidence.

### Re-Synthesis Trigger

If verification changed >20% of claims, re-run the synthesizer to update
RESEARCH_OUTPUT.md with corrected confidence levels and new evidence.

---

## 15. Downstream Adapter Contract

### Universal Interface

Every adapter follows the same contract:

1. **Reads:** claims.jsonl + sources.jsonl + metadata.json
2. **Filters:** by claim category, confidence, and routing flags
3. **Transforms:** to consumer-specific format
4. **Presents:** to user for confirmation (never auto-writes to consumer files)
5. **Reports:** what was adapted, what was skipped, and why

### Adapter Registry

| Adapter          | Consumer             | Trigger                                   | Category Filter                 | Confidence Gate |
| ---------------- | -------------------- | ----------------------------------------- | ------------------------------- | --------------- |
| deep-plan        | `/deep-plan` Phase 0 | User selects "Route to /deep-plan"        | all                             | all             |
| skill-creator    | `/skill-creator`     | User selects "Create skill from research" | all                             | all             |
| gsd              | GSD pipeline         | User selects "Start GSD with research"    | stack, features, arch, pitfalls | all             |
| convergence-loop | `/convergence-loop`  | Auto-suggest for LOW claims               | all                             | < HIGH          |

### Write Boundaries

Research NEVER overwrites consumer-owned files. Adapters produce formatted
output that the consumer skill reads from `.research/<topic>/` or that is
presented inline for the user to approve injection.

### deep-plan Adapter

Transforms research into a `## Research Context` section for DIAGNOSIS.md:

```
claims.jsonl -> Filter routing.deepPlan === true -> Extract:
  - Domain ecosystem summary (from metadata + HIGH-confidence claims)
  - Key recommendations with confidence levels
  - Pitfalls relevant to the task
  - Contradictions that affect planning
-> Format as "## Research Context" markdown section
-> Present to user: "Add this to DIAGNOSIS.md? [yes/no/edit]"
```

When `/deep-plan` Phase 0 begins, it checks `.research/<topic-slug>/` for
existing research. If found, offer to inject Research Context into DIAGNOSIS.md
(user confirms before injection).

### skill-creator Adapter

Extracts domain knowledge for skill creation:

```
claims.jsonl -> Extract by category:
  - Domain patterns -> inform "Architecture & Structure" questions
  - Existing tool analysis -> inform "Scope & Scale" questions
  - Pitfalls -> inform "Guard Rails" section
  - Best practices -> inform "Critical Rules" section
-> Present as pre-populated defaults in skill-creator discovery
```

### GSD Adapter

Transforms to GSD research file format:

```
claims.jsonl -> Transform by category:
  claims[category=stack]     -> STACK.md format
  claims[category=features]  -> FEATURES.md format
  claims[category=arch]      -> ARCHITECTURE.md format
  claims[category=pitfalls]  -> PITFALLS.md format
  executive_summary          -> SUMMARY.md with "Implications for Roadmap"
-> Write to .planning/research/ (GSD's expected location)
-> User confirms before writing
```

### convergence-loop Adapter

Routes low-confidence claims for verification:

```
claims.jsonl -> Filter confidence < HIGH -> Format as claim list
-> Auto-suggest: "N low-confidence claims. Verify with /convergence-loop?"
-> On convergence: update claims.jsonl with corrected confidence
```

---

## 16. Strategy Log Schema

Location: `.research/strategy-log.jsonl`

```json
{
  "domain": "string",
  "questionType": "string",
  "depth": "L1 | L2 | L3 | L4",
  "searchProfile": "web | docs | codebase | academic",
  "sourceCount": 0,
  "highConfidenceRate": 0.0,
  "queryReformulations": 0,
  "topPerformingSources": ["official-docs", "github"],
  "completedAt": "ISO 8601"
}
```

Phase 0 reads this log to inform strategy selection -- which profiles work best
for which question types and domains.

---

## 17. Source Reputation Schema

Location: `.research/source-reputation.jsonl`

```json
{
  "sourceUrl": "string -- normalized URL or domain",
  "totalCitations": 0,
  "verifiedCitations": 0,
  "failedCitations": 0,
  "reliabilityScore": 0.0,
  "lastUpdated": "ISO 8601"
}
```

Consulted during searcher execution to adjust initial confidence. Low-reputation
sources get automatic confidence downgrade. Updated after verification passes.

---

## 18. Management Sub-Commands

| Sub-Command         | Usage                                        | Effect                                 |
| ------------------- | -------------------------------------------- | -------------------------------------- |
| `--recall <topic>`  | `/deep-research --recall firebase auth`      | Search index, surface prior research   |
| `--forget <topic>`  | `/deep-research --forget websocket-patterns` | Archive research, remove from index    |
| `--refresh <topic>` | `/deep-research --refresh firebase auth`     | Re-run research, preserve old for diff |

`--recall` searches `.research/research-index.jsonl` by topic and keywords.
`--forget` marks as archived and optionally deletes output files. `--refresh`
creates a new research session, preserves old at `<topic>-v1/`, and surfaces
what changed between versions.

---

## 19. State File Schema

Location: `.claude/state/deep-research.<topic-slug>.state.json`

```json
{
  "version": 1,
  "topic": "string -- original research question",
  "topicSlug": "string -- kebab-case slug",
  "status": "planning | researching | synthesizing | verifying | complete | failed",
  "depth": "L1 | L2 | L3 | L4",
  "depthLabel": "Exhaustive | Comprehensive | Investigation | Deep Investigation",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "plan": {
    "questionType": "factual | descriptive | comparative | evaluative | exploratory | investigative | predictive | relational",
    "domain": "string",
    "domainConfidence": "number 0-1",
    "subQuestions": [
      {
        "id": "SQ-001",
        "question": "string",
        "searchProfile": "web | docs | codebase | academic",
        "status": "pending | assigned | complete | failed",
        "agentId": "string",
        "findingsPath": "string"
      }
    ],
    "approved": "boolean",
    "approvedAt": "ISO 8601 | null",
    "decompositionState": {
      "qaRounds": [
        {
          "round": 1,
          "questions": ["string"],
          "answers": ["string"],
          "subQuestionCandidates": ["string"]
        }
      ]
    }
  },
  "agents": {
    "searchers": [
      {
        "id": "searcher-1",
        "subQuestions": ["SQ-001"],
        "status": "pending | running | complete | failed | timeout",
        "findingsPaths": ["string"],
        "startedAt": "ISO 8601 | null",
        "completedAt": "ISO 8601 | null"
      }
    ],
    "synthesizer": {
      "status": "pending | running | complete | failed",
      "outputPath": "string | null"
    }
  },
  "output": {
    "researchOutputPath": "string | null",
    "claimsPath": "string | null",
    "sourcesPath": "string | null",
    "metadataPath": "string | null",
    "rawArtifacts": "kept | archived"
  },
  "verification": {
    "contrarian": { "status": "pending | complete | skipped", "passCount": 0 },
    "outsideTheBox": {
      "status": "pending | complete | skipped",
      "passCount": 0
    },
    "selfAudit": { "status": "pending | complete", "result": "string | null" }
  },
  "gapPursuit": {
    "status": "pending | scanning | spawning | complete | skipped",
    "gapsFound": 0,
    "gapsActionable": 0,
    "gapsBySource": {
      "findings": 0,
      "serendipity": 0,
      "refuted": 0,
      "challenges": 0,
      "low-claims": 0,
      "unresolved": 0
    },
    "agentsSpawned": 0,
    "agentsComplete": 0,
    "agentsFailed": 0
  },
  "gapVerification": {
    "status": "pending | complete | skipped",
    "agentsSpawned": 0,
    "claimsVerified": 0,
    "claimsRefuted": 0
  },
  "finalReSynthesis": {
    "status": "pending | complete | skipped",
    "claimsAdded": 0,
    "claimsModified": 0,
    "sourcesAdded": 0
  },
  "errors": [],
  "resumePoint": "string -- phase + step identifier for resume"
}
```

### Resume Protocol

**Automatic:** Session-start detects incomplete research via state file. Offers
to resume.

**Manual:** Re-invoke `/deep-research "<same topic>"`. Skill detects existing
state file, skips completed phases, resumes from `resumePoint`.

---

## 20. Phase Details (moved from SKILL.md)

### Phase 1 Spawn Prompt Example

```
Agent(
  subagent_type: "deep-research-searcher",
  prompt: "Research the following sub-questions thoroughly.

    Sub-questions:
    - SQ-001: What does Next.js 16 officially support for WebSockets?
    - SQ-002: What patterns does the community use for WebSocket connections?

    Search profile: web
    Output directory: .research/websocket-nextjs-16/findings/
    Depth: L1
    Domain: technology
    Domain config:
      source_authority:
        - tier 1: context7, official-docs (HIGH trust)
        - tier 2: github, stackoverflow, web-search (MEDIUM trust)
        - tier 3: blog, tutorial, training-data (LOW trust)
      verification_rules:
        recency_threshold_days: 30
        min_independent_sources: 2
        check_deprecation: true

    Write findings to separate FINDINGS.md files per sub-question.
    Follow the FINDINGS.md template from REFERENCE.md."
)
```

### Phase 3 Detailed Verification

**Cross-Model Verification via Gemini CLI:** For HIGH-confidence claims, run
independent verification via Gemini CLI to address same-model bias. See Section
13 for setup, templates, and depth scaling. If Gemini CLI is not available, skip
with a note in the self-audit.

**Convergence-Loop Research-Claims Verification:** For MEDIUM/LOW confidence
claims, invoke `/convergence-loop` with the `research-claims` preset (6
behaviors). See Section 14 for details. Update claims.jsonl with
upgraded/downgraded confidence levels after verification.

**Re-Synthesis Trigger:** If verification changed >20% of claims, re-run the
synthesizer to update RESEARCH_OUTPUT.md with corrected confidence levels and
new evidence.

**Post-Challenge:** If challenges reveal significant gaps, optionally feed
challenge findings back to synthesizer for incorporation into the final report.
Update state file.

### Phase 5 Detailed Sub-Steps

**Raw Artifact Cleanup:** Do NOT hard-delete raw artifacts by default. Keep
`findings/*.md` and `challenges/*.md` for resume + audit provenance. Optional
(user-confirmed): archive to `.research/<topic>/archive/`. Record cleanup action
in state file (`output.rawArtifacts: "kept" | "archived"`). Always preserve:
RESEARCH_OUTPUT.md, claims.jsonl, sources.jsonl, metadata.json -- these support
decision provenance, research memory, overlap detection, and `--refresh`.

**Research Index Entry:** After completion, append an entry to
`.research/research-index.jsonl` (see Section 12 for schema). This enables
overlap detection, staleness tracking, and `--recall`.

**Strategy Log Entry:** Append a strategy performance record to
`.research/strategy-log.jsonl` (see Section 16). Tracks which search strategies
produce the best results per domain, informing future Phase 0 strategy
selection.

**Source Reputation Update:** Update `.research/source-reputation.jsonl` with
verification outcomes (see Section 17). Sources that consistently verify get
higher trust; sources that fail verification get downgraded.

**MCP Memory Persistence:** Auto-suggest: "Save N HIGH-confidence durable
insights to memory?" User reviews each candidate before persistence. Only
persist claims that are HIGH confidence, cross-session relevant, and durable
(not rapidly changing).

Update state file to `complete`.

---

## 21. Extracted Phase Detail

Detail extracted from SKILL.md during condensing. SKILL.md contains brief
summaries with pointers to these subsections.

### 21.1 Phase 3.5 Dispute Resolution

Spawn resolution agents when verification and challenge phases produce
conflicting claims (e.g., a V-agent marks a claim REFUTED while the original
D-agent and synthesizer treated it as HIGH confidence, or contrarian and OTB
agents disagree).

**Agent scaling:** 1 agent per 5 disputes, 2 agents for 6-10 disputes, 3 agents
for 11+ disputes.

**Per-dispute output format:**

```
## Dispute: [claim ID or summary]
**RESOLUTION:** [ORIGINAL UPHELD | CHALLENGER UPHELD | REVISED | INCONCLUSIVE]
**RATIONALE:** [Why this resolution, citing specific evidence from both sides]
**IMPACT:** [How this changes the research output -- claim confidence change,
  section rewrite needed, recommendation affected]
**CONFIDENCE:** [HIGH | MEDIUM | LOW in the resolution itself]
```

**Output file:** `findings/dispute-resolutions.md` -- one file containing all
dispute resolutions, organized by dispute.

**Context exhaustion:** If a resolution agent runs out of context before
completing all assigned disputes, re-spawn per Critical Rule 8 -- split
remaining disputes across 2+ smaller agents. Each replacement writes to the same
`findings/dispute-resolutions.md` file (append, not overwrite).

### 21.2 Phase 3.9 Post-Challenge Re-Synthesis

**Trigger:** Re-synthesize if >20% of claims were changed by the combined effect
of verification (Phase 2.5), challenges (Phase 3), and dispute resolution (Phase
3.5). "Changed" means confidence level shifted, claim was REFUTED, or claim text
was materially altered.

**When triggered (>20% changed):** Full re-synthesis using CL-standard
(convergence-loop verification on the re-synthesized report). The synthesizer
reads ALL findings, verification results, challenge outputs, and dispute
resolutions. Produces an updated RESEARCH_OUTPUT.md, claims.jsonl,
sources.jsonl, and metadata.json.

**When NOT triggered (<=20% changed):** Apply inline corrections only. Update
individual claim confidence levels in claims.jsonl. Add correction footnotes to
affected RESEARCH_OUTPUT.md sections. No full re-synthesis needed.

### 21.3 Output Structure

Full directory listing for a completed research session:

```
.research/<topic-slug>/
  RESEARCH_OUTPUT.md          # Final report (retained)
  claims.jsonl                # Structured claims (retained)
  sources.jsonl               # Source registry (retained)
  metadata.json               # Session metadata (retained)
  findings/                   # Intermediate artifacts (gitignored)
    D1-<scope>.md             # Searcher agent findings
    D2-<scope>.md
    ...
    V1-<scope>.md             # Verification agent findings
    V2-<scope>.md
    ...
    dispute-resolutions.md    # Dispute resolution output
    G1-<scope>.md             # Gap-pursuit agent findings
    G2-<scope>.md
    ...
    GV1-<scope>.md            # Gap-verification agent findings
    GV2-<scope>.md
    ...
  challenges/                 # Challenge artifacts (gitignored)
    CONTRARIAN.md
    OUTSIDE_THE_BOX.md
```

**Gitignore rationale:** `findings/` and `challenges/` are intermediate working
artifacts. They are kept on disk for resume and audit provenance but gitignored
to avoid bloating the repository. The four retained files (RESEARCH_OUTPUT.md,
claims.jsonl, sources.jsonl, metadata.json) contain all final outputs and are
committed.

### 21.4 Guard Rails

**Budget monitoring:**

- Warn at 70% of estimated token budget ("70% budget used, N agents remaining")
- Warn at 85% ("Approaching budget limit -- consider reducing remaining scope")
- Warn at 95% ("Budget nearly exhausted -- completing current agents only")
- Force-stop at 100% -- complete in-flight agents, skip remaining, synthesize
  from available findings. Never exceed budget silently.

**Scope explosion:** If decomposition produces >15 sub-questions, flag for user
review. Suggest clustering related sub-questions to reduce agent count. User
decides whether to proceed at full scope or reduce.

**Failure cascade:** If 50%+ of searcher agents fail (timeout, context
exhaustion without successful re-spawn, empty findings), halt the session.
Present failure summary to user with options: retry failed agents, proceed with
partial findings, or abort.

**Timeout:** 5 minutes per agent. If an agent exceeds timeout, mark it failed in
the state file and inform the user. Do not silently wait.

**Disengagement:** If at any point the user says "stop", "abort", or "cancel",
immediately halt all agent spawning. Complete any in-flight agents (they cannot
be interrupted), then present current state and options.

### 21.5 Compaction Resilience

**State file as checkpoint:** The state file
(`.claude/state/deep-research.<slug>.state.json`) is updated after every
state-changing event. After compaction, the state file survives and enables
resume from the last completed step.

**Resume protocol:** On session start, check for incomplete state files. If
found, offer to resume. On re-invocation with the same topic, detect existing
state and skip completed phases.

**Artifacts as checkpoints:** Each agent writes its findings to disk before
reporting success. If compaction occurs mid-session, completed findings files
survive. The synthesizer reads from disk, not from conversation context.

**Phase 0 Q&A persistence:** After each Q&A round, persist the questions and
answers to the state file (`plan.decompositionState.qaRounds`). After
compaction, Q&A history is recoverable from the state file without re-asking the
user.

---

## 22. Gap Pursuit, Verification, and Final Re-Synthesis

Detailed reference for Phases 3.95, 3.96, and 3.97. SKILL.md contains the
operational summaries; this section provides algorithm detail, agent prompt
templates, and scaling rules.

### 22.1 Gap Detection Algorithm

Scan 6 sources in priority order:

1. **Findings `## Gaps identified:` sections** -- from D-agent findings, V-agent
   findings, and challenge files. These are explicit gaps the agents themselves
   identified during their work.
2. **Actionable `## Serendipity` items** -- not just observations, but items
   that imply missing research (e.g., "discovered X uses Y internally -- this
   was not investigated").
3. **V-agent REFUTED claims needing follow-up** -- claims marked REFUTED during
   verification that suggest the research missed something fundamental, not just
   got a detail wrong.
4. **Challenge "what the research missed" items** -- from contrarian and OTB
   agents, specifically their notes on gaps in coverage.
5. **LOW/UNVERIFIED claims in claims.jsonl** -- claims that never achieved
   sufficient evidence. Gap pursuit can attempt to find the missing evidence or
   confirm the claim should be dropped.
6. **RESEARCH_OUTPUT.md unresolved questions** -- from the "Unresolved
   Questions" section of the synthesized report.

**Deduplication:** Match by keyword overlap. If two gap descriptions share >60%
of their significant terms (excluding stop words), they are the same gap. Keep
the higher-priority source's version (lower number in the list above).

**Actionability filter:** Skip items tagged as "out of scope" or
scope-limitation notes. Only pursue gaps that could change findings, add missing
evidence, or reveal overlooked dimensions. A gap is actionable if addressing it
would change at least one claim's confidence level or add a new claim.

### 22.2 Gap Agent Scaling

**Formula:** `ceil(G/2)` where G = actionable gap count.

**Depth caps:**

| Depth | Max Gap Agents |
| ----- | -------------- |
| L1    | 4              |
| L2    | 3              |
| L3    | 6              |
| L4    | 10             |

**When G exceeds cap:** Cluster related gaps by theme (e.g., all
performance-related gaps go to one agent, all security-related gaps to another).
Assign each cluster to a single agent. Each agent may investigate multiple
related gaps.

**Each agent writes to:** `findings/G<N>-<scope>.md` where N is the agent number
and scope is a brief theme descriptor (e.g., `G1-performance.md`,
`G2-security-auth.md`).

**Concurrency:** Respect the 4-agent concurrency limit. If more gap agents are
needed, process in waves. Report wave progress after each wave completes.

### 22.3 Gap-Pursuit Agent Prompt Template

Based on the G1-G6 prompts from Session #244:

```
You are a gap-pursuit agent. Your task is to investigate gaps identified during
the main research phase.

## Gap(s) to investigate
[List of assigned gaps with source references]

## Context
Read .research/<topic>/RESEARCH_OUTPUT.md for the current state of findings.
Read the specific findings files referenced in each gap.

## Required research
[Gap-specific investigation steps -- e.g., "Search for evidence on X",
"Read files Y and Z to verify claim W", "Find community discussion on topic T"]

## Output
Write to: .research/<topic>/findings/G<N>-<scope>.md
Format:
  ## Summary
  [Brief summary of what was investigated and found]

  ## Detailed Findings
  [Findings with citations, organized by gap]

  ## Gaps
  [Your own gaps -- these will NOT trigger another cycle per Critical Rule 9]

  ## Serendipity
  [Unexpected discoveries worth noting]

Repo at [project root]
```

### 22.4 Gap-Verification Agent Prompt Template

```
You are a gap-verification agent. Check gap-pursuit findings against ground
truth.

## Scope: [codebase claims | cross-claim consistency]
Read .research/<topic>/findings/G<N>-*.md files.

For each claim:
  VERIFIED (with file:line evidence) or REFUTED (with what's actually there).

Cross-check gap findings against original findings for consistency. Flag any
contradictions between gap-pursuit findings and the original research.

Write to: .research/<topic>/findings/GV<N>-<scope>.md
```

**Minimum 2 agents:** GV1 checks gap-pursuit codebase claims against filesystem.
GV2 checks cross-claim consistency between gap findings and original findings.

### 22.5 Final Re-Synthesis Agent Prompt Template

```
You are a final re-synthesis agent. Incorporate gap-pursuit findings into the
research output.

Read ALL files in .research/<topic>/findings/ (original D-agents + V-agents +
challenges + disputes + G-agents + GV-agents).
Read the current .research/<topic>/RESEARCH_OUTPUT.md.

EDIT the report -- do not rewrite from scratch. Specifically:
- Add new sections for gap-pursuit discoveries that introduce new themes
- Update existing claims with new evidence from gap pursuit
- Incorporate gap-verification corrections (REFUTED gap claims should be noted,
  not silently dropped)
- Add new sources discovered during gap pursuit
- Update confidence levels where gap pursuit provided additional evidence

Update claims.jsonl:
- New claims from gap pursuit use C-G* IDs (e.g., C-G01, C-G02)
- Modified existing claims retain their original IDs with updated confidence

Update sources.jsonl with any new sources discovered.

Update metadata.json:
- Set gapFillRounds to 1
- Set gapAgentCount to [number of gap agents spawned]
- Set gapClaimsAdded to [count of new C-G* claims]
- Set totalClaimsPostGap to [total claims after incorporation]
- Set gapSources to [array of which source types produced actionable gaps]
```

This is the **truly final** output. Apply CL-standard (convergence-loop
verification) to the final report.

---

## Version History

| Version | Date       | Description                                                           |
| ------- | ---------- | --------------------------------------------------------------------- |
| 1.4     | 2026-03-29 | S21-22: extracted phase detail, gap pursuit/verification/re-synthesis |
| 1.3     | 2026-03-22 | Skill-audit: state schema, phase details, ToC, spawn example          |
| 1.2     | 2026-03-22 | P3: management commands, strategy log, reputation                     |
| 1.1     | 2026-03-22 | P1: Gemini CLI, research index, CL preset, profiles                   |
| 1.0     | 2026-03-22 | Initial implementation                                                |
