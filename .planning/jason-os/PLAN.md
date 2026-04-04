# Research Roadmap: JASON-OS

## Summary

A 16-domain research program to build the knowledge foundation for JASON-OS — a
portable Claude Code operating system extracted from SoNash. Research is
sequenced in tiers: foundational domains first, then domain-specific, with
ongoing cross-domain synthesis. Each domain is multi-phased (scope → research →
gate). All artifacts are git-tracked for cross-locale persistence.

**Decisions:** See DECISIONS.md (32 decisions) **Prior art:** See
[BRAINSTORM.md](../../.research/jason-os/BRAINSTORM.md) (chosen direction:
Template → Platform)

## File Structure

```
.planning/jason-os/
├── DECISIONS.md               (complete — this plan's decisions)
├── PLAN.md                    (this file — research roadmap)
├── RESEARCH_ROADMAP.md        (living orchestration artifact — status tracker)
├── SYNTHESIS.md               (rolling cross-domain findings)
└── DEPENDENCIES.md            (living cross-domain dependency map)

.research/jason-os/
├── BRAINSTORM.md              (complete — moved from .planning/ during R&D migration)
├── 01-internal-archaeology/   (domain research outputs)
├── 02-external-landscape/
├── 02a-adoption-scouting/
├── 03-existing-work/
├── 04-design-philosophy/
├── 05-architecture-patterns/
├── 06-extraction-portability/
├── 07-sync-distribution/
├── 08-template-design/
├── 09-memory-state/
├── 10-security-trust/
├── 11-testing-validation/
├── 12-evolution-versioning/
├── 13-project-onboarding/
├── 14-cli-platform/
├── 15-ux-orchestrators/
├── 16-community-distribution/
└── (new domains inserted as NN-a)
```

---

## Research Protocol (Per Domain)

Every domain follows this protocol (per Decisions #23, #24):

### Phase A: Scoping

- Define what specifically to research within this domain
- Identify sub-questions for /deep-research decomposition
- Check prior art: existing .research/ and .planning/ artifacts to ingest
- Check DEPENDENCIES.md for inputs needed from other domains
- **Adoption check (per Decision #34):** Check Domain 02a scouting findings for
  entries classified under this domain. Ingest as prior art. If a finding
  directly answers a research question, note it and reduce scope. If a finding
  suggests an alternative approach, include it as a candidate direction.
- Present scope to user for approval before executing

### Phase B: Research Execution

- Run /deep-research with domain-specific sub-questions
- Full pipeline: searcher agents → synthesis → verification → contrarian + OTB
  challenges → dispute resolution → gap pursuit (as warranted)
- No artificial limits on agents, passes, or depth

### Phase C: Domain Gate

- Update SYNTHESIS.md with key findings
- Update DEPENDENCIES.md with newly discovered cross-domain connections
- Compare findings against all prior domain conclusions
- Flag any contradictions with prior domains
- If contradictions found: present to user, decide whether to revisit prior
  domain or accept the contradiction
- Commit all artifacts to git (cross-locale persistence, per Decision #26)

### Phase D: Reassessment Check

- After every 3rd domain (per Decision #31): full roadmap reassessment
- After any domain that contradicts prior findings: immediate reassessment
- After any domain that reveals a new domain is needed: present to user, decide
  add/park/absorb (per Decision #27 — never limit ourselves)

---

## Tier 1: Foundation (Domains 1-4)

These domains must complete before domain-specific research begins. They
establish what we have, what exists externally, what prior work to build on, and
what JASON-OS fundamentally is.

### Domain 01: Internal Archaeology

**Purpose:** Comprehensive inventory of every skill, agent, hook, script, and
infrastructure component in the SoNash repo. Not a surface scan — a deep catalog
with dependencies, quality assessment, and portability classification.

**Why first:** Every other domain references "what's in the repo." Wrong
assumptions here cascade everywhere.

**Scope includes:**

- Every skill: purpose, quality, dependencies, portability classification
- Every agent: capabilities, project-specific references, cross-agent deps
- Every hook: function, what triggers it, what it gates, portability
- Every script in scripts/: role, dependencies, portability
- Every scripts/lib/ helper: consumers, portability
- CLAUDE.md section-by-section analysis: what's portable vs project-specific
- settings.json hook configuration architecture
- Interdependency graph: what calls what, what feeds what

**Prior art to ingest:** Brainstorm Explore agent output (surface-level
portability split). Custom-agents research (agent ecosystem analysis).

**Estimated scope:** Large — will need multiple agent waves to cover 67 skills,
37 agents, 21 hooks, 50+ scripts.

**Depends on:** Nothing — this is the starting point. **Feeds into:** Every
subsequent domain.

---

### Domain 02: External Landscape

**Purpose:** Comprehensive survey of how other projects solve the problems
JASON-OS is trying to solve. Claude Code projects, non-Claude portable dev
environments, config-as-code, scaffolding tools, plugins, CLIs.

**Why early:** Understanding prior art prevents reinventing solved problems and
reveals approaches we haven't considered.

**Scope includes:**

- Claude Code community projects (claude-pipeline, SuperClaude, starter kits,
  awesome-claude-code ecosystem) — deep analysis, not just listing
- Non-Claude portable dev environments (devcontainers, Nix, dotfiles managers
  like chezmoi/stow/yadm)
- Config-as-code tools (Terraform, Ansible, Puppet) — how they handle
  distribution, sync, versioning
- Scaffolding/template systems (create-next-app, Yeoman, cookiecutter, copier,
  npm create) — first-run UX, template evolution
- Claude Code plugin architecture — deep dive into capabilities, constraints,
  what can and can't be distributed
- AgentSkills open standard — cross-tool portability potential

**Prior art to ingest:** Brainstorm deep-research-searcher findings (landscape
summary). AgentSkills discovery.

**Estimated scope:** Large — broad web research across multiple sub-domains.

**Depends on:** Nothing — independent of Domain 01. **Feeds into:** Domains 05,
07, 08, 12, 13, 14, 15, 16.

**Note:** Domains 01 and 02 can run in parallel (per Decision #27 — tier-based,
not strict sequence).

---

### Domain 02a: External Adoption Scouting

**Purpose:** Discover specific external repos, skills, agents, and patterns that
represent additive or replacement improvements to the JASON-OS ecosystem. Unlike
Domain 02 (which surveys approaches conceptually), this domain evaluates
concrete implementations for adoption potential.

**Why in Tier 1:** Scouting findings inform every subsequent domain. A better
sync mechanism found in Domain 02a changes Domain 07's scope. A superior
template pattern changes Domain 08. Discoveries must be available before
domain-specific research begins.

**Primary tool:** `/repo-analysis` skill — used to scan external repos for
health assessment and value extraction. Findings classified as:

- **Additive:** Capability we don't have (new skill, new pattern, new approach)
- **Replacement:** Better implementation of something we already have
- **Inspirational:** Interesting approach worth adapting but not directly
  portable

**Scope includes:**

- Scan repos discovered through research, community, or manual exploration
- Classify each finding by type (additive/replacement/inspirational) and target
  domain (which JASON-OS research domain it informs)
- Maintain a living catalog of evaluated repos and their findings
- Feed classified findings into the Cross-Cutting Adoption Protocol (see below)

**Nature:** Unlike other domains, 02a is **ongoing** — it doesn't have a single
research phase and gate. New repos can be scouted at any time. The domain is
"gated" when the operator decides the catalog is sufficient for implementation
planning.

**Prior art to ingest:** Current repo-analysis runs (in progress as of
2026-04-03), Codex plugin analysis, awesome-claude-code ecosystem data.

**Estimated scope:** Ongoing/incremental — each repo-analysis run adds to the
catalog.

**Depends on:** Nothing — independent, runs alongside all other domains. **Feeds
into:** ALL subsequent domains via Cross-Cutting Adoption Protocol.

---

### Cross-Cutting Adoption Protocol

Added to the Research Protocol (Phase A) for every domain:

> **Adoption check (MUST):** Before scoping domain-specific research, check
> Domain 02a findings for entries classified under this domain. Ingest relevant
> scouting findings as prior art. If a scouting finding directly answers a
> research question, note it and reduce scope accordingly. If a finding suggests
> an alternative approach, include it as a candidate direction.

This ensures repo-analysis discoveries are consumed everywhere, not siloed in a
single domain.

---

### Domain 03: Existing Work Evaluation

**Purpose:** Deep evaluation of every plan and research directory in the repo to
determine what feeds into JASON-OS, what should be completed first, what should
be absorbed, and what stays SoNash-only. Includes SWS (per user correction — SWS
standardization goals are directly relevant).

**Why early:** The operator has extensive prior research (multi-layer-memory: 41
agents, 128 claims; custom-agents: 111 claims; repo-analysis: 184 claims) and
plans (SWS: 92 decisions; plan-orchestration; research-discovery-standard).
Starting JASON-OS research without absorbing this work wastes hundreds of
agents' worth of findings.

**Scope includes:**

- Every .planning/ directory: status, relevance to JASON-OS, completion level
- Every .research/ directory: status, relevance, findings to absorb
- SWS plan: which standardization goals become OS standards vs SoNash-only
- For each artifact: classify as (a) absorb into JASON-OS domain, (b) complete
  before extraction, (c) SoNash-only, (d) abandon
- Dependency map: does completing X unblock JASON-OS work?

**Prior art to ingest:** Brainstorm triage agent output (HIGH/MEDIUM/LOW
classification — starting point, not final answer).

**Estimated scope:** Medium — reading and classifying existing files, not
generating new research.

**Depends on:** None strictly, but benefits from Domain 01 findings (knowing
what's in the repo helps evaluate plans about the repo). **Feeds into:** All
subsequent domains (determines what prior art to ingest).

---

### Domain 04: Design Philosophy

**Purpose:** Define what JASON-OS fundamentally is. OS vs toolkit vs framework.
What principles guide its design. How it should feel to use. What makes it
distinctly JASON-OS vs another Claude Code starter kit.

**Why in Tier 1:** Identity decisions shape every downstream domain. If the
philosophy says "OS = always adapts to your project," that changes sync,
onboarding, template design, and architecture differently than "OS = opinionated
starter kit."

**Scope includes:**

- OS vs toolkit vs framework vs platform — what's the right framing
- Design principles for no-code orchestrator tools
- Learning/adaptation mechanisms — how does the OS improve from use
- What the community projects (claude-pipeline, SuperClaude) got right/wrong
  (informed by Domain 02 findings)
- The operator's identity and values as design inputs
- What "portable" means operationally — everything works everywhere, or core
  works everywhere with extensions per project

**Prior art to ingest:** [BRAINSTORM.md](../../.research/jason-os/BRAINSTORM.md)
(anti-goals, chosen direction, operator identity as no-code vibe coder).

**Estimated scope:** Medium — mix of external research and internal reflection.

**Depends on:** Benefits from Domain 02 (external landscape informs philosophy).
**Feeds into:** Domains 05, 08, 09, 13, 15.

---

## Reassessment Checkpoint 1

After Tier 1 (Domains 01-04) completes:

- Full SYNTHESIS.md update with cross-domain findings
- DEPENDENCIES.md populated with discovered connections
- Roadmap reassessment: Are the Tier 2-3 domains still the right ones? Right
  order? Right scope? Any new domains needed?
- User gate: proceed with Tier 2 as planned, resequence, or revise.

---

## Tier 2: Core Technical Domains (Domains 5-12)

These domains address the specific technical questions JASON-OS must answer.
Order is suggested, not rigid. Sync is weighted first (per Decision #28).

### Domain 05: Architecture Patterns

**Purpose:** How should the OS be architecturally structured? Core vs modules vs
project overrides. Layering model. Extension points.

**Depends on:** 01 (what exists), 02 (how others layer), 04 (philosophy).
**Feeds into:** 06, 07, 08, 14.

---

### Domain 06: Extraction & Portability

**Purpose:** Technical approaches to stripping project-specific references.
sonash-context → project-context. Automated vs manual. What stays, what goes.

**Depends on:** 01 (full inventory), 05 (architecture — what's core vs module).
**Feeds into:** 08, 11.

---

### Domain 07: Sync & Distribution

**Purpose:** The #1 pain point. Technical sync mechanisms. Bidirectional
patterns. Plugin reload. Custom tooling. What works, what fails. This domain
gets extra depth — it's the make-or-break for the template→platform transition.

**Depends on:** 01 (what needs syncing), 02 (how others sync), 05 (architecture
constrains sync approach). **Feeds into:** 08, 12, 14.

---

### Domain 08: Template Design

**Purpose:** Practical design for the short-term GitHub template. CLAUDE.md
architecture, settings.json structure, first-run experience skeleton.

**Depends on:** 01, 05, 06, 07 (needs architecture, extraction, sync decisions
to design the template). **Feeds into:** 13.

---

### Domain 09: Memory & State Persistence

**Purpose:** How the OS maintains awareness across sessions and projects.
Context persistence. Project recognition. Convention memory.

**Prior art:** Multi-layer-memory research (41 agents, 128 claims — ingest,
don't redo).

**Depends on:** 01 (current memory architecture), 05 (where memory fits in
layers). **Feeds into:** 07, 14.

---

### Domain 10: Security & Trust

**Purpose:** Hook permissions, MCP credentials, API keys, trust boundaries in a
portable context. Can't ship your secrets with the template.

**Depends on:** 01 (current security architecture), 05 (what's core vs
project-specific security). **Feeds into:** 08, 13.

---

### Domain 11: Testing & Validation

**Purpose:** How to verify the OS works when dropped into a new project.
Extraction didn't break interdependencies. Skills function without SoNash
infrastructure.

**Depends on:** 06 (what was extracted), 08 (template structure to test).
**Feeds into:** 12.

---

### Domain 12: Evolution & Versioning

**Purpose:** How the OS evolves over time. Version management. Breaking changes.
Upgrade paths. Related to sync but focused on temporal evolution rather than
spatial distribution.

**Depends on:** 07 (sync mechanisms constrain versioning), 05 (architecture
determines what can change independently). **Feeds into:** 14.

---

## Reassessment Checkpoint 2

After Tier 2 (Domains 05-12) completes:

- Major SYNTHESIS.md update
- DEPENDENCIES.md refined
- Roadmap reassessment for Tier 3
- User gate: proceed, resequence, revise, or declare research sufficient

---

## Tier 3: Experience & Distribution (Domains 13-16)

These domains address how JASON-OS is used, discovered, and adopted. They depend
on core technical decisions being at least directionally resolved.

### Domain 13: Project Onboarding

**Purpose:** First-run interactive experience. /jason-os:init design. Stack
adaptation. What questions to ask, what to generate.

**Depends on:** 08 (template design), 10 (security — what to ask about
credentials), 04 (philosophy — how opinionated). **Feeds into:** 15.

---

### Domain 14: CLI & Platform Architecture

**Purpose:** CLI framework, commands, integration with Claude Code. The
medium-term platform deliverable.

**Depends on:** 07 (sync — CLI implements sync), 12 (versioning — CLI manages
versions), 09 (memory — CLI manages state), 05 (architecture — CLI reflects the
layering model). **Feeds into:** 15.

---

### Domain 15: UX for Orchestrators

**Purpose:** How no-code/vibe-coder users interact with the OS. CLI usability
for non-developers. Error messages, help systems, progressive disclosure.

**Depends on:** 14 (CLI design exists to evaluate UX against), 13 (onboarding
UX), 04 (philosophy — who is this for). **Feeds into:** 16.

---

### Domain 16: Community & Distribution

**Purpose:** Plugin discovery, marketplace, adoptability, documentation for
external users. Lightweight — enough to avoid designing into a corner.

**Depends on:** 14 (CLI as distribution vehicle), 15 (UX for external users), 08
(template as distribution vehicle). **Feeds into:** (terminal domain — feeds
into implementation planning).

---

## Reassessment Checkpoint 3 (Final)

After Tier 3 completes:

- Final SYNTHESIS.md — comprehensive cross-domain research summary
- Final DEPENDENCIES.md
- All 16 domains gated and committed
- Decision: research is sufficient → proceed to /deep-plan for implementation OR
  identify remaining gaps → additional research

---

## Orchestration Artifacts

### RESEARCH_ROADMAP.md (create at Step 1)

Living status tracker. Updated after every domain phase. Contains:

- Domain list with status (not started / scoping / researching / gated / done)
- Current tier and position
- Key milestones reached
- Next action
- Blocked domains (waiting on dependency)

### SYNTHESIS.md (create at first domain gate)

Rolling cross-domain findings. Not a copy of each RESEARCH_OUTPUT.md — a curated
synthesis of insights that span domains or change the project's understanding.
Updated at every domain gate.

### DEPENDENCIES.md (create at Step 1)

Living dependency map. Shows:

- Domain → domain dependencies (what must come before what)
- Cross-domain findings (Domain X finding changes Domain Y's scope)
- Contradictions discovered and how they were resolved

---

## Step 1: Initialize Orchestration Artifacts

Create RESEARCH_ROADMAP.md, DEPENDENCIES.md with initial structure. Populate
domain list with status "not started." Populate preliminary dependency graph
from this plan.

**Done when:** Three orchestration artifacts exist and are committed to git.
**Depends on:** Plan approval.

---

## Step 2: Execute Tier 1 (Domains 01-04)

Execute each domain following the Research Protocol (Phase A-D). Domains 01, 02,
and 02a can run in parallel across sessions (independent). Domain 03 benefits
from 01 but can start concurrently. Domain 04 benefits from 02 but can start
after 02's initial findings are available. Domain 02a is ongoing — repo-analysis
findings accumulate over time and feed into every subsequent domain via the
Cross-Cutting Adoption Protocol.

**Suggested grouping (flexible):**

- Session N: Domain 01 (Internal Archaeology) — large, may span 2+ sessions
- Session N (parallel if second locale): Domain 02 (External Landscape)
- Ongoing: Domain 02a (External Adoption Scouting) — runs alongside other work
- After 01 initial findings: Domain 03 (Existing Work Evaluation)
- After 02 initial findings: Domain 04 (Design Philosophy)

**Done when:** All 5 domains gated (02a may remain open as ongoing),
SYNTHESIS.md updated, Checkpoint 1 complete. **Depends on:** Step 1.

---

## Step 3: Reassessment Checkpoint 1

Review Tier 1 findings. Validate Tier 2 domains and sequencing. Add/remove/
resequence as needed. User gate.

**Done when:** User approves Tier 2 plan (as-is or modified). **Depends on:**
Step 2.

---

## Step 4: Execute Tier 2 (Domains 05-12)

Execute domains in suggested order, respecting dependencies. Some domains can
run in parallel where dependencies allow.

**Parallelization opportunities:**

- 05 (Architecture) and 09 (Memory) can start concurrently
- 06 (Extraction) and 10 (Security) can run after 05 completes
- 07 (Sync) after 05 completes — priority #1
- 08 (Template) after 06 + 07
- 11 (Testing) after 06 + 08
- 12 (Evolution) after 07

**Done when:** All 8 domains gated, SYNTHESIS.md updated, Checkpoint 2 complete.
**Depends on:** Step 3.

---

## Step 5: Reassessment Checkpoint 2

Review Tier 2 findings. Validate Tier 3 domains. Assess whether research is
already sufficient for implementation planning. User gate.

**Done when:** User approves Tier 3 plan or declares research sufficient.
**Depends on:** Step 4.

---

## Step 6: Execute Tier 3 (Domains 13-16)

Execute experience and distribution domains. These are informed by all prior
technical research.

**Done when:** All 4 domains gated, final SYNTHESIS.md, Checkpoint 3 complete.
**Depends on:** Step 5.

---

## Step 7: Final Synthesis & Routing

Compile final SYNTHESIS.md. Review all DEPENDENCIES.md entries. Present research
program summary to user.

Route to: `/deep-plan JASON-OS implementation` — the build plan that turns
research findings into the actual template and eventually the platform.

**Done when:** User routes to implementation planning. **Depends on:** Step 6.

---

## Audit Checkpoint

After each tier and at program completion: review SYNTHESIS.md for internal
consistency, verify all domain gates were honored, confirm all prior-art
injections occurred, check that contradictions were resolved.
