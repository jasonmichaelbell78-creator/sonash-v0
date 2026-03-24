# Security & Privacy for Deep Research

<!-- prettier-ignore-start -->
| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| Status       | COMPLETE                                       |
| Last Updated | 2026-03-20                                     |
| Dimension    | How to research securely without leaking intent |
<!-- prettier-ignore-end -->

## Executive Summary

A deep-research system that sends queries to external services (WebSearch,
WebFetch, APIs) creates an information-theoretic side channel: the queries
themselves reveal what the researcher is thinking, planning, and worried about.
This is fundamentally different from traditional security concerns about
protecting data at rest or in transit -- here, the **act of asking** is the
leakage vector.

Key security principles for research systems:

1. **Queries are intelligence.** Every search query sent to an external provider
   is a signal about the researcher's intent, knowledge gaps, and strategic
   direction. Treat outbound queries as sensitive data, not just inbound
   results.
2. **Classify before you search.** Not all research topics carry equal risk.
   Apply data classification to the research topic _before_ constructing
   queries, and route queries accordingly.
3. **Sanitize queries, not just outputs.** The established practice of
   sanitizing outputs (error messages, logs) must extend upstream to query
   construction. Remove project-specific identifiers before they leave the
   system.
4. **Trust is not binary.** Different external services have different trust
   profiles. Local codebase search has zero external exposure; a WebSearch query
   is visible to the search provider and potentially logged indefinitely.
5. **Research outputs are artifacts.** They may contain sensitive findings,
   competitive intelligence, or vulnerability details. They need storage, access
   control, and retention policies.
6. **Defense in depth applies to research.** No single control is sufficient.
   Layer query sanitization, source trust routing, output protection, and audit
   trails.

---

## 1. Query Leakage Risks

### What Research Queries Reveal

When a deep-research system sends queries to external services, those queries
reveal multiple dimensions of information:

**Strategic Intent:**

- Searching for "HIPAA compliance Next.js healthcare app" reveals the project is
  in the healthcare domain and actively pursuing regulatory compliance.
- Searching for competitor names reveals competitive intelligence activity.
- Searching for specific technology evaluations reveals architecture decisions
  in progress.

**Knowledge Gaps (and therefore vulnerabilities):**

- Searching for "how to fix XSS in React" reveals the team may have XSS
  vulnerabilities.
- Searching for "Firebase security rules bypass" reveals the team suspects their
  security rules may be insufficient.
- Vulnerability research is particularly dangerous -- it maps the attack surface
  for anyone who can observe the queries.

**Project Architecture:**

- Technology-specific queries reveal the stack (e.g., "Next.js 16 App Router
  caching issue" reveals exact framework version).
- Integration queries reveal the system's dependency graph.
- Performance queries reveal bottlenecks.

### Search Provider Profiling

Search providers can and do build profiles based on query patterns. Research
from multiple sources confirms:

- Search engines refine results based on users' previous queries, creating
  persistent user profiles. Anonymized search queries can lead to identification
  of users and their interests
  ([Preserving user's privacy in web search engines, ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S014036640900125X)).
- Google maintains tracking presence on 80.3% of all websites, enabling
  cross-site correlation of research patterns
  ([Combating Web Tracking, MDPI](https://www.mdpi.com/1999-5903/16/10/363)).
- Browser fingerprinting can uniquely identify users even across browser
  sessions, and users who explicitly opt out of tracking may still be silently
  tracked
  ([Texas A&M Browser Fingerprinting Research](https://engineering.tamu.edu/news/2025/06/websites-are-tracking-you-via-browser-fingerprinting.html)).

For an AI research agent, the risk is compounded: queries are typically sent
programmatically through APIs where the caller identity (API key, IP address) is
directly known to the provider, eliminating even the weak anonymity of browser-
based search.

### Temporal Correlation Attacks

A sequence of queries over time reveals even more than individual queries:

1. Query at T1: "Firebase security rules best practices"
2. Query at T2: "Firebase security rules common vulnerabilities"
3. Query at T3: "Firebase data exfiltration prevention"

This progression reveals a team that discovered a security gap and is actively
trying to patch it -- valuable intelligence for an attacker monitoring the
search provider's logs.

### Real-World Precedent

The Samsung ChatGPT incident (April 2023) demonstrates this risk concretely:
employees leaked confidential semiconductor source code and proprietary data
while using an external AI service for code review. A CyberHaven study found
that 11% of data employees put into ChatGPT was confidential information
([When Prompts Leak Secrets, Keysight](https://www.keysight.com/blogs/en/tech/nwvs/2025/08/04/pii-disclosure-in-user-request)).

---

## 2. Data Classification for Research

### Classification Levels

Not all research topics carry equal risk. The system should classify research
topics before constructing queries:

| Level            | Definition                                          | Examples                                                       | Allowed Sources                 |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| **PUBLIC**       | General technology knowledge, widely available      | Best practices, open-source docs, language features            | All sources                     |
| **INTERNAL**     | Project-specific decisions, not public              | Architecture evaluation, technology comparison for the project | All sources, sanitized queries  |
| **CONFIDENTIAL** | Research that reveals security posture or strategy  | Vulnerability research, competitive analysis, legal research   | Local + trusted sources only    |
| **RESTRICTED**   | Research involving PII, financial data, regulations | Compliance with specific regulations, user data analysis       | Local only, no external queries |

This aligns with the standard enterprise data classification framework (Public,
Internal, Confidential, Restricted) used across industry
([Microsoft Data Classification Framework](https://learn.microsoft.com/en-us/compliance/assurance/assurance-create-data-classification-framework);
[Palo Alto Networks Data Classification](https://www.paloaltonetworks.com/cyberpedia/data-classification);
[Fortinet Data Classification Levels](https://www.fortinet.com/resources/cyberglossary/data-classification)).

### Sensitivity Detection Heuristics

The system should detect sensitivity level through:

1. **Keyword matching:** Presence of project names, internal identifiers,
   competitor names, vulnerability-related terms, regulatory references (HIPAA,
   GDPR, SOC2), financial terms.
2. **Topic classification:** Security/vulnerability research is inherently
   CONFIDENTIAL. Legal/regulatory research involving specific entities is
   RESTRICTED.
3. **Context awareness:** A query about "React performance" is PUBLIC. The same
   query with "SoNash dashboard React performance" is INTERNAL because it
   reveals the project name and architecture.
4. **User override:** Allow explicit classification by the researcher when
   automated detection is insufficient.

### Classification Decision Tree

```
Is the query about a specific project or internal system?
  YES -> Is it about security vulnerabilities or competitive intelligence?
    YES -> CONFIDENTIAL
    NO  -> INTERNAL
  NO  -> Does it involve PII, financial data, or specific regulatory entities?
    YES -> RESTRICTED
    NO  -> PUBLIC
```

---

## 3. Query Sanitization

### The Core Problem

Traditional security focuses on sanitizing outputs (error messages, logs) to
prevent information disclosure. Deep research introduces a new requirement:
**sanitizing inputs** (queries) before they leave the system boundary.

### Sanitization Techniques

**1. Identifier Removal:**

Replace project-specific identifiers with generic equivalents:

| Before (leaks intent)                | After (sanitized)                          |
| ------------------------------------ | ------------------------------------------ |
| "SoNash HIPAA compliance"            | "Next.js healthcare app HIPAA compliance"  |
| "Firebase security rules for SoNash" | "Firebase security rules best practices"   |
| "SoNash vs CompetitorApp features"   | "sobriety tracking app feature comparison" |

**2. Query Decomposition (Proxy Queries):**

Break a sensitive query into multiple non-sensitive sub-queries whose
combination yields the needed answer. This is a well-established technique in
privacy-preserving search
([Proxy-Terms Based Query Obfuscation, DOAJ](https://doaj.org/article/fead5b6864524e548dd14aff211ab8c8)):

| Sensitive query                | Decomposed queries                                              |
| ------------------------------ | --------------------------------------------------------------- |
| "SoNash XSS vulnerability fix" | "React XSS prevention" + "sanitize HTML input Next.js"          |
| "bypass Firebase App Check"    | "Firebase App Check documentation" + "App Check error handling" |

**3. Generalization:**

Elevate queries from specific to general:

- Instead of version-specific: "Next.js 16.2.0 App Router bug" becomes "Next.js
  App Router known issues"
- Instead of architecture-specific: "Firestore security rules for journal
  entries with Cloud Functions" becomes "Firestore security rules best
  practices"

**4. Tokenization/Placeholder Approach:**

Inspired by the anonymization technique documented in enterprise AI workflows
([EdgeRed Anonymising Data for AI Agents](https://edgered.com.au/anonymising-data-for-ai-agents-using-the-latest-tools-without-risking-privacy/)):

1. Scan the query for sensitive tokens (project names, internal identifiers,
   specific versions, team member names).
2. Replace each with a generic placeholder.
3. Send the sanitized query externally.
4. Map results back using the placeholder-to-real mapping (kept locally).

### Sanitization Pipeline

```
Raw Query
  -> Sensitivity Classification (Section 2)
  -> If PUBLIC: send as-is
  -> If INTERNAL: remove project identifiers, generalize
  -> If CONFIDENTIAL: decompose into proxy queries, use trusted sources only
  -> If RESTRICTED: local sources only, no external queries
  -> Sanitized Query(ies)
  -> External Service
```

---

## 4. Source Trust Levels

### Trust Hierarchy

Different external services have fundamentally different trust profiles based on
what they can observe and how they handle that data:

| Source                    | Trust Level | What It Sees               | Risk Profile                                                |
| ------------------------- | ----------- | -------------------------- | ----------------------------------------------------------- |
| Local codebase/filesystem | FULL        | Nothing external           | Zero external exposure                                      |
| Context7 (library docs)   | HIGH        | Library name + version     | Low risk -- only reveals which libraries are in use         |
| MCP servers (self-hosted) | HIGH        | Depends on implementation  | Controlled -- you own the server and its logs               |
| MCP servers (third-party) | MEDIUM      | Full query content         | Varies -- depends on MCP server security posture            |
| WebSearch                 | LOW         | Full query text + metadata | Queries logged by search provider, potentially indefinitely |
| WebFetch                  | LOW         | URL access patterns        | Target server sees requesting IP, timing, access patterns   |
| Third-party APIs          | VARIES      | API call content           | Depends on API provider's data handling policies            |

### MCP Server Trust Assessment

MCP security is a rapidly evolving concern. Key findings from 2025-2026
research:

- Among 2,614 MCP implementations analyzed, 82% use file system operations prone
  to path traversal, 67% use sensitive APIs related to code injection, and 34%
  use sensitive APIs related to command injection
  ([Strobes MCP Vulnerabilities](https://strobes.co/blog/mcp-model-context-protocol-and-its-critical-vulnerabilities/)).
- MCP has no built-in identity, no least-privilege enforcement, and no audit
  trail
  ([Red Hat MCP Security Analysis](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)).
- Tool poisoning attacks can silently exfiltrate data through a malicious MCP
  server combined with legitimate servers in the same agent
  ([Pillar Security MCP Risks](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)).
- CVE-2025-6514 demonstrated critical OS command injection in mcp-remote, a
  popular OAuth proxy for MCP
  ([Practical DevSecOps MCP Vulnerabilities](https://www.practical-devsecops.com/mcp-security-vulnerabilities/)).

**Recommendation:** Treat all third-party MCP servers as LOW trust unless
specifically audited. Self-hosted MCP servers with controlled access are HIGH
trust.

### Source Routing by Classification

| Classification | Allowed Sources                                            |
| -------------- | ---------------------------------------------------------- |
| PUBLIC         | All sources (local, MCP, WebSearch, WebFetch, APIs)        |
| INTERNAL       | All sources with sanitized queries                         |
| CONFIDENTIAL   | Local + self-hosted MCP + Context7 (no WebSearch/WebFetch) |
| RESTRICTED     | Local sources only (codebase, filesystem, local docs)      |

---

## 5. Research Output Security

### Storage Considerations

Research outputs may contain:

- Sensitive findings about security vulnerabilities
- Competitive intelligence analysis
- Architecture decisions not yet public
- Regulatory compliance gaps
- Aggregated information more sensitive than individual sources

### Current Project Patterns

The SoNash codebase already establishes relevant patterns:

- `.planning/**/agent-research/*.txt` and `.planning/**/agent-research/*.json`
  are already in `.gitignore` -- raw agent research transcripts are excluded
  because they "contain PII: local paths, session IDs."
- Firebase credentials (`.json` service account files) are gitignored.
- `.env*.local` files are gitignored.
- `.claude/state/` files containing session data are gitignored.
- The `SECURITY_CHECKLIST.md` explicitly states: "No sensitive data: Don't
  include paths, credentials, PII" for JSON files, and "Never log tokens,
  passwords, keys" for log output.

### Recommendations for Research Output

**1. Storage location:**

Research outputs should be stored in `.planning/` directories which are already
part of the project's planning infrastructure. Raw transcripts and intermediate
data should go in `agent-research/` subdirectories (already gitignored).

**2. Gitignore policy:**

| Content Type                         | Git Status | Rationale                                       |
| ------------------------------------ | ---------- | ----------------------------------------------- |
| Final research summaries (sanitized) | TRACKED    | Useful for team reference, no sensitive content |
| Raw research transcripts             | GITIGNORED | May contain local paths, session IDs, PII       |
| Vulnerability research findings      | GITIGNORED | Attack surface information                      |
| Competitive intelligence             | GITIGNORED | Strategic intent leakage                        |
| Research query logs                  | GITIGNORED | Reveals what was searched and when              |

**3. Content sanitization before tracking:**

Research outputs that will be committed to the repository must go through the
same sanitization pipeline as query construction:

- Remove absolute file paths (use `path.relative()` per existing pattern #34).
- Remove session-specific identifiers.
- Remove raw error messages (use `sanitizeError()` per existing pattern #1).
- Generalize vulnerability findings to recommendations rather than specific
  exploit details.

**4. Retention policy:**

- RESTRICTED research: delete after use, do not persist.
- CONFIDENTIAL research: retain locally for current session/sprint only.
- INTERNAL research: retain in `.planning/` for project lifetime.
- PUBLIC research: retain and optionally commit.

---

## 6. Current Security Posture

### What This Codebase Already Does Well

The SoNash project has a mature security posture that provides a strong
foundation for secure research:

**Security Infrastructure:**

- 180+ code patterns enforced by `npm run patterns:check` with ESLint (sonash/\*
  rules) and Semgrep static analysis.
- `scripts/lib/security-helpers.js` provides reusable helpers: `safeWriteFile`,
  `safeGitAdd`, `validatePathInDir`, `sanitizeError`, `escapeMd`,
  `sanitizeFilename`, `refuseSymlinkWithParents`.
- Comprehensive path validation using regex `/^\.\.(?:[\\/]|$)/.test(rel)`
  instead of `startsWith('..')`.
- Fail-closed security guards: guard failure denies access, never `() => true`
  fallback.
- TOCTOU protection: re-check guards immediately before mutation operations.

**External Request Controls (from SECURITY_CHECKLIST.md):**

- SSRF allowlist: explicit hostname allowlist + protocol enforcement (HTTPS
  only).
- URL protocol allowlist: validate against explicit protocol+host allowlist.
- External request timeout: `AbortController` with explicit timeout on all
  fetch.
- These patterns directly apply to deep research's external service calls.

**Output Security:**

- Error sanitization via `sanitizeError()` -- never log raw `error.message`.
- No absolute paths in output (pattern #34).
- PII masking via `maskEmail()`.
- Markdown escaping via `escapeMd()`.
- No hardcoded secrets (ESLint rule: `sonash/no-hardcoded-secrets`).

**Data Protection:**

- Prototype pollution prevention: `new Map()` or `Object.create(null)` for
  untrusted keys.
- Exclusive file creation with `{ flag: "wx", mode: 0o600 }`.
- Symlink guards with parent directory checks.
- Cloud Functions for all sensitive data writes (journal, daily_logs,
  inventoryEntries) with App Check token verification.

### Gaps to Address for Deep Research

1. **No query sanitization pipeline:** The existing security controls focus on
   output sanitization and file operations. There is no mechanism for sanitizing
   outbound queries to external services.
2. **No data classification for research:** The project has no formal
   classification of research topics by sensitivity level.
3. **No source trust model:** External services are treated uniformly -- there
   is no differentiation between a local codebase search and a WebSearch query
   in terms of what information is safe to include.
4. **No research output retention policy:** While raw agent research is
   gitignored, there is no formal policy for how long research outputs should be
   retained or when they should be deleted.
5. **No audit trail for research queries:** The project tracks hook runs and
   commit failures but does not log what external queries were made during
   research.

---

## 7. Compliance Considerations

### GDPR Implications

The European Data Protection Board (EDPB) and CNIL have issued guidance
specifically addressing AI systems and GDPR compliance
([EDPB Opinion on AI and GDPR, Orrick](https://www.orrick.com/en/Insights/2025/03/The-European-Data-Protection-Board-Shares-Opinion-on-How-to-Use-AI-in-Compliance-with-GDPR);
[CNIL AI System Recommendations](https://www.cnil.fr/en/ai-system-development-cnils-recommendations-to-comply-gdpr)):

**Data Minimization (Article 5(1)(c)):**

Research queries should collect only the minimum data necessary. This directly
supports the query sanitization approach -- stripping unnecessary identifiers
from queries is not just good security, it is a compliance requirement if any
personal data could be involved.

**Right to Erasure (Article 17):**

Once data is used in a research context, it can be difficult to completely
remove. AI systems can retain patterns even after formal deletion
([GDPR Compliance Challenges 2025, Secure Privacy](https://secureprivacy.ai/blog/ai-gdpr-compliance-challenges-2025)).
Research outputs that contain any personal data must have a deletion mechanism.

**Purpose Limitation (Article 5(1)(b)):**

Research data collected for one purpose (e.g., evaluating a technology) should
not be repurposed (e.g., competitive intelligence). The data classification
framework helps enforce this by tagging research with its intended purpose.

**Data Protection Impact Assessment (DPIA):**

If the research system processes personal data at scale or involves systematic
monitoring, a DPIA may be required
([Reflections on AI data protection compliance, Taylor & Francis](https://www.tandfonline.com/doi/full/10.1080/23311886.2025.2560654)).

### PII in Research

Research that involves people or companies carries additional risk:

- Searching for a person's name reveals that person is under investigation or
  evaluation.
- Searching for a company reveals business relationships or competitive
  interest.
- Even aggregate queries ("top sobriety tracking apps") may reveal the project's
  market segment to search providers.

**Mitigation:** Generalize people and company names in external queries. Use
local data sources for PII-adjacent research.

### Audit Trail Requirements

For compliance, the system should maintain:

- A log of what classifications were applied to research topics.
- A record of which external services were queried (but NOT the full query text
  for CONFIDENTIAL/RESTRICTED topics).
- Timestamps for research data creation and planned deletion.
- Evidence that sanitization was applied before external queries.

---

## 8. Threat Model

### Threat Matrix

| ID  | Threat                                    | Likelihood | Impact   | Mitigation                                           |
| --- | ----------------------------------------- | ---------- | -------- | ---------------------------------------------------- |
| T1  | Search provider logs all queries          | CERTAIN    | MEDIUM   | Query sanitization, source routing by classification |
| T2  | Research outputs committed to public repo | MEDIUM     | HIGH     | Gitignore rules, pre-commit hooks                    |
| T3  | Research reveals internal architecture    | HIGH       | MEDIUM   | Query generalization, identifier removal             |
| T4  | Prompt injection through WebFetch         | HIGH       | HIGH     | Content isolation, spotlighting, input validation    |
| T5  | Poisoned search results -> bad decisions  | MEDIUM     | HIGH     | Source verification, multi-source corroboration      |
| T6  | MCP server exfiltrates query data         | MEDIUM     | HIGH     | MCP trust assessment, self-hosted preference         |
| T7  | Temporal correlation reveals strategy     | MEDIUM     | MEDIUM   | Query batching, timing randomization                 |
| T8  | Competitor monitors search patterns       | LOW        | HIGH     | Proxy queries, query decomposition                   |
| T9  | Research data persists after deletion     | MEDIUM     | MEDIUM   | Retention policies, explicit cleanup                 |
| T10 | API key/credential leakage in queries     | LOW        | CRITICAL | Input scanning, credential detection                 |

### Detailed Threat Analysis

#### T1: Search Provider Query Logging

**Threat:** Every query sent to WebSearch is logged by the search provider
(Google, Bing, etc.) and associated with the API key or account used. This is
not a bug -- it is the business model.

**Attack scenario:** A search provider employee, a legal discovery request, or a
data breach exposes the query logs, revealing the project's security concerns,
technology choices, and strategic direction.

**Mitigation:**

- Classify queries by sensitivity before sending.
- Sanitize INTERNAL queries by removing project identifiers.
- Route CONFIDENTIAL queries to local sources only.
- Never send RESTRICTED queries externally.

#### T4: Prompt Injection Through WebFetch

**Threat:** When the research system fetches web content, that content may
contain adversarial instructions designed to manipulate the AI agent's behavior.
This is the most technically sophisticated threat.

**Real-world precedent:** Security researchers found that attackers hid
invisible text inside a public Reddit post, and when Perplexity's Comet feature
fetched the page, the AI summarizer read the hidden instructions, leaked the
user's OTP, and sent it to an attacker-controlled server
([Palo Alto Unit42 AI Agent Prompt Injection](https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/)).

**Attack techniques include:**

- Visual concealment (zero font size, zero opacity text).
- HTML comment injection.
- Dynamic execution via JavaScript.
- Unicode and encoding obfuscation.

**Mitigation (from Anthropic and OpenAI research):**

- **Spotlighting:** Separate untrusted (fetched) content from trusted
  (system/user) instructions using clear delimiters
  ([Anthropic Prompt Injection Defenses](https://www.anthropic.com/research/prompt-injection-defenses)).
- **Instruction hierarchy:** Ensure system prompts take precedence over content
  in fetched documents
  ([OpenAI Designing Agents to Resist Prompt Injection](https://openai.com/index/designing-agents-to-resist-prompt-injection/)).
- **Content scanning:** Run fetched content through classifiers that detect
  adversarial commands before presenting to the LLM.
- **Output verification:** Validate agent outputs after processing fetched
  content to detect exfiltration attempts.
- **Sandboxing:** Process fetched content in isolated context where the agent
  cannot perform sensitive actions.

#### T5: Poisoned Search Results

**Threat:** Search results may be intentionally manipulated (SEO poisoning) to
provide incorrect information that leads to bad architecture decisions, insecure
code patterns, or flawed security configurations.

**Attack scenario:** An attacker creates a high-ranking blog post that
recommends an insecure Firebase security rule configuration. The research system
fetches this as a "best practice" and the team implements it.

**Mitigation:**

- Multi-source corroboration (require findings from 3+ independent sources).
- Source authority scoring (official docs > blog posts > forum answers).
- Recency weighting (prefer recent sources for security guidance).
- Cross-reference with known-good sources (OWASP, official framework docs).
- This aligns with the SOURCE_VERIFICATION.md research already completed for
  this skill.

#### T6: MCP Server Data Exfiltration

**Threat:** A compromised or malicious MCP server could log, exfiltrate, or
manipulate query data. The tool poisoning attack vector is particularly
dangerous because it can combine a malicious server with legitimate ones in the
same agent session.

**Real-world precedent:** The Supabase/Cursor incident in mid-2025 demonstrated
how privileged agent access combined with untrusted input could lead to data
exfiltration through a public support thread
([AuthZed MCP Breach Timeline](https://authzed.com/blog/timeline-mcp-breaches)).

**Mitigation:**

- Audit all MCP servers before use.
- Prefer self-hosted MCP servers for sensitive operations.
- Apply least-privilege: each MCP server should only have access to the data it
  needs.
- Monitor MCP server network traffic for unexpected outbound connections.

---

## 9. OWASP LLM Top 10 Alignment

The OWASP Top 10 for LLM Applications 2025 provides a standardized risk
framework. Here is how each risk maps to deep research
([OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/)):

| OWASP Risk                       | Relevance to Deep Research                             | Mitigation in This Design                    |
| -------------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| LLM01: Prompt Injection          | WebFetch content can contain adversarial instructions  | Spotlighting, content isolation, scanning    |
| LLM02: Sensitive Info Disclosure | Queries leak project details to search providers       | Query sanitization, data classification      |
| LLM03: Supply Chain              | MCP servers, search APIs are supply chain dependencies | MCP audit, source trust levels               |
| LLM04: Data/Model Poisoning      | Poisoned search results lead to bad decisions          | Multi-source verification, authority scoring |
| LLM05: Improper Output Handling  | Research outputs may contain injected content          | Output sanitization, content validation      |
| LLM06: Excessive Agency          | Research agent making unsanctioned external calls      | Source routing by classification, allowlists |
| LLM07: System Prompt Leakage     | Research queries may reveal system prompt details      | Query sanitization, prompt isolation         |
| LLM08: Vector/Embedding Weakness | RAG-based research could be poisoned                   | Source verification, embedding validation    |
| LLM09: Misinformation            | Research produces incorrect findings                   | Convergence loops, multi-source verification |
| LLM10: Unbounded Consumption     | Uncontrolled research depth burns API quota/cost       | Depth limits, budget controls                |

---

## 10. Design Recommendations

### Architecture: Security-Layered Research Pipeline

```
User Research Request
  |
  v
[1. CLASSIFY] -- Determine sensitivity level (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED)
  |
  v
[2. PLAN] -- Decompose into sub-queries
  |
  v
[3. SANITIZE] -- For each sub-query:
  |              - Remove project identifiers
  |              - Generalize specifics
  |              - Decompose sensitive queries into proxy queries
  |
  v
[4. ROUTE] -- Select source based on classification + trust level
  |            - RESTRICTED: local only
  |            - CONFIDENTIAL: local + trusted MCP
  |            - INTERNAL: all sources, sanitized queries
  |            - PUBLIC: all sources, unmodified queries
  |
  v
[5. FETCH] -- Execute queries with:
  |            - HTTPS-only enforcement
  |            - Timeout controls (AbortController)
  |            - SSRF allowlist validation
  |
  v
[6. VALIDATE] -- For fetched content:
  |               - Scan for prompt injection
  |               - Verify source authority
  |               - Cross-reference multiple sources
  |
  v
[7. SYNTHESIZE] -- Combine findings with:
  |                 - Convergence verification
  |                 - Confidence scoring
  |                 - Contradiction flagging
  |
  v
[8. PROTECT OUTPUT] -- Before storing/returning:
  |                    - Sanitize absolute paths
  |                    - Remove session identifiers
  |                    - Apply retention classification
  |                    - Route to appropriate storage (tracked vs gitignored)
  |
  v
[9. AUDIT] -- Log:
               - Classification applied
               - Sources queried (not full query text for CONFIDENTIAL+)
               - Sanitization actions taken
               - Timestamp and retention schedule
```

### Concrete Implementation Recommendations

**R1: Query Sanitization Function**

Build a `sanitizeResearchQuery(query, classification)` function that:

- Scans for project name (`SoNash`, internal identifiers).
- Scans for version-specific details that reveal exact stack.
- Scans for team member names or internal URLs.
- Replaces with generic equivalents based on a configurable mapping.
- Follows the existing `sanitizeError()` / `sanitizeFilename()` helper pattern
  from `scripts/lib/security-helpers.js`.

**R2: Source Router**

Build a `routeQuery(query, classification)` function that:

- Accepts the data classification level.
- Returns the allowed set of sources for that level.
- Blocks external queries for RESTRICTED topics.
- Applies sanitization for INTERNAL topics before routing to external sources.

**R3: Content Isolation for WebFetch**

When processing fetched web content:

- Wrap all fetched content in clear delimiters marking it as untrusted.
- Do not allow fetched content to modify the research plan or trigger new tool
  calls.
- Scan for common prompt injection patterns before presenting to the LLM.
- This aligns with Anthropic's spotlighting technique and OpenAI's instruction
  hierarchy approach.

**R4: Research Output Classification**

Tag all research outputs with their classification level and retention schedule:

```json
{
  "classification": "INTERNAL",
  "created": "2026-03-20T10:00:00Z",
  "retainUntil": "sprint-end",
  "gitTracked": true,
  "sanitized": true
}
```

**R5: Audit Logging**

Log research activity to a local-only file (gitignored) similar to the existing
`hook-runs.jsonl` pattern:

```jsonl
{
  "ts": "2026-03-20T10:00:00Z",
  "classification": "INTERNAL",
  "sources": [
    "WebSearch",
    "Context7"
  ],
  "sanitized": true,
  "queryCount": 3
}
```

**R6: Pre-Commit Hook Integration**

Extend the existing pre-commit hook infrastructure to:

- Scan staged research files for project names in CONFIDENTIAL+ outputs.
- Warn if research outputs classified as CONFIDENTIAL or RESTRICTED are being
  committed.
- Block commits containing raw research transcripts (already partially handled
  by the `agent-research/` gitignore rule).

**R7: Integrate with Existing SSRF Controls**

The `SECURITY_CHECKLIST.md` already defines SSRF allowlist patterns. Extend
these for research:

- Maintain an explicit allowlist of search API endpoints.
- Validate all WebFetch URLs against the allowlist before fetching.
- Enforce HTTPS-only with `AbortController` timeouts (already in the checklist).

---

## Sources

### Query Leakage and Privacy

- [Reducing Privacy Leaks in AI, Microsoft Research](https://www.microsoft.com/en-us/research/blog/reducing-privacy-leaks-in-ai-two-approaches-to-contextual-integrity/)
- [Data Leakage: AI's Plumbing Problem, CrowdStrike](https://www.crowdstrike.com/en-us/blog/data-leakage-ai-plumbing-problem/)
- [Privacy Risks in LLM Reasoning Traces, MarkTechPost](https://www.marktechpost.com/2025/06/25/new-ai-research-reveals-privacy-risks-in-llm-reasoning-traces/)
- [State of Secrets Sprawl 2026, GitGuardian](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/)
- [When Prompts Leak Secrets, Keysight](https://www.keysight.com/blogs/en/tech/nwvs/2025/08/04/pii-disclosure-in-user-request)
- [LLM Data Privacy, Lasso Security](https://www.lasso.security/blog/llm-data-privacy)

### Query Anonymization

- [Anonymising Data for AI Agents, EdgeRed](https://edgered.com.au/anonymising-data-for-ai-agents-using-the-latest-tools-without-risking-privacy/)
- [AnonymAI: Differential Privacy and Intelligent Agents, MDPI](https://www.mdpi.com/1999-5903/18/1/41)
- [Proxy-Terms Based Query Obfuscation, DOAJ](https://doaj.org/article/fead5b6864524e548dd14aff211ab8c8)
- [Privacy-Preserving Crowd-Sourced Web Searches](https://emilianodc.com/PAPERS/pdd-www19.pdf)
- [Preserving User Privacy in Web Search Engines, ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S014036640900125X)

### Prompt Injection and Agent Security

- [Fooling AI Agents: Web-Based Prompt Injection, Palo Alto Unit42](https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/)
- [Hiding Prompts in Plain Sight, Auth0](https://auth0.com/blog/prompt-injection-ai-browser/)
- [Mitigating Prompt Injections in Browser Use, Anthropic](https://www.anthropic.com/research/prompt-injection-defenses)
- [Understanding Prompt Injections, OpenAI](https://openai.com/index/prompt-injections/)
- [Designing Agents to Resist Prompt Injection, OpenAI](https://openai.com/index/designing-agents-to-resist-prompt-injection/)
- [Keeping Data Safe When an AI Agent Clicks a Link, OpenAI](https://openai.com/index/ai-agent-link-safety/)

### AI Agent Threat Landscape

- [Top 5 Real-World AI Security Threats 2025, CSO Online](https://www.csoonline.com/article/4111384/top-5-real-world-ai-security-threats-revealed-in-2025.html)
- [AI Agent Security Landscape 2025, Obsidian Security](https://www.obsidiansecurity.com/blog/ai-agent-market-landscape)
- [Agent-to-Agent Attacks, Security Boulevard](https://securityboulevard.com/2026/03/agent-to-agent-attacks-are-coming-what-api-security-teaches-us-about-securing-ai-systems/)
- [AI Agents Are the Biggest Data Security Threat, Kiteworks](https://www.kiteworks.com/cybersecurity-risk-management/ai-agents-ungoverned-data-security-threat/)
- [Safety and Security for AI Agents, Google ADK](https://google.github.io/adk-docs/safety/)

### MCP Security

- [MCP Security Risks and Controls, Red Hat](https://www.redhat.com/en/blog/model-context-protocol-mcp-understanding-security-risks-and-controls)
- [MCP Security Vulnerabilities 2026, Practical DevSecOps](https://www.practical-devsecops.com/mcp-security-vulnerabilities/)
- [MCP Critical Vulnerabilities, eSentire](https://www.esentire.com/blog/model-context-protocol-security-critical-vulnerabilities-every-ciso-should-address-in-2025)
- [MCP Security Best Practices, Official Spec](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)
- [Timeline of MCP Security Breaches, AuthZed](https://authzed.com/blog/timeline-mcp-breaches)
- [Vulnerable MCP Project Database](https://vulnerablemcp.info/)

### OWASP and Standards

- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/)
- [API Security in the AI Era, Cloud Security Alliance](https://cloudsecurityalliance.org/blog/2025/09/09/api-security-in-the-ai-era)

### Data Classification

- [Microsoft Data Classification Framework](https://learn.microsoft.com/en-us/compliance/assurance/assurance-create-data-classification-framework)
- [Data Classification Overview, Palo Alto Networks](https://www.paloaltonetworks.com/cyberpedia/data-classification)
- [Data Classification Levels, Fortinet](https://www.fortinet.com/resources/cyberglossary/data-classification)

### Compliance

- [GDPR Compliance Challenges 2025, Secure Privacy](https://secureprivacy.ai/blog/ai-gdpr-compliance-challenges-2025)
- [EDPB Opinion on AI and GDPR, Orrick](https://www.orrick.com/en/Insights/2025/03/The-European-Data-Protection-Board-Shares-Opinion-on-How-to-Use-AI-in-Compliance-with-GDPR)
- [CNIL AI System Recommendations](https://www.cnil.fr/en/ai-system-development-cnils-recommendations-to-comply-gdpr)
- [AI Data Protection Compliance Under EU AI Act, Taylor & Francis](https://www.tandfonline.com/doi/full/10.1080/23311886.2025.2560654)

### Data Exfiltration Prevention

- [AI Agent Vulnerabilities: Data Exfiltration, Trend Micro](https://www.trendmicro.com/vinfo/us/security/news/threat-landscape/unveiling-ai-agent-vulnerabilities-part-iii-data-exfiltration)
- [How to Secure AI Agents, Zscaler](https://www.zscaler.com/zpedia/how-to-secure-ai-agents)
- [AI Governance 2025: Data Exfiltration Protection](https://blog.interian.be/2025/05/01/ai-governance-in-2025-protecting-against-data-exfiltration/)

### User Tracking

- [Browser Fingerprinting Research, Texas A&M](https://engineering.tamu.edu/news/2025/06/websites-are-tracking-you-via-browser-fingerprinting.html)
- [Combating Web Tracking, MDPI](https://www.mdpi.com/1999-5903/16/10/363)
