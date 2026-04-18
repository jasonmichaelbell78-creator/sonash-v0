# Findings: Developer-Portal Catalogs for JASON-OS Solo-Dev Portability Tracking

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-04-17 **Sub-Question IDs:** D4

---

## Summary

**Bottom line up front:** Every major developer portal catalog tool in this
space (Backstage, Port, Cortex, Roadie, OpsLevel, LeanIX) was built for
multi-team enterprise microservice governance. None of them fit JASON-OS's
solo-developer, file-level, cross-project portability tracking use case without
significant friction or fundamental mismatch. Backstage comes closest in schema
flexibility, but its operational overhead on Windows (WSL required, 6 GB RAM
minimum, Docker preferred, weeks of setup) makes it overkill for one person
tracking `.claude/agents/`, `.claude/skills/`, and workflow files across
projects. The honest verdict: **none of these tools are the right fit.** The
only partial exceptions are Port's SaaS free tier (flexible schema, 10K entity
limit, but SaaS-only) and a DIY "minimum viable catalog" pattern using flat
YAML + a graph script.

---

## Key Findings

### 1. Backstage: Most Flexible Schema, Prohibitive Solo-Dev Overhead [CONFIDENCE: HIGH]

Backstage (spotify/backstage, Apache-2.0 licensed) uses `catalog-info.yaml`
files with nine built-in entity kinds: Component, API, Group, User, Resource,
System, Domain, Template, and Location. Custom kinds are supported — you
implement a `CatalogProcessor` class, write a JSON schema, and add the kind to
an allowlist in `app-config.yaml`. In theory, you could create `kind: Workflow`
or `kind: Skill` entities and wire them with `dependsOn` / `dependencyOf`
relations. The catalog builds a directed graph with nodes as entities and typed
edges as relations. There is a `@backstage/plugin-catalog-graph` visualization
plugin that renders this as an interactive graph.

However, the operational reality for a solo Windows developer is the blocker:

- **Windows is not natively supported.** The official getting-started docs
  explicitly require "a Unix-based operating system, such as Linux, macOS or
  Windows Subsystem for Linux." WSL is the workaround, adding friction.
- **Minimum hardware:** 6 GB RAM, 20 GB disk, build toolchain (make, yarn, Node
  22+).
- **Docker is de facto required** for realistic deployment (worker containers,
  separate ingestion processes).
- **Production-grade setup time:** The Roadie self-hosting analysis estimates
  16–100 engineering weeks for various production concerns. Even for
  exploration, the getting-started path is non-trivial.
- **Auto-update on file change:** Backstage supports GitHub webhooks
  (`github.push` events via `EventsService`) for catalog synchronization — but
  this is webhook-from-GitHub, not a local filesystem watcher. Local files
  without a connected GitHub remote get no automatic updates.
- **File-as-entity:** No built-in support. A file is not a first-class entity
  kind. You could model one via a custom kind, but you lose all built-in UI
  support — the Backstage UI won't know how to render your custom `Skill` entity
  cards without additional plugin development.
- **Cross-project portability tracking:** Technically possible via
  `metadata.tags` and custom `spec.portableIn: [projectA, projectB, projectC]`
  fields, but there is no out-of-box mechanism to query this. You'd build a
  custom plugin.
- **Directory scan / auto-populate:** Backstage's GitHub discovery processor can
  scan a GitHub org for `catalog-info.yaml` files and auto-register them. There
  is no local filesystem discovery for non-SCM-backed files.

**Assessment:** Backstage is the most schema-flexible option, but it is
enterprise infrastructure that happens to be OSS. For JASON-OS, it would consume
more maintenance time than the portability problem it solves.

Sources: [1][2][3][5][7][8]

---

### 2. Port: Best Schema Flexibility, SaaS-Only Blocker [CONFIDENCE: HIGH]

Port (port-labs/port) is a SaaS-first internal developer platform. Its core
abstraction is "Blueprints" — fully customizable entity schemas. A Blueprint can
represent anything: microservices, environments, CI jobs, packages, custom
assets. In principle, `Skill`, `Agent`, `Workflow`, and `PortableArtifact`
blueprints would be straightforward to define. Blueprints support typed
relations between entities and Port announced a software catalog dependency
graph feature.

Free tier (as of April 2026): up to 15 seats, 10,000 entities, 500 automation
runs, no time limit, no credit card required.

**The blocker for JASON-OS:** Port is cloud-native SaaS with no self-hosted or
local-deployment option for non-enterprise customers. Your data lives on Port's
servers. For a solo developer tracking internal workflow files and agent
definitions, this is a privacy and vendor-lock-in concern. Enterprise customers
can negotiate dedicated tenancy, but that's outside solo-dev scope.

- **Solo-dev-runnable (no K8s/Docker):** N — SaaS only, no local option
- **File-as-entity:** Y — custom Blueprints can model anything
- **Cross-project tracking model:** Y — Blueprint relations support this
- **Auto-update on file change:** Y — via integrations/webhooks, not local
  filesystem
- **Windows support:** N/A — browser-based SaaS
- **License:** Proprietary SaaS, not OSS

Sources: [4][9][10]

---

### 3. Cortex: SaaS, Closed Source, No Free Tier [CONFIDENCE: HIGH]

Cortex (cortexapps) is a closed-source SaaS internal developer platform. It
focuses on service catalog, maturity scorecards, and engineering excellence
tracking for teams managing microservice ecosystems. Pricing starts at
approximately $25/developer/month with no published free tier. No self-hosted
option for individuals.

**Verdict:** Disqualified immediately. No OSS, no free tier, no local
deployment, enterprise pricing, team-oriented features. Not suitable for
solo-dev JASON-OS tracking.

Sources: [11][12]

---

### 4. Roadie: Backstage-as-a-Service with Local Beta Option [CONFIDENCE: HIGH]

Roadie is a managed Backstage service. For solo developers, two options exist:

- **Roadie SaaS:** ~$20/user/month, 30-day free trial only. Enterprise-oriented.
- **Roadie Local:** Beta product delivered as a Docker image. Free for teams
  under 15 contributing users. Pull the image, run it, get a working Backstage
  instance without the weeks of setup work raw Backstage requires. Spring 2025
  release notes mentioned upcoming non-Kubernetes deployment options (Helm
  charts, marketplace images, "other non-Kubernetes options").

**What Roadie adds over raw Backstage:** It eliminates the setup and upgrade
burden — Roadie estimates self-hosting open-source Backstage at $450K+/year in
engineering time for a team. For a solo dev, Roadie Local removes the
infrastructure complexity but still requires Docker. It inherits all Backstage's
schema capabilities (custom kinds, relations graph, dependency visualization)
without the maintenance burden.

**Blocker:** Still Docker-required. Windows support depends on Docker Desktop
for Windows / WSL. Custom kinds still require writing TypeScript processors.

- **Solo-dev-runnable (no K8s):** Y — Roadie Local via Docker (no K8s needed)
- **Solo-dev-runnable (no Docker):** N
- **File-as-entity:** Y (inherits Backstage custom kinds)
- **Windows support:** Conditional — requires Docker Desktop + WSL

Sources: [6][13][14]

---

### 5. OpsLevel: Enterprise SaaS, No Meaningful Solo-Dev Path [CONFIDENCE: MEDIUM]

OpsLevel supports self-hosted deployments and has a service catalog with
dependency tracking, maturity scorecards, and 40+ integrations. However, pricing
is entirely custom (contact sales), with no published free tier or free
individual plan. It is oriented entirely toward multi-team engineering
organizations.

**Verdict:** Disqualified. No accessible pricing or free tier for solo
developers. Enterprise scope mismatches JASON-OS needs.

Sources: [15]

---

### 6. LeanIX: Enterprise Architecture Tool, Not a Developer Catalog [CONFIDENCE: HIGH]

SAP LeanIX is an enterprise architecture management platform focused on
technology landscape mapping for large organizations. Pricing is per-application
at enterprise rates. It is not a developer catalog in any meaningful sense for
individual use. It tracks business capabilities, technology life cycles, and IT
portfolio — not workflow files or code artifacts.

**Verdict:** Out of scope. Extreme overkill. Not relevant to JASON-OS.

Sources: [16]

---

### 7. GitHub Repository Topology: Topics + Dependency Graph as Minimalist Catalog [CONFIDENCE: HIGH]

GitHub provides two relevant features:

**GitHub Topics** can tag repositories with freeform labels (e.g., `jason-os`,
`portable`, `agent-skill`). Backstage's GitHub discovery uses these topics as
include/exclude filters for auto-ingestion. For JASON-OS, topics could serve as
a basic cross-project tagging layer — all repos tagged `jason-os-portable` would
be queryable. However, topics work at the **repository level**, not the file
level.

**GitHub Dependency Graph** is explicitly limited to package-level dependencies
parsed from manifest and lock files (`package.json`, `requirements.txt`, etc.).
It cannot track custom file-to-file dependencies, workflow-to-workflow
relationships, or portable artifact dependencies. It is purpose-built for supply
chain security within recognized package ecosystems, not architectural
dependency tracking.

**Verdict for JASON-OS:** GitHub topics give a free, zero-overhead cross-repo
tag layer but are repo-granularity only. The native dependency graph is entirely
the wrong abstraction — it tracks npm packages, not `.claude/skills/` files. A
hybrid approach (topics for cross-project tagging + something else for
file-level graph) could work as the tagging layer only.

Sources: [17][18]

---

### 8. Minimum Viable Catalog Pattern: YAML + Graph Script [CONFIDENCE: MEDIUM]

No established open-source "single YAML file + graph viewer" catalog tool
emerged from research that targets individual developer workflow tracking. The
closest adjacent patterns found:

- **PocketBase** (Go binary, SQLite, REST API, no server setup) — good backend
  substrate for a custom catalog, not a catalog itself.
- **Backstage's catalog-info.yaml format** — the YAML schema itself is
  well-defined and could be borrowed as a convention without running the full
  Backstage stack. You write `catalog-info.yaml` files, a small Node.js script
  reads them, builds a SQLite graph, and exposes it via MCP. This is essentially
  the custom SQLite-MCP approach the prior research already converged on — just
  using Backstage's YAML conventions as the input format.
- **No turnkey "minimum viable catalog" tool exists** for this specific use
  case. The space jumps from "raw YAML files in a repo" directly to "full
  Backstage/Port deployment."

Sources: [19][20]

---

## Per-Candidate Evaluation Matrix

| Tool          | Solo-dev-runnable (no K8s)      | File-as-entity    | Cross-project model | Auto-update on file change     | Windows support | License          | Verdict                 |
| ------------- | ------------------------------- | ----------------- | ------------------- | ------------------------------ | --------------- | ---------------- | ----------------------- |
| Backstage     | N (Docker + WSL required)       | Custom kinds only | Y (relations graph) | N (GitHub webhooks, not local) | WSL only        | Apache-2.0       | Overkill/blocker        |
| Port          | N (SaaS only)                   | Y (blueprints)    | Y                   | Y (webhooks)                   | SaaS/browser    | Proprietary      | SaaS blocker            |
| Cortex        | N (SaaS only)                   | N                 | N                   | N                              | SaaS/browser    | Proprietary      | Disqualified            |
| Roadie        | Y (Docker required)             | Custom kinds only | Y                   | N (GitHub webhooks)            | Docker Desktop  | Proprietary SaaS | Docker blocker          |
| OpsLevel      | Unknown (self-hosted available) | N                 | N                   | N                              | Unknown         | Proprietary      | Disqualified            |
| LeanIX        | N                               | N                 | N                   | N                              | N               | Proprietary      | Completely wrong domain |
| GitHub topics | Y (built-in)                    | N (repo only)     | Y (repo-level)      | Y (native)                     | Y               | Free             | Too coarse-grained      |

---

## Claim Register

**C-D4-001** [HIGH]: Backstage requires WSL on Windows — native Windows
installation is explicitly unsupported per official getting-started
documentation. URL: https://backstage.io/docs/getting-started/

**C-D4-002** [HIGH]: Backstage supports custom entity kinds via CatalogProcessor
registration, but requires TypeScript plugin code; the Backstage UI won't render
custom kinds without additional frontend plugin work. URL:
https://roadie.io/blog/kinds-and-types-in-backstage/

**C-D4-003** [HIGH]: Backstage catalog auto-update on file change requires
GitHub webhooks (`github.push` events); there is no local filesystem watcher for
non-SCM-backed files. URL:
https://backstage.io/docs/features/software-catalog/configuration/

**C-D4-004** [HIGH]: Backstage minimum hardware: 6 GB RAM, 20 GB disk, yarn,
build tools. Practical production deployment requires Docker and significant
ongoing maintenance. URL: https://backstage.io/docs/getting-started/

**C-D4-005** [HIGH]: Port is SaaS-only with no self-hosted or local deployment
option for non-Enterprise customers. The free tier (15 seats, 10K entities) runs
on Port's cloud. URL: https://www.port.io/pricing

**C-D4-006** [HIGH]: Cortex is closed-source SaaS with no free tier and no
self-hosted option. URL: https://www.cortex.io/pricing

**C-D4-007** [HIGH]: Roadie Local is a Docker-image-based distribution of
Backstage, free for <15 users, removing upgrade/maintenance burden but still
requiring Docker. URL:
https://roadie.io/blog/roadie-local-self-hosted-backstage-ready-in-minutes/

**C-D4-008** [HIGH]: GitHub's dependency graph is strictly
package-ecosystem-scoped (npm, pip, etc.) and cannot track custom file-to-file
or workflow-to-workflow dependencies. URL:
https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph

**C-D4-009** [HIGH]: GitHub topics work at repo granularity only, not
file-level; they cannot tag individual `.claude/skills/` files as portable
across projects. URL: https://backstage.io/docs/integrations/github/discovery/

**C-D4-010** [MEDIUM]: No turnkey "minimum viable catalog" open-source tool
(single YAML + graph viewer) was found targeting individual developer workflow
or skill-file tracking. The space has a gap between "raw YAML files" and "full
Backstage/Port." (Based on exhaustive search — absence of result is the
finding.)

---

## Sources

| #   | URL                                                                                                                                | Title                                       | Type                 | Trust  | CRAAP     | Date |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------- | ------ | --------- | ---- |
| 1   | https://backstage.io/docs/getting-started/                                                                                         | Backstage Getting Started                   | Official docs        | HIGH   | 5/5/5/5/5 | 2025 |
| 2   | https://backstage.io/docs/features/software-catalog/descriptor-format/                                                             | Backstage Descriptor Format                 | Official docs        | HIGH   | 5/5/5/5/5 | 2025 |
| 3   | https://backstage.io/docs/features/software-catalog/creating-the-catalog-graph/                                                    | Creating the Catalog Graph                  | Official docs        | HIGH   | 5/5/5/5/5 | 2025 |
| 4   | https://www.port.io/pricing                                                                                                        | Port Pricing                                | Official product     | HIGH   | 4/5/5/4/4 | 2026 |
| 5   | https://roadie.io/blog/self-hosting-backstage-the-real-to-do-list/                                                                 | Self-Hosting Backstage: The Real To-Do List | Vendor blog (Roadie) | MEDIUM | 4/5/4/4/3 | 2025 |
| 6   | https://roadie.io/blog/roadie-local-self-hosted-backstage-ready-in-minutes/                                                        | Roadie Local: Self-hosted Backstage         | Vendor blog          | MEDIUM | 4/5/4/4/3 | 2025 |
| 7   | https://roadie.io/blog/kinds-and-types-in-backstage/                                                                               | Customizing Backstage Kinds and Types       | Vendor blog          | MEDIUM | 4/5/4/4/3 | 2024 |
| 8   | https://backstage.io/docs/features/software-catalog/configuration/                                                                 | Catalog Configuration                       | Official docs        | HIGH   | 5/5/5/5/5 | 2025 |
| 9   | https://docs.port.io/build-your-software-catalog/customize-integrations/configure-data-model/setup-blueprint/                      | Port Blueprint Setup                        | Official docs        | HIGH   | 5/5/5/5/5 | 2026 |
| 10  | https://www.port.io/blog/announcing-the-software-catalog-dependency-graph                                                          | Port Dependency Graph Announcement          | Vendor blog          | MEDIUM | 4/4/4/4/3 | 2024 |
| 11  | https://www.cortex.io/pricing                                                                                                      | Cortex Pricing                              | Official product     | HIGH   | 4/4/5/4/4 | 2026 |
| 12  | https://internaldeveloperplatform.org/developer-portals/cortex/                                                                    | Cortex on IDP.org                           | Community reference  | MEDIUM | 3/4/3/4/4 | 2025 |
| 13  | https://roadie.io/pricing/                                                                                                         | Roadie Pricing                              | Official product     | HIGH   | 4/5/5/4/4 | 2026 |
| 14  | https://roadie.io/blog/the-true-cost-of-self-hosting-backstage/                                                                    | True Cost of Self-Hosting Backstage         | Vendor blog          | MEDIUM | 4/5/4/4/2 | 2025 |
| 15  | https://www.opslevel.com/pricing                                                                                                   | OpsLevel Pricing                            | Official product     | HIGH   | 4/4/5/4/4 | 2026 |
| 16  | https://www.capterra.com/p/126515/leanIX/                                                                                          | LeanIX on Capterra                          | Review site          | LOW    | 3/3/3/3/3 | 2026 |
| 17  | https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph | GitHub Dependency Graph                     | Official docs        | HIGH   | 5/5/5/5/5 | 2025 |
| 18  | https://backstage.io/docs/integrations/github/discovery/                                                                           | Backstage GitHub Discovery                  | Official docs        | HIGH   | 5/5/5/5/5 | 2025 |
| 19  | https://roadie.io/blog/3-strategies-for-a-complete-software-catalog/                                                               | Strategies for Catalog Completeness         | Vendor blog          | MEDIUM | 4/4/4/4/3 | 2025 |
| 20  | https://github.com/launchany/mvp-template                                                                                          | MVP API Developer Portal Template           | GitHub OSS           | MEDIUM | 3/3/3/3/4 | 2023 |

---

## Contradictions

**Roadie's cost analysis vs. actual solo-dev feasibility:** Roadie's own blog
estimates self-hosting Backstage requires "$450K+/year in engineering time" for
a team — but simultaneously markets "Roadie Local" as free and easy for small
teams. The reality is that Roadie Local's Docker-image approach genuinely
reduces operational burden compared to raw Backstage, but the cost framing is
vendor-motivated (Roadie wants you to use their managed service). The actual
solo-dev friction is Docker-on-Windows, not the $450K figure (that's for
production enterprise scale).

**Port "free tier" vs. "SaaS-only" framing:** Port presents a generous free tier
(10K entities, no time limit) as an apparent win for solo developers, but the
catch is all data must live on Port's servers. For tracking internal tooling
files (agents, skills), this is a material constraint that Port's marketing does
not prominently surface.

---

## Gaps

1. **Roadie Local system requirements on Windows:** The documentation does not
   specify Windows compatibility details for the Docker image. Whether Docker
   Desktop on Windows 11 with WSL2 would "just work" was not confirmed from
   available documentation.

2. **OpsLevel technical architecture:** No detailed technical documentation was
   accessible about OpsLevel's self-hosted deployment model or whether it could
   be meaningfully configured for non-microservice entities.

3. **Backstage "Component kind = file" precedent:** No community examples were
   found of someone using Backstage to catalog individual workflow files or
   scripts rather than services. The approach would work in theory but no
   validated pattern exists.

4. **Port dependency graph technical details:** Port's dependency graph feature
   was announced but detailed documentation on query capabilities (e.g., "find
   all entities that depend on skill X") was not fully accessible.

---

## Serendipity

**PocketBase as catalog substrate:** The research surfaced PocketBase — a single
Go binary with embedded SQLite, REST API, real-time subscriptions, and a web
admin dashboard — as a potential middle-ground between "raw SQLite scripts" and
"full Backstage stack." It would let you build a custom file-registry catalog
with a web UI without running a Node.js/Docker stack. Worth a note for the
synthesizer, as it is closer to the custom SQLite-MCP direction already chosen.

**Backstage YAML convention borrowing:** Even if you don't run Backstage, its
`catalog-info.yaml` format (`apiVersion`, `kind`, `metadata.tags`,
`spec.dependsOn`) is a well-designed, documented convention for YAML-based
entity + relation descriptions. A custom solution could adopt this schema as its
input format, gaining future Backstage compatibility if the need ever arose.

**Port's dependency graph announcement**
(https://www.port.io/blog/announcing-the-software-catalog-dependency-graph) is
the only tool in this survey that explicitly shipped a visual
upstream/downstream catalog dependency graph as a first-class product feature.
If vendor lock-in and SaaS data hosting were not concerns, Port's free tier
would be the fastest path to a working cross-project dependency graph.

---

## Top-2 Recommendations (Given JASON-OS Constraints)

**1. Do not adopt any of these tools as-is.** The unanimous finding is that all
developer portal catalogs in this space are enterprise-team tools with
multi-service governance as their core use case. JASON-OS needs file-level
tracking for a solo developer — a fundamentally different scale and granularity.
The custom SQLite-MCP direction (from prior research) remains the right call.

**2. If a quick proof-of-concept graph UI is needed:** Port's SaaS free tier is
the fastest path to a visual dependency graph with flexible entity schemas. You
can define `Skill`, `Agent`, and `Workflow` blueprints, populate 10K entities,
and get a dependency graph UI for free — at the cost of data living on Port's
servers. Treat this as a prototyping/validation tool, not production
infrastructure.

---

## Confidence Assessment

- HIGH claims: 8 (C-D4-001 through C-D4-009, C-D4-008)
- MEDIUM claims: 2 (C-D4-010, Roadie Local Windows specifics)
- LOW claims: 0
- UNVERIFIED claims: 0
- **Overall confidence: HIGH** — all major claims are sourced from official
  documentation or vendor primary sources. The main gap (Roadie Local Windows
  compatibility) does not affect the core verdict.
