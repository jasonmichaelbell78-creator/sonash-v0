# Findings: Tool and API Claim Verification

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** V1 (verification pass — 8 claims from repo analysis
research)

---

## Key Findings

### C-005: Trivy Supply Chain Attack — CVE-2026-33634

**Status: VERIFIED with corrections** **Confidence: HIGH**

The CVE-2026-33634 supply chain attack on Trivy is real and well-documented.
However, the original claim that "versions above v0.69.3 [are] compromised" is
accurate but incomplete — multiple additional versions were subsequently
compromised in a continuing attack pattern.

**Full compromise scope:**

- v0.69.4 binary (GitHub, Deb, RPM) — compromised March 19, 2026 via TeamPCP
- v0.69.5 and v0.69.6 Docker Hub images — compromised March 22, 2026
- An attempted v0.70.0 release was stopped before the tag was pushed
- 76 of 77 version tags in `aquasecurity/trivy-action` force-pushed to malware
- All 7 tags in `aquasecurity/setup-trivy` replaced with malicious commits
- Google's Docker Hub mirror (`mirror.gcr.io`) continued serving malicious
  v0.69.6 even after Docker Hub itself removed it — a critical nuance

**CVSS4B score:** 9.4 (near-maximum critical)

**Safe versions (current as of 2026-03-31):**

- Trivy binary: **v0.69.3 or earlier** (confirmed clean via cosign signatures)
- trivy-action: **v0.35.0** (commit `57a97c7`)
- setup-trivy: **v0.2.6** (commit `3fb12ec`)

**Correction to original claim:** The claim stated v0.69.3 is safe (correct),
but did not mention that v0.69.5 and v0.69.6 were also compromised in a
follow-on wave, or that a v0.70.0 attempt was made. The claim understates the
attack surface.

---

### C-003: GitHub API Covers ~40% of Analysis Dimensions Without Cloning

**Status: UNVERIFIABLE — claim is an assertion with no primary source**
**Confidence: LOW**

No source was found that states the GitHub REST API covers "~40% of analysis
dimensions" for repository analysis without cloning. This appears to be a
derived estimate from the original research, not a published benchmark.

**What the GitHub API demonstrably provides without cloning:**

- Repository metadata (name, size, language, stars, forks, open issues, default
  branch)
- Commit statistics and code frequency data
- Traffic data (views, clones, popular referrers) — requires write access
- Dependency graph (via GraphQL, for supported ecosystems)
- Code scanning alerts, secret scanning alerts
- Workflow run history and status
- Release and tag listings
- Contributors list and commit activity

The API is actively updated — the current API version is `2026-03-10`. The
endpoint categories are: repos, contents, statistics, traffic, secret scanning,
webhooks, actions, releases.

**Assessment:** The API provides genuine breadth for metadata, activity, and
security signal dimensions. Whether this constitutes "~40%" of a specific
dimension framework is unverifiable without a defined dimension list. The 40%
figure should be treated as an unverified estimate unless the specific scoring
rubric is cited.

---

### C-008: OpenSSF Scorecard Public API Covers 1M+ Repos

**Status: VERIFIED** **Confidence: HIGH**

The OpenSSF Scorecard API at `https://api.securityscorecards.dev` is confirmed
operational. Evidence:

- The endpoint resolves and returns valid API documentation [3, 4]
- OpenSSF runs weekly Scorecard scans of "the 1 million most critical open
  source projects" based on dependency graph analysis [4, 5]
- Results are published to a BigQuery public dataset
  (`openssf:scorecardcron.scorecard-v2`)
- API usage is documented with working example:
  `GET https://api.securityscorecards.dev/projects/github.com/sirupsen/logrus`
- Projects confirmed covered include Envoy, TensorFlow, and Flutter
- CISA lists OpenSSF Scorecard as an active resource/tool [6]

The API appears fully operational as of March 2026.

---

### C-010: Knip Has an MCP Server (@knip/mcp)

**Status: VERIFIED** **Confidence: HIGH**

The `@knip/mcp` package exists on npm and is an official Knip package (not a
third-party wrapper). Evidence:

- Package is listed at `https://www.npmjs.com/package/@knip/mcp`
- Latest version: **0.0.23**, published approximately 3 days ago (active
  development)
- Listed as an official Knip package alongside `@knip/create-config` and
  `@knip/language-server`
- The Knip VS Code Extension bundles the MCP Server
- All Knip documentation pages are exposed as MCP resources via
  `knip://docs/{topic}`
- Install: `npm i @knip/mcp`

A separate community implementation also exists:
`github.com/gtrias/knip-mcp-server` but the official `@knip/mcp` package is the
canonical one.

---

### C-011: jscpd Has an MCP Server

**Status: VERIFIED** **Confidence: MEDIUM**

jscpd does implement MCP support allowing AI assistants like Claude to check
code for duplications directly. Evidence:

- Official jscpd website (`jscpd.dev`) lists MCP as a "New" feature
- The npm package was updated as recently as January 30, 2026, indicating active
  maintenance
- MCP integration is described as allowing AI assistants to invoke duplication
  checks directly without leaving the assistant context
- jscpd supports 150+ languages and uses Rabin-Karp algorithm

**Caveat:** No dedicated `@jscpd/mcp` package was found separately on npm — the
MCP support may be bundled into the core `jscpd` package rather than published
as a standalone package. Confidence is MEDIUM rather than HIGH because the exact
package name or entrypoint for the MCP server was not confirmed from a package
registry listing.

---

### C-013: CodeClimate Redirects to qlty.sh

**Status: PARTIALLY VERIFIED — claim is directionally correct but imprecise**
**Confidence: MEDIUM**

CodeClimate's Quality product has been spun out into a new independent company
called **Qlty Software**, accessible at `qlty.sh`. However, this is not a simple
"redirect" and calling it an acquisition is incorrect:

- Code Climate did NOT get acquired — the Quality product line was **spun out**
  into a separate company
- Code Climate itself continues to exist, focused on "software engineering
  intelligence"
- Qlty Software is the rebrand/spinout for what was previously Code Climate
  Quality
- `codeclimate.com/blog` announced: "Code Climate Quality is Now Qlty Software"
- Migration documentation exists at `docs.qlty.sh/migration/overview`
- The `codeclimate.com` domain appears to remain active (docs are at
  `docs.codeclimate.com` which redirects to Qlty docs)

**Correction to original claim:** It is not a straight "redirect." CodeClimate
as a brand persists. The Quality product became Qlty. Users are directed to
migrate. The claim's spirit is correct but the mechanics are imprecise.

---

### C-014: DORA Expanded to 5 Metrics in October 2025

**Status: VERIFIED with clarifications** **Confidence: HIGH**

DORA did officially expand to 5 metrics, and the announcement was in
October 2025. Evidence:

- CD Foundation blog post dated **October 16, 2025**: "The DORA 4 key metrics
  become 5"
- The 5th metric is **Rework Rate**: the ratio of unplanned deployments caused
  by production incidents (bugs)
- Rework Rate was first introduced in the **2024 DORA Report** without
  benchmarks; official benchmarks were published in the **2025 DORA Report**

**The 5 official DORA metrics as of October 2025:**

1. Deployment Frequency (Throughput)
2. Lead Time for Changes (Throughput)
3. Failed Deployment Recovery Time (formerly "Time to Restore Service")
   (Throughput)
4. Change Failure Rate (Instability)
5. **Rework Rate** (Instability) — NEW

**Clarification on "Reliability":** Some sources note Reliability as a sixth
quasi-metric added in 2021, but it is not counted as a formal 5th metric —
Rework Rate is. The claim's characterization of October 2025 timing and "5
metrics" is accurate.

---

### C-016: scc Computes LLM Cost-to-Regenerate (LOCOMO)

**Status: VERIFIED** **Confidence: HIGH**

The LOCOMO (LLM Output COst MOdel) feature is confirmed real and actively
available in scc. Evidence directly from the scc GitHub repository README:

**Available CLI flags:**

- `--locomo` — enable LOCOMO cost estimation
- `--locomo-preset` — model preset (large/medium/small/local, default: "medium")
- `--locomo-input-price` — cost per 1M input tokens in dollars
- `--locomo-output-price` — cost per 1M output tokens in dollars
- `--locomo-cycles` — override estimated LLM iteration cycles
- `--locomo-review` — human review minutes per line of code (default: 0.01)
- `--locomo-tps` — output tokens per second
- `--locomo-config` — power-user configuration string
- `--cost-comparison` — display both COCOMO and LOCOMO estimates side by side

LOCOMO uses SLOC and complexity data already computed by scc, estimating
per-file: output tokens (~10 LLM output tokens per line of code, configurable)
and input tokens scaled by branch complexity. The tool explicitly positions
itself as a COCOMO counterpart for the LLM era.

The claim's description is accurate. The feature name "LOCOMO" is the real
acronym used by the project.

---

## Sources

| #   | URL                                                                                                                              | Title                                                | Type                           | Trust  | CRAAP     | Date       |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------ | ------ | --------- | ---------- |
| 1   | https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23                                                    | Trivy ecosystem supply chain temporarily compromised | Official advisory              | HIGH   | 5/5/5/5/5 | 2026-03    |
| 2   | https://nvd.nist.gov/vuln/detail/CVE-2026-33634                                                                                  | CVE-2026-33634 Detail — NVD                          | Government CVE database        | HIGH   | 5/5/5/5/5 | 2026-03    |
| 3   | https://api.securityscorecards.dev/                                                                                              | OpenSSF Scorecard API                                | Official API                   | HIGH   | 4/5/5/5/5 | 2026       |
| 4   | https://www.endorlabs.com/learn/introducing-the-openssf-scorecard-api                                                            | Introducing the OpenSSF Scorecard API                | Tech blog                      | MEDIUM | 4/4/4/4/4 | 2025       |
| 5   | https://github.com/ossf/scorecard                                                                                                | OpenSSF Scorecard GitHub                             | Official repo                  | HIGH   | 5/5/5/5/5 | 2026       |
| 6   | https://www.cisa.gov/resources-tools/services/openssf-scorecard                                                                  | OpenSSF Scorecard — CISA                             | Government listing             | HIGH   | 5/4/5/5/5 | 2025       |
| 7   | https://www.npmjs.com/package/@knip/mcp                                                                                          | @knip/mcp — npm                                      | Official package registry      | HIGH   | 5/5/5/5/5 | 2026-03    |
| 8   | https://github.com/webpro-nl/knip                                                                                                | Knip GitHub                                          | Official repo                  | HIGH   | 5/5/5/5/5 | 2026       |
| 9   | https://jscpd.dev                                                                                                                | jscpd official site                                  | Official product site          | HIGH   | 4/5/5/4/5 | 2026       |
| 10  | https://codeclimate.com/blog/code-climate-quality-is-now-qlty-software                                                           | Code Climate Quality is Now Qlty Software            | Official announcement          | HIGH   | 5/5/5/5/5 | 2025       |
| 11  | https://docs.qlty.sh/migration/overview                                                                                          | Migration Overview — Qlty Docs                       | Official docs                  | HIGH   | 5/5/5/5/5 | 2025       |
| 12  | https://cd.foundation/blog/2025/10/16/dora-5-metrics/                                                                            | The DORA 4 key metrics become 5 — CD Foundation      | Industry foundation blog       | HIGH   | 5/5/4/4/5 | 2025-10-16 |
| 13  | https://www.faros.ai/blog/5th-dora-metric-rework-rate-track-it-now                                                               | Rework Rate is Here: 5th DORA Metric                 | Tech blog                      | MEDIUM | 4/4/4/4/4 | 2025       |
| 14  | https://github.com/boyter/scc                                                                                                    | scc — Sloc Cloc Code GitHub                          | Official repo                  | HIGH   | 5/5/5/5/5 | 2026       |
| 15  | https://docs.github.com/en/rest/repos/repos                                                                                      | REST API endpoints for repositories                  | Official docs                  | HIGH   | 5/5/5/5/5 | 2026-03    |
| 16  | https://www.microsoft.com/en-us/security/blog/2026/03/24/detecting-investigating-defending-against-trivy-supply-chain-compromise | Microsoft Trivy Supply Chain Guidance                | Microsoft Security Blog        | HIGH   | 5/5/5/5/4 | 2026-03-24 |
| 17  | https://github.com/aquasecurity/trivy/discussions/10425                                                                          | Trivy Security incident 2026-03-19 (Discussion)      | Official maintainer discussion | HIGH   | 5/5/5/5/5 | 2026-03    |

---

## Contradictions

**C-005 (Trivy) — Safe version boundary:** Multiple sources agree v0.69.3 is
safe and v0.69.4 onward is compromised. One source noted Google's
`mirror.gcr.io` continued serving v0.69.6 even after Docker Hub removal — this
is not a contradiction between sources but an important nuance that the "safe"
state depends on which registry is used for pulling.

**C-013 (CodeClimate) — "Redirect" vs "spinout":** The original claim says
CodeClimate "redirects to qlty.sh" which implies a simple domain redirect. The
reality is more complex: CodeClimate the company still exists but launched a
spinout company. This is not a contradiction between verification sources — all
sources agree on the spinout characterization — but it is a contradiction
between the claim's framing and reality.

**C-014 (DORA) — 5th metric identity:** Some sources cite Reliability
(added 2021) as the 5th metric; others cite Rework Rate (added 2024-2025) as the
5th. The CD Foundation's October 2025 announcement explicitly frames Rework Rate
as the new 5th formal metric, with Reliability being a quasi-metric outside the
core set.

---

## Gaps

**C-003 (GitHub API 40% claim):** No primary source was found validating the
"~40%" figure. This appears to be a synthesis estimate made during the research
process, not an externally cited benchmark. It is not falsifiable as stated
without a defined dimension matrix. The claim should either be sourced to a
specific framework or reframed as an estimate.

**C-011 (jscpd MCP):** The exact package name/entrypoint for jscpd's MCP server
was not confirmed. The official site references MCP capability, but whether this
is a separate npm package (`@jscpd/mcp`) or built into the core package is
unclear. This warrants a direct check of `npmjs.com/package/jscpd` or the jscpd
GitHub releases.

**Trivy current safe version after v0.69.3:** As of the research date
(2026-03-31), no clean release above v0.69.3 has been confirmed. The attack
appears still recent enough that Aqua Security has not yet published a
verified-clean v0.70+. Users should monitor
`github.com/aquasecurity/trivy/releases` for a verified post-attack release.

---

## Serendipity

**Trivy mirror hazard:** Google's `mirror.gcr.io` is containerd's default
registry mirror and was still serving the malicious Trivy v0.69.6 image even
after Docker Hub cleaned up. Any repo-analysis skill that uses Trivy via
containerd defaults (Kubernetes environments) may be pulling a compromised image
even after pin-to-tag remediation. The correct remediation is pin-to-digest, not
pin-to-tag.

**DORA 2025 Report context:** The 2025 DORA Report is specifically framed around
AI-assisted software delivery, making its metrics evolution highly relevant to
any repo-analysis skill that tracks developer productivity dimensions.

**jscpd active development signal:** The January 30, 2026 npm update date is a
strong signal that jscpd remains production-viable, contrary to any concern that
it might be an unmaintained project.

---

## Confidence Assessment

- HIGH claims: 5 (C-005, C-008, C-010, C-014, C-016)
- MEDIUM claims: 2 (C-011, C-013)
- LOW claims: 0
- UNVERIFIED claims: 1 (C-003 — the 40% figure)
- Overall confidence: **HIGH** (7 of 8 claims substantially verified; 1 claim is
  unverifiable without a dimension matrix)
