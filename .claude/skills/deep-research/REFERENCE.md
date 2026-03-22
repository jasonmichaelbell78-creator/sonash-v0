<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-03-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

# Deep Research Reference

Output templates, question type classification, source evaluation framework,
prompt templates, and schemas for the deep-research skill.

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
| Investigative | "why", "root cause", "what happened"   | Hypothesis → evidence → conclusion   | Root cause identified with evidence     |
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
  - Pre-mortem: "This research led to a bad decision — why?"
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

- Tier 1: Context7 → official docs → GitHub releases/changelogs
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

- 2+ independent sources agree → MEDIUM minimum
- Official/authoritative source confirms → HIGH eligible
- Training data only → always UNVERIFIED
- Sources contradict → MEDIUM at best, surface contradiction
- Single unverified blog post → LOW

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

1. **[Recommendation]** — [rationale with citations]
2. **[Recommendation]** — [rationale with citations]

---

## Unexpected Findings

[High-value findings outside the original research scope — discoveries made
along the way that are worth noting.]

---

## Challenges

### Contrarian Findings

[Summary of contrarian challenge results — what was challenged, what held up,
what was weakened. Full details in challenges/CONTRARIAN.md]

### Outside-the-Box Insights

[Summary of OTB findings — what structured research missed, adjacent domain
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

**Round 1 — Scope & Boundaries:**

- What specifically do you want to learn about [topic]?
- What's the context — are you planning to build something, evaluating options,
  or exploring a domain?
- What do you already know? (so we don't re-research known ground)
- Are there specific technologies, constraints, or systems involved?

**Round 2 — Priorities & Angles:**

- Which aspects matter most — technical depth, practical patterns, tradeoffs,
  risks?
- Any specific concerns or hypotheses you want tested?
- What would make this research actionable for you?

**Round 3 (if needed) — Refinement:**

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

Budget allocation (Decision #8 — not a constraint, a guardrail):

- 60% — search (Phase 1)
- 20% — verification (Phase 3)
- 10% — synthesis (Phase 2)
- 10% — overhead (Phases 0, 4, 5)

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
- If a claim holds up under challenge, say so — don't force disagreement
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

| #   | Check                   | Pass Criteria                                         | Fail Example                            |
| --- | ----------------------- | ----------------------------------------------------- | --------------------------------------- |
| 1   | Completeness            | Every sub-question has findings in RESEARCH_OUTPUT.md | SQ-003 not addressed at all             |
| 2   | Citation density        | Every substantive claim has ≥1 inline citation `[n]`  | "React is faster" with no citation      |
| 3   | Confidence distribution | Not >80% HIGH and not >80% LOW                        | All 12 claims marked HIGH               |
| 4   | Source diversity        | Sources from ≥2 tiers AND ≥3 distinct domains/authors | All sources from one blog               |
| 5   | Contradiction handling  | All contradictions surfaced in dedicated section      | Source A and B disagree but not noted   |
| 6   | Challenge integration   | Contrarian + OTB findings acknowledged in report      | Challenges completed but not referenced |

---

## 11. Output Format Schemas

### claims.jsonl Record

```json
{
  "id": "C-001",
  "claim": "string — the assertion",
  "confidence": "HIGH | MEDIUM | LOW | UNVERIFIED",
  "evidence": "string — what supports this",
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
  }
}
```

---

## 12. Research Index Schema (P1+)

Location: `.research/research-index.jsonl`

```json
{
  "topicSlug": "string — kebab-case",
  "topic": "string — original question",
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

## 13. Gemini CLI Cross-Model Verification (P1+)

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

---

## 14. Convergence-Loop Research-Claims Behaviors (P1+)

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

---

## Version History

| Version | Date       | Description                                         |
| ------- | ---------- | --------------------------------------------------- |
| 1.1     | 2026-03-22 | P1: Gemini CLI, research index, CL preset, profiles |
| 1.0     | 2026-03-22 | Initial implementation                              |
