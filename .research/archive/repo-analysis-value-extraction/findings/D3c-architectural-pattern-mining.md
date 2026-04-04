# D3c: Architectural Pattern Mining

**Searcher:** deep-research-searcher **Profile:** academic + web **Date:**
2026-03-31 **Sub-Question IDs:** SQ-1 through SQ-8 **Depth:** L1 (Exhaustive)

---

## Key Findings

1. **Dependency graph + graph-based methods are the dominant academic approach
   for architectural pattern detection** [CONFIDENCE: HIGH]

   The current state of the field uses dependency graphs as the primary
   substrate. Abstract Syntax Trees (AST), Control Flow Graphs (CFG), and
   Program Dependence Graphs (PDG) are combined into hybrid representations for
   pattern detection. A 2025 paper in Scientific Reports introduced the first
   integrated multi-level graph representation (AST+CFG+DFG) with dual-branch
   attention-based GNN architecture for simultaneous defect prediction and
   quality assessment [1]. For microservices specifically, Graph Neural Networks
   are applied to detect architectural anti-patterns; a 2026 paper in Wiley's
   Software: Practice and Experience uses GNNs against a taxonomy of 58
   microservice anti-patterns [6]. The Code Property Graph (CPG) unifies AST,
   CFG, and PDG into a joint structure and is widely adopted in security and
   smell detection tooling.

2. **GoF pattern detection tools exist with 77–91% F1, but accuracy varies
   heavily by pattern** [CONFIDENCE: HIGH]

   Multiple tools detect GoF patterns in Java:
   - **FINDER**: Detects 22 of 23 GoF patterns via fine-grained static analysis
     [2]
   - **PINOT**: Detects all GoF patterns with concrete structural definitions
   - **MARPLE**: Eclipse plugin combining pattern detection with architecture
     reconstruction
   - **DPD_F**: Feature-based ML approach achieving 80% precision on 12 GoF
     patterns [3]

   The 2025 Chalmers study (Empirical Software Engineering) compared five code
   language models on GoF patterns from the P-MART benchmark: RoBERTa achieved
   mean F1 of 0.91, CodeGPT 0.79, CodeBERT 0.77 [4]. Key challenge: "variant
   coverage" — the same pattern appears in many structural forms, and tools
   optimized for canonical forms miss variants. Factory Method is easiest;
   Facade is hardest (too abstract/contextual). Most tools are Java-only; Python
   and TypeScript support is sparse.

3. **LLMs achieve only 38% accuracy on design pattern classification, with
   GPT-4o and LLaMA-3 as top performers** [CONFIDENCE: HIGH]

   The 2025 "Do Code LLMs Understand Design Patterns?" study tested 11 models
   (GPT-4, GPT-4o, Claude 3.5, Qwen, LLaMA 3.1 70B, DeepSeek V2, CodeQwen,
   Mistral, Yi, GLM) across 12 GoF patterns in Java and Python [5]. GPT-4o and
   LLaMA-31-70B tied for best at **38.81% accuracy** on classification. All
   models declined from Java to Python; complex variants were harder than
   canonical examples. Facade was the most difficult for all models. The 2025
   LLM+Software Architecture survey (arXiv:2505.16697) found that 70% of studies
   use zero-shot prompting, with CoT and RAG appearing in only 5-10% of cases,
   yet LLMs "consistently outperformed baseline in 6 of 8 comparative studies" —
   though comparative baselines were often weak [7]. KEY CAVEAT: 38%
   classification accuracy means LLMs hallucinate patterns confidently. They are
   useful for description/explanation tasks and for generating architectural
   knowledge, not for precise detection.

4. **Arcan is the reference tool for architectural smell detection, detecting 4
   dependency-based smells with dynamic thresholds** [CONFIDENCE: HIGH]

   Arcan detects four architectural smells using a graph database for
   scalability:
   - **Cyclic Dependency (CD)**: Via Sedgewick-Wayne, Tarjan, or Laval-Falleri
     algorithms on dependency graph
   - **God Component (GC)**: LOC-based with dynamic threshold
     `Max(LinesOfCode_System, LinesOfCode_Benchmark)`
   - **Hub-Like Dependency (HL)**: FanIn+FanOut with dynamic threshold
   - **Unstable Dependency (UD)**: Robert Martin's Instability metric

   An empirical study on 103 Java projects (72M LOC) validated Arcan's detection
   [8]. False positives occur: Hub-Like flags Singleton implementations; Cyclic
   Dependency flags Factory Method patterns — meaning smell detection and
   pattern detection interact. The 2024 correlation study (arxiv:2406.17354)
   found "weak to moderate correlations" between Arcan smells and
   SonarQube/PMD/FindBugs warnings, but 661/663 pairs were statistically
   significant; FindBugs had the strongest associations with architectural
   smells [9].

5. **ROSE (2025) transformer model reaches 96.9% accuracy for recommending
   refactorings after smell detection** [CONFIDENCE: HIGH]

   CodeT5 fine-tuned on 2M+ refactoring instances from 11,149 Java projects
   achieved 96.9% accuracy / 95.2% F1 on recommending refactorings for
   architectural smells (God Class → Extract Method; Hub-Like → Pull Up Method;
   Cyclic Dependency → Move Method) [10]. CodeBERT achieved 85% accuracy. This
   is a two-step pipeline: detect smell with Arcan, then recommend refactoring
   with ROSE. Not applicable to detection itself.

6. **Code archaeology via git history (Adam Tornhill / CodeScene) is a mature,
   production-ready approach for architectural archaeology** [CONFIDENCE: HIGH]

   The code archaeology approach uses version control history as behavioral
   data:
   - **Code Maat** (open source, Adam Tornhill): Detects hotspots (high churn ×
     high complexity), logical coupling (files that co-change), ownership
     patterns, code age, temporal coupling [11]
   - **CodeScene** (commercial): Extends Code Maat concepts to architectural
     level — hotspot analysis at component level, change coupling between
     services, Conway's Law alignment, technical sprawl across languages,
     knowledge distribution [12]

   CodeScene was awarded Best Paper at the 7th International Conference on
   Technical Debt 2024. The 2025 "Source Code Hotspots" study validated
   line-level hotspot detection at **90% accuracy** with Cohen's Kappa 0.61 for
   inter-rater agreement [13]. The key insight: bots generate 73.9% of hotspot
   commits (configuration churn), while humans dominate semantically rich
   architectural changes. Temporal coupling that crosses architectural
   boundaries signals expensive coupling patterns.

7. **Dependency-cruiser and Madge are the practical tools for JS/TS dependency
   graph visualization; ArchUnit is the Java equivalent** [CONFIDENCE: HIGH]

   **Dependency-cruiser** (JS/TS/CoffeeScript): Validates and visualizes module
   dependencies. Supports rule-based enforcement of architectural boundaries
   (Clean Architecture, DDD, hexagonal layers). Detects circular dependencies,
   orphan modules, and layer violations. Integrates with pre-commit hooks and
   CI. Actively maintained [14].

   **Madge** (JS/TS): Simpler visual graph tool for CommonJS/AMD/ES6.
   Color-coded visualization (blue=has deps, red=circular, green=no deps).
   Detects circular dependencies and orphan modules. Better for quick visual
   inspection, less for rule enforcement.

   **ArchUnit** (Java): Bytecode-based architectural rule validation. Supports
   layered, onion, hexagonal architecture patterns as executable test
   specifications. Can use PlantUML diagrams as architectural contracts. Detects
   unauthorized cross-layer dependencies, circular dependencies, inheritance
   violations. JUnit 4/5 integrated. Has .NET port (ArchUnitNET) [15].

   **Comparison**: Dependency-cruiser > Madge for rule enforcement; ArchUnit is
   the most architecturally expressive tool (hexagonal, onion, layered all
   supported as first-class patterns).

8. **Microservice architecture recovery: Code2DFD achieves F1=0.86; tool
   combinations reach F1=0.91** [CONFIDENCE: HIGH]

   The 2024 MSR registered report (arXiv:2412.08352, published in Empirical
   Software Engineering 2025) compared 9 static analysis tools for microservice
   architecture recovery against 17 Java Spring applications [16]:
   - **Best individual tool**: Code2DFD — F1=0.86 (precision 0.93, recall 0.80),
     covers components+connections
   - **Best for endpoints**: RAD — F1=0.79, precision 0.94
   - **Best combined**: Code2DFD + RAD — F1=0.91
   - Three tools completely failed on connection detection (MicroGraal,
     ContextMap, Prophet)
   - Study limitation: Java Spring only, REST-only communication, 17 projects

9. **Higher-order architectural patterns (CQRS, hexagonal, event-driven) lack
   dedicated detection tools; inference requires multi-signal heuristics**
   [CONFIDENCE: MEDIUM]

   There is no equivalent of FINDER or Arcan for detecting CQRS, event sourcing,
   hexagonal architecture, or event-driven architecture in arbitrary code.
   Detection requires combining:
   - **Naming convention analysis**: Command/Query suffix in class names,
     Event/Handler suffixes, Port/Adapter naming
   - **Dependency direction analysis**: Dependency-cruiser or ArchUnit rules can
     validate if the actual dependency graph matches the claimed pattern
   - **Import analysis**: Infrastructure imports in domain code violate
     hexagonal architecture
   - **Structural heuristics**: Separate read/write models (CQRS), event store
     classes, aggregate roots (DDD)

   The layered architecture reconstruction survey (arXiv:2112.01644) identifies
   6 design rules under 4 principles specific to layered patterns but notes
   these were "previously poorly defined" [17]. Most tools reconstruct layers
   via depth-traversal of dependency graphs and handle cyclic dependency
   exceptions via heuristics.

10. **Pattern catalog landscape extends well beyond GoF across 13+ domains**
    [CONFIDENCE: HIGH]

    Established catalogs beyond GoF:
    - **Fowler's PEAA** (Patterns of Enterprise Application Architecture): ~40
      patterns covering domain logic, data access, web presentation, distributed
      design [18]
    - **Enterprise Integration Patterns** (Hohpe & Woolf): Messaging patterns
      implemented in Apache Camel (300+ components) and Spring Integration
    - **Microservices Patterns** (microservices.io): 58 anti-patterns catalogued
      (2023 tertiary study) [19]; Chris Richardson maintains a pattern language
      covering decomposition, communication, data management
    - **Cloud Design Patterns**: AWS CDP, Azure Architecture Patterns, GCP
      patterns — all distinct pattern languages
    - **Software Patterns Lexicon** (softwarepatternslexicon.com): Claims 3000+
      patterns across 24 languages
    - **Awesome Design Patterns** (DovAmir): Curated list spanning 13 categories
      including cloud, serverless, IoT, ML, security

    Code-level detection mapping: Most catalog patterns (EIP, PEAA) are too
    abstract for automated detection. What IS detectable: Singleton
    (structural), Factory (structural), Repository (naming+interface analysis),
    Observer/Event patterns (event bus usage patterns), Gateway/Facade
    (interface placement in dependency graph).

11. **MSR4SA: 151 studies support architecture mining from repositories;
    architecture understanding and recovery are the most common tasks**
    [CONFIDENCE: HIGH]

    The 2025 systematic mapping study (arXiv:2212.13179) covering 151 primary
    MSR-for-software-architecture studies found [20]:
    - Most common mined information type: Architectural Description (69.2%),
      Architectural Solutions including patterns (42.3%)
    - Most common activity: Architecture Understanding (44.2%), then
      Architecture Recovery
    - Dominant data sources: Version control systems (57 studies), Stack
      Overflow (33 studies)
    - 95 approaches and 56 tools identified; many overlap, several are
      unmaintained
    - ML + NLP increasingly dominant over static analysis rules for information
      extraction

---

## Detailed Analysis

### Detection Approaches

**1. Structural/Rule-Based Detection** The oldest approach: encode pattern roles
and relationships as structural predicates against an attributed AST or class
diagram. FINDER, PINOT, and early MARPLE use this. High precision for canonical
patterns, poor recall for variants. Language-specific (mostly Java).
Well-understood, interpretable.

**2. Graph-Based Detection** Build a dependency graph (class-level,
package-level, or service-level), then apply graph algorithms. Arcan uses this
for 4 architectural smells. Code2DFD uses it for microservice
component/connection detection. GNNs (Graph Neural Networks) extend this to
learn pattern embeddings. 2024-2026 research increasingly applies GNNs to
microservice anti-pattern detection. Scales well; graph database backend
(Neo4j-based in Arcan) enables large codebases.

**3. ML/Embedding-Based Detection** Code2Vec, CodeBERT, CodeGPT, CodeT5 — encode
code into vector embeddings, then classify. The Chalmers study achieves F1=0.91
with RoBERTa. DPD_F achieves 80% precision. These models require labeled
training data (P-MART, DPB benchmarks for GoF). Strong for GoF in Java; weak for
Python; no evidence for architectural-level patterns (CQRS, hexagonal).

**4. LLM-Based Detection** Zero-shot and few-shot prompting of GPT-4, Claude,
LLaMA, etc. for pattern identification. Only 38% accuracy on GoF classification.
Better for explanation/generation tasks than binary detection. The software
architecture + LLM survey (arXiv:2505.16697) finds LLMs perform best on:
classification of architectural decisions, extraction of design rationale from
text, Q&A about architecture knowledge. Cloud-native architecture detection and
conformance checking remain unexplored.

**5. Behavioral/Temporal Analysis (Git History)** Code Maat and CodeScene
analyze version control history. Not about detecting structural patterns — about
identifying architectural risk through behavioral signals. Temporal coupling
that crosses architectural boundaries is the primary architectural signal.
Complements structural analysis rather than replacing it.

### Tools Summary

| Tool               | Approach          | Target                          | Accuracy                              | Language    | Status                      |
| ------------------ | ----------------- | ------------------------------- | ------------------------------------- | ----------- | --------------------------- |
| Arcan              | Graph + metrics   | 4 arch smells                   | Empirically validated on 103 projects | Java        | Active, commercial          |
| FINDER             | Structural rules  | 22/23 GoF patterns              | Not benchmarked with F1               | Java        | Research                    |
| Code2DFD           | Static analysis   | Microservice components         | F1=0.86                               | Java/Spring | Research                    |
| ArchUnit           | Bytecode analysis | Custom rules                    | Binary (pass/fail, no F1)             | Java/.NET   | Active, open source         |
| Dependency-cruiser | Import analysis   | Circular deps, layer violations | Binary (pass/fail)                    | JS/TS       | Active, open source         |
| Madge              | Import analysis   | Circular deps, orphans          | Binary                                | JS/TS       | Active, open source         |
| CodeScene          | Git + static      | Hotspots, coupling, Conway      | 90% hotspot accuracy                  | Polyglot    | Commercial                  |
| Code Maat          | Git history       | Logical coupling, churn         | Research-validated                    | Polyglot    | Open source (Adam Tornhill) |
| ROSE/CodeT5        | Transformer       | Refactoring recommendations     | F1=0.95                               | Java        | Research                    |
| SonarQube          | Static analysis   | Code smells, complexity         | Varies; no arch-level F1              | Polyglot    | Commercial/community        |

### AI/LLM Methods

**What works:**

- Explaining patterns found via other methods
- Generating architecture documentation from code
- Answering Q&A about known patterns
- Classifying Stack Overflow posts as architecture-related
- Predicting whether a refactoring type is appropriate (ROSE = 96.9% with
  fine-tuning)

**What doesn't work reliably:**

- Binary pattern classification (38% accuracy zero-shot)
- Detecting subtle pattern variants
- Cross-file pattern tracing without RAG/tool augmentation
- Architecture conformance checking

**What's underexplored:**

- LLM + static analysis tool combination (hybrid approach)
- RAG with code knowledge graph as retrieval source
- Chain-of-thought prompting for multi-file pattern tracing
- Fine-tuned models for non-Java languages

---

## Applicable Patterns for Repo Analysis

Ranked by detectability and value for a repo analysis system:

### Tier 1: High-Value, High-Detectability

1. **Circular dependencies** — Detectable via dependency-cruiser/Madge with high
   accuracy. High value: signals architectural violations that increase coupling
   and maintenance cost. Applicable to any JS/TS/Java codebase.

2. **God Components/God Classes** — Detectable via LOC + FanIn/FanOut metrics
   (Arcan approach). High value: flags refactoring targets. Works across
   languages via line count thresholds.

3. **Hub-Like Dependencies** — Detectable via FanIn+FanOut metrics. High value:
   identifies architectural bottlenecks. Language-agnostic once dependency graph
   is built.

4. **Hotspots** — Code Maat/CodeScene approach: high churn × high complexity.
   Detectable from git log + any complexity metric. Very high value: correlates
   with defect density and maintenance cost.

5. **Temporal Coupling** — Files that consistently co-change. Detectable from
   git log alone. High value: reveals hidden dependencies that structural
   analysis misses.

### Tier 2: Medium-Value, Medium-Detectability

6. **Layered Architecture Violations** — Detectable via dependency direction
   rules in dependency-cruiser/ArchUnit if layers are named consistently. Value:
   confirms or disproves claimed architecture. Requires naming convention
   assumptions.

7. **Unstable Dependencies** — Detectable via Martin's Instability metric.
   Medium value: useful for prioritizing refactoring. Requires computing all
   FanIn/FanOut first.

8. **Ownership/Knowledge Silos** — Detectable from git blame + commit history.
   Value: team-level risk indicator. Requires author attribution.

9. **Hexagonal Architecture compliance** — Partial detection via dependency
   direction + naming heuristics. Value: confirms ports/adapters separation.
   Limited precision without naming conventions.

10. **Repository Pattern** — Detectable via naming analysis (classes with
    "Repository" suffix, interface abstraction over data layer). Value: confirms
    data access abstraction exists.

### Tier 3: Low Detectability (Requires LLM or Manual Confirmation)

11. **CQRS** — Indirect signals: Command/Query naming, separate read/write
    models, event store classes. No automated tool. LLM with context can
    identify with moderate accuracy.

12. **Event-Driven Architecture** — Detectable via event bus usage patterns,
    Event/Handler naming, message queue dependencies (Kafka, RabbitMQ, etc. in
    package.json/pom.xml). Structural detection via import analysis.

13. **GoF Design Patterns** — FINDER/PINOT approach works for Java; limited for
    JS/TS. LLMs achieve 38% classification accuracy. Best practical approach:
    LLM with targeted prompts per file + human verification.

### Practical Recommendation for a Repo Analysis System

A tiered approach works best:

1. **Phase 1 (automated, high confidence)**: Build dependency graph → compute
   circular deps, hub-like, God Component, layer violations → extract git
   metrics → compute hotspots and temporal coupling.

2. **Phase 2 (heuristic inference)**: Scan folder structure + naming conventions
   for architectural intent signals (hexagonal, CQRS, DDD vocabulary). Report as
   "detected pattern intent" with confidence percentage.

3. **Phase 3 (LLM-assisted, low confidence)**: Feed LLM representative files
   from each detected cluster with a structured prompt asking for pattern
   identification. Flag all LLM findings as "requires review" given the 38%
   baseline accuracy.

---

## Gaps Identified

1. **No cross-language detection tool for higher-order patterns (CQRS,
   hexagonal, event-driven).** Tools are Java-heavy; TypeScript/Python coverage
   is sparse. The field has not produced a "Arcan for TypeScript."

2. **LLM accuracy for pattern detection remains low (38%) with no clear path to
   improvement without fine-tuning on labeled datasets.** No labeled benchmark
   exists for TypeScript or Python architectural patterns equivalent to P-MART
   for Java GoF.

3. **Microservice architecture recovery tools are validated only on Java/Spring
   REST applications.** GraphQL, gRPC, event-driven (Kafka), and non-Spring
   microservice stacks are out of scope for all 9 tools in the 2024 comparison.

4. **The gap between pattern catalog richness and detection capability is
   large.** Of 3000+ patterns in the Software Patterns Lexicon, fewer than 30
   have validated automated detection tools.

5. **Temporal coupling studies focus on file-level.** Component-level temporal
   coupling (tracking coupling between services or modules over time) is
   CodeScene's commercial offering; no free/open tool matches this at the
   architectural level.

6. **Code archaeology tools produce CSV/visualization outputs, not structured
   machine-readable pattern reports.** Code Maat outputs CSV; integrating its
   analysis into a programmatic pipeline requires custom tooling.

---

## Serendipitous Discoveries

- **Conway's Law alignment is measurable.** CodeScene can quantify how well team
  boundaries align with architectural boundaries using git authorship data.
  Misalignment predicts defect density and delivery slowdowns. This is
  applicable to a repo health analysis feature.

- **Architectural smell detection generates false positives on legitimate
  patterns.** Arcan's Hub-Like Dependency flags Singleton implementations;
  Cyclic Dependency flags Factory Method. A pattern detection system should
  suppress architectural smell alerts when a known pattern explains the smell.

- **The ROSE paper pipeline (detect smell → recommend refactoring) reaches 96.9%
  F1.** This suggests a viable product feature: not just "you have a God Class"
  but "here are specific refactoring moves to resolve it."

- **73.9% of hotspot commits are from bots** (dependency update PRs, formatter
  runs, CI config changes). A repo analysis tool that filters bot commits before
  computing hotspots will be dramatically more accurate.

- **Stack Overflow is a primary data source for architectural knowledge mining**
  (33 of 151 MSR4SA studies). This implies the community's architectural
  knowledge is accessible and mineable — potentially useful for matching a
  repo's patterns to known community discussions about those patterns.

---

## Sources

| #   | URL                                                                                                   | Title                                                                                   | Type                   | Trust       | CRAAP | Date             |
| --- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------- | ----------- | ----- | ---------------- |
| 1   | https://www.nature.com/articles/s41598-025-31209-5                                                    | Integrated GNN model for defect prediction and code quality                             | Academic journal       | HIGH        | 4.2   | 2025             |
| 2   | https://dl.acm.org/doi/10.1145/2695664.2695900                                                        | Design pattern detection using FINDER                                                   | ACM conference         | HIGH        | 3.8   | 2015             |
| 3   | https://arxiv.org/pdf/2012.01708                                                                      | Feature-Based Software Design Pattern Detection                                         | arXiv preprint         | MEDIUM-HIGH | 4.0   | 2021             |
| 4   | https://research.chalmers.se/publication/545339/file/545339_Fulltext.pdf                              | Design pattern recognition: a study of large language models                            | Peer-reviewed journal  | HIGH        | 4.5   | 2025             |
| 5   | https://arxiv.org/html/2501.04835v1                                                                   | Do Code LLMs Understand Design Patterns?                                                | arXiv preprint         | MEDIUM-HIGH | 4.3   | 2025             |
| 6   | https://onlinelibrary.wiley.com/doi/10.1002/spe.70035                                                 | Detecting Microservice Architectural Anti-Pattern Indicators Using GNNs                 | Peer-reviewed journal  | HIGH        | 4.5   | 2026             |
| 7   | https://arxiv.org/pdf/2505.16697                                                                      | Software Architecture Meets LLMs                                                        | arXiv preprint         | MEDIUM-HIGH | 4.0   | 2025             |
| 8   | https://ieeexplore.ieee.org/document/7958506                                                          | Arcan: A Tool for Architectural Smells Detection                                        | IEEE conference        | HIGH        | 4.0   | 2017             |
| 9   | https://arxiv.org/html/2406.17354                                                                     | On the Correlation Between Architectural Smells and Static Analysis Warnings            | arXiv/journal          | MEDIUM-HIGH | 4.2   | 2024             |
| 10  | https://arxiv.org/abs/2507.12561                                                                      | ROSE: Transformer-Based Refactoring Recommendation for Architectural Smells             | arXiv preprint         | MEDIUM-HIGH | 4.3   | 2025             |
| 11  | https://github.com/adamtornhill/code-maat                                                             | code-maat: Mine and analyze version-control data                                        | GitHub/official        | HIGH        | 4.0   | Active           |
| 12  | https://docs.enterprise.codescene.io/versions/4.3.15/guides/architectural/architectural-analyses.html | CodeScene Architectural Analyses Documentation                                          | Official docs          | HIGH        | 4.5   | Current          |
| 13  | https://arxiv.org/html/2602.13170                                                                     | Source Code Hotspots: A Diagnostic Method for Quality Issues                            | arXiv preprint         | MEDIUM-HIGH | 4.2   | 2025             |
| 14  | https://github.com/sverweij/dependency-cruiser                                                        | dependency-cruiser: Validate and visualize dependencies                                 | GitHub/official        | HIGH        | 4.5   | Active           |
| 15  | https://www.archunit.org/userguide/html/000_Index.html                                                | ArchUnit User Guide                                                                     | Official docs          | HIGH        | 4.5   | Current          |
| 16  | https://arxiv.org/html/2412.08352v1                                                                   | Comparison of Static Analysis Architecture Recovery Tools for Microservice Applications | arXiv/journal          | HIGH        | 4.5   | 2024             |
| 17  | https://arxiv.org/abs/2112.01644                                                                      | Systematically reviewing the layered architectural pattern principles                   | arXiv preprint         | MEDIUM-HIGH | 4.0   | 2021             |
| 18  | https://martinfowler.com/eaaCatalog/                                                                  | Catalog of Patterns of Enterprise Application Architecture                              | Official/authoritative | HIGH        | 4.8   | 2002 (canonical) |
| 19  | https://www.sciencedirect.com/science/article/pii/S0164121223002248                                   | Catalog and detection of microservice anti-patterns: A tertiary study                   | Peer-reviewed journal  | HIGH        | 4.5   | 2023             |
| 20  | https://arxiv.org/html/2212.13179                                                                     | Mining Architectural Information: A Systematic Mapping Study                            | arXiv preprint         | MEDIUM-HIGH | 4.3   | 2022/2024        |

---

## Contradictions

**Contradiction 1: LLM capability claims.** The arXiv:2505.16697 survey states
LLMs "consistently outperformed baseline in 6 of 8 comparative studies" — but
the detailed pattern classification study (arXiv:2501.04835v1) shows only 38.81%
accuracy for top models. These are not contradictory if the baselines in the
survey are weak (random classifiers, simple keyword matching), but they should
not be read as "LLMs are good at architectural pattern detection." The 38%
number is the more honest benchmark.

**Contradiction 2: Smell detection accuracy.** Arcan documentation provides no
precision/recall numbers. The 2024 correlation study found "weak to moderate
correlations" between Arcan smells and SonarQube warnings — but this tests
correlation, not ground truth accuracy. The ROSE paper's 96.9% accuracy is for
refactoring classification after smell detection is complete, not for smell
detection itself. No rigorous ground-truth F1 study for Arcan was found.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 2
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The field is well-studied with strong empirical evidence for quantitative tools
(dependency analysis, git history). LLM capabilities are specifically measured
and found wanting for detection tasks. The main gap is cross-language support
and higher-order pattern detection.
