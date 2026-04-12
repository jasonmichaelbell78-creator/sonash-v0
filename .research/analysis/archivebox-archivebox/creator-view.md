# Creator View: ArchiveBox/ArchiveBox

**Analyzed:** 2026-04-12 | **Depth:** Standard | **Analyst:** repo-analysis v4.4

---

## 1. What This Repo Understands (+ Blindspots)

ArchiveBox understands something that most open-source projects never figure
out: the difference between archiving and hoarding. The entire architecture is
built around the insight that web content is ephemeral and that preserving it
requires not one approach but dozens -- PDFs, screenshots, DOM snapshots, WARC
files, SingleFile archives -- because no single format captures the full
experience of a web page. The hook-based plugin system (hooks.py) is the
embodiment of this understanding: each extractor operates independently,
communicates via JSONL stdout, and can be background or foreground.

The CLAUDE.md is quietly one of the best developer onboarding documents in the
Python open-source ecosystem. It encodes philosophy, not just setup. The NO
MOCKS testing standard forces the codebase to remain testable without artificial
seams. The grep-friendly naming convention (fs*\*, log*\*) says "your IDE might
break but grep never will." The "minimize unique names" principle is rare
discipline -- most projects accumulate vocabulary; ArchiveBox constrains it.

The MCP server (archivebox/mcp/) shows AI tool integration at a level most
projects have not reached. Zero manual schema definitions -- they introspect
Click CLI metadata and generate MCP tools dynamically. ~200 lines. Cleanest MCP
implementation in the T29 corpus.

**Blindspots:** Security governance is the obvious gap. OpenSSF 5.2/10, zero
code review enforcement, YAML workflow errors, subprocess calls with f-string
interpolation. For a tool handling arbitrary URLs, subprocess safety (ST-01: 45)
is concerning. Solo-maintainer architecture -- 100% health but 0/29 changesets
reviewed. Type coverage ~48% despite pyright configured.

---

## 2. What is Relevant To Your Work

Three items have direct home applicability:

**MCP auto-discovery pattern** (archivebox/mcp/README.md + server.py) --
JASON-OS Domain 02a is about MCP-native tooling, and ArchiveBox solved "expose
existing CLI as MCP tools without schema duplication." Introspect Click
commands, auto-generate definitions, CliRunner for execution. 200 lines.
Principle portable to Node/TS.

**Hook execution model** (hooks.py docstring) -- naming convention
(on*{EventFamily}\_\_{order}*{name}[.bg].{ext}), 2-digit ordering,
foreground/background with SIGTERM finalization, JSONL stdout contract. More
structured than SoNash settings.json arrays. Complementary to SoNash hook
governance.

**CLAUDE.md structure** -- grep-friendly naming and "minimize unique names"
principle. SoNash scripts/ has 100+ files with inconsistent naming.
Coverage-as-dead-code-detector (JSON+jq for 0% files) relevant to T21 orphan
detection.

**Also:** claude.yml CI workflow -- Claude Code in GitHub Actions. Pattern for
JASON-OS CI/CD domain.

---

## 3. Where Your Approach Differs

**Ahead:** SoNash hook governance (analytics, warnings, audits, 7+ ecosystem
categories). ArchiveBox has better execution model but zero governance.
Pre-commit/pre-push pipeline unmatched.

**Ahead:** SoNash skill system (72+ skills, SKILL.md, CONVENTIONS.md,
self-audit). ArchiveBox plugins powerful but loosely documented.

**Different:** Testing philosophy. ArchiveBox NO MOCKS (real SQLite, real
subprocess). SoNash mocks httpsCallable (Security Rule #1). Both correct for
context. Strict assertions (== not >=) worth adopting.

**Behind:** MCP auto-discovery ahead of SoNash manual MCP config. Deriving tools
from metadata more sustainable.

**Behind:** Coverage infrastructure (passive collection, parallel mode, JSON+jq)
more developed.

---

## 4. The Challenge

Consider whether your hook system should have an execution model, not just a
governance model. SoNash has the best hook governance -- analytics,
acknowledgment gates, warnings, audits. But hooks are flat JSON arrays with no
ordering, no fg/bg distinction, no SIGTERM. ArchiveBox encodes execution
semantics into hook identity. The governance is excellent; the runtime model
could learn from ArchiveBox.

---

## 5. Knowledge Candidates

### T1 -- Active Sprint

| Candidate            | Type      | Novelty | Effort | Why                              |
| -------------------- | --------- | ------- | ------ | -------------------------------- |
| MCP auto-discovery   | knowledge | High    | E1     | JASON-OS Domain 02a              |
| Hook execution model | knowledge | High    | E1     | Runtime complement to governance |
| CLAUDE.md structure  | knowledge | Medium  | E0     | Compare against SoNash           |

### T2 -- Systems

| Candidate             | Type      | Novelty | Effort | Why                    |
| --------------------- | --------- | ------- | ------ | ---------------------- |
| Coverage-as-dead-code | knowledge | Medium  | E0     | T21 orphan detection   |
| Claude Code CI        | knowledge | Medium  | E1     | JASON-OS CI/CD         |
| Strict assertions     | knowledge | Low     | E0     | SoNash test convention |

---

## 6. What is Worth Avoiding

**SOLO_MAINTAINER_GOVERNANCE** -- 27K stars, 0/29 changesets reviewed. If
JASON-OS scales, enforce review from day one.

**PERMISSIVE_DEFAULTS** -- ALLOWED_HOSTS='\*', cookies insecure by default.
SoNash Firebase rules are the right approach.

**CONFIGURED_NOT_ENFORCED_TYPING** -- Pyright at 48% with heavy Any. SoNash
TypeScript strict with no any is correct.
