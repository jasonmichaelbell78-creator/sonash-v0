# D3b-2: Extraction Candidate Heuristics

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-31
**Sub-Question IDs:** SQ-1 (extraction heuristics), SQ-2 (strangler fig
pattern), SQ-3 (API/interface boundaries), SQ-4 (micro-frontend extraction)

---

## Key Findings

1. **Cohesion + Churn = Primary Extraction Signal** [CONFIDENCE: HIGH]

   The strongest signal for an extraction candidate is a component with _high
   internal cohesion_ and _high change frequency_. Adam Tornhill's behavioral
   analysis methodology (CodeScene) operationalizes this as a "hotspot": files
   that are both frequently changed (high churn) and complex (high
   LOC/indentation). High-churn, high-complexity components in isolation from
   the core domain are ideal extraction targets — they suffer disproportionate
   maintenance burden and would benefit from clear boundary enforcement.
   [SOURCE: understandlegacycode.com/blog/key-points-of-software-design-x-rays]

2. **Change Coupling as Hidden Architecture Signal** [CONFIDENCE: HIGH]

   When two files consistently change together in the same commits but live in
   different modules, this is "change coupling" — an empirical signal that those
   files belong together (or that the abstraction boundary is wrong). Tornhill's
   approach: if co-located files change separately, the coupling is fine; if
   files across distant modules change together, the packaging is wrong. This is
   more reliable than static dependency analysis alone. [SOURCE:
   understandlegacycode.com/blog/key-points-of-software-design-x-rays,
   codesai.com/posts/2026/02/bundling-up]

3. **Code Smell Taxonomy Maps Directly to Extraction Type** [CONFIDENCE: HIGH]

   Classic refactoring signals map to specific extraction operations:
   - **Long Method / Divergent Change** → Extract Method
   - **Large Class / Data Clumps / Feature Envy** → Extract Class
   - **Parallel Inheritance Hierarchies / Shotgun Surgery** → Extract
     Module/Package
   - **Divergent Change** (a class changes for multiple unrelated reasons) is
     the most reliable single-class signal for "extract to separate module"
     [SOURCE: refactoring.guru/refactoring/smells]

4. **Rule of Three Governs Extraction Timing** [CONFIDENCE: HIGH]

   Extract when a pattern appears three times, not two. With two occurrences, it
   is easy to over-abstract and bake in wrong assumptions. The Rule of Three
   (Fowler) ensures enough context exists to name the abstraction precisely.
   Critical nuance: _even with three occurrences, do not extract if you cannot
   name the abstraction clearly_, if it requires boolean parameters to handle
   variants, or if coupling would create worse problems than duplication.
   [SOURCE: understandlegacycode.com/blog/refactoring-rule-of-three]

5. **Multiple Consumers + Stable Interface = Strong Extraction Signal**
   [CONFIDENCE: HIGH]

   A component consumed by 2-3+ callers with no modification between use sites
   is a reliable extraction candidate. React-specific guidance (2024-2026)
   states: "if two or three different parts of your app could benefit from a
   similar component, that's a signal to make it reusable." However, extraction
   is only warranted when the component would remain stable across consumers —
   shared components that require branching logic per consumer should not be
   extracted prematurely. [SOURCE:
   medium.com/dailyjs/techniques-for-decomposing-react-components, itnext.io
   reusable-readable-maintainable-components]

6. **Strangler Fig: 7-Step Proven Process with Outputs-First Ordering**
   [CONFIDENCE: HIGH]

   Shopify's production-validated process: (1) define public interface, (2)
   replace callers to use new interface, (3) create new data source, (4)
   dual-write with transactions, (5) backfill historical data, (6) migrate reads
   to new source, (7) remove legacy code. A critical refinement (2025):
   implement stranglers in outputs-first order. Strangling pure outputs (e.g.,
   event streams) before inputs/outputs (REST APIs) before pure inputs avoids
   the "Writeback anti-pattern" where the new system must write back to legacy.
   [SOURCE: shopify.engineering/refactoring-legacy-code-strangler-fig-pattern,
   shermanonsoftware.com/2025/04/21/the-strangler-fig-pattern-has-an-implementation-order-outputs-first]

7. **Seam Theory: Extract at Dependency Injection Points** [CONFIDENCE: HIGH]

   Michael Feathers' seam model: a seam is "a place where you can alter behavior
   in your program without editing in that place." Extraction candidates are
   identified by where external dependencies, slow operations, or I/O calls
   exist — these are natural seam points. Three seam types: parameter-based
   (injectable dependencies), service-locator (lookup-based swap), module-level
   (mutable exported functions). These seam points define extraction-safe
   boundaries. [SOURCE: martinfowler.com/bliki/LegacySeam.html,
   understandlegacycode.com/blog/key-points-of-working-effectively-with-legacy-code]

8. **DDD Bounded Contexts Are the Canonical Service Extraction Unit**
   [CONFIDENCE: HIGH]

   Microsoft Azure Architecture Center (2026 update): design microservices
   around business capabilities, not horizontal technical layers. A bounded
   context boundary is signaled when: (a) the same term has different meanings
   in different areas (ubiquitous language divergence), (b) business rules
   differ significantly across areas, (c) different teams own different areas.
   The 4-step process: (1) analyze domain, (2) define bounded contexts, (3)
   apply tactical DDD, (4) identify microservice boundaries. [SOURCE:
   learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis]

9. **Robert Martin's Package Principles Define Stable Extraction Boundaries**
   [CONFIDENCE: HIGH]

   Three principles govern where to draw package extraction boundaries:
   - **Common Closure Principle**: components that change together belong in the
     same package
   - **Common Reuse Principle**: components used together belong in the same
     package
   - **Stable Dependencies Principle**: volatile packages should depend on
     stable packages, never the reverse
   - **Stable Abstractions Principle**: stable packages should be abstract
     (extensible); unstable packages can be concrete The "Zone of Pain"
     (stable + concrete) and "Zone of Uselessness" (abstract + unstable) are
     anti-patterns to avoid. [SOURCE:
     docs.flxbl.io/flxbl/techniques/development-practices/defining-the-boundaries-of-a-package,
     kevbuchanan.github.io/posts/stable-abstraction-principle]

10. **Micro-Frontend Extraction Requires Team-Scale Organizational
    Justification** [CONFIDENCE: HIGH]

    2025 consensus: micro-frontends are only worth the overhead when (a) 4+
    independent teams work on the same frontend, (b) parts need different
    technology stacks, (c) features need independent deployment cadences. For
    teams smaller than 10 developers or applications without clear domain
    boundaries, the complexity overhead (separate CI/CD pipelines, dependency
    management, performance overhead of 10-30%) outweighs the benefits. "Modular
    monolith" is the recommended mid-ground for most teams. [SOURCE:
    martinfowler.com/articles/micro-frontends.html,
    dev.to/tahamjp/micro-frontends-in-2025-are-they-still-worth-it-23lp]

11. **Package-by-Feature Over Package-by-Layer Signals Extraction Readiness**
    [CONFIDENCE: MEDIUM]

    Package-by-feature organization is the prerequisite signal that a module is
    ready for extraction: when code is grouped by business feature rather than
    technical layer, extraction costs are lower and boundaries are clearer. When
    feature-grouped packages have diverged in change frequency, team ownership,
    or deployment needs, those are the extraction candidates. Cross-feature
    dependencies reveal extraction risks before committing. [SOURCE:
    medium.com/@felixnjenge78/package-by-feature-vs-package-by-layer,
    feature-sliced.design/blog/frontend-monorepo-explained]

12. **Module Federation (Webpack 5) Is the Practical Extraction Mechanism for
    Micro-Frontends** [CONFIDENCE: HIGH]

    The 2024-2025 standard workflow: keep the monolith as the shell (host)
    application, extract one feature as a remote module first (e.g., settings
    page), verify stability, then extract the next. Module Federation allows
    runtime sharing with `singleton: true` for shared dependencies. Three common
    problems and solutions: style conflicts (CSS prefix namespacing), dependency
    mismatches (singleton enforcement), routing conflicts (namespaced route
    paths). Production-ready and battle-tested at ByteDance, Microsoft scale.
    [SOURCE:
    blog.logrocket.com/solving-micro-frontend-challenges-module-federation,
    dev.to/krish_kakadiya_5f0eaf6342/mastering-micro-frontends-in-2025]

---

## Detailed Analysis

### SQ-1: Extraction Candidate Heuristics

#### Static Analysis Signals

The classical signal set for extraction candidates centers on four dimensions:

**Cohesion signals (internal):**

- Methods that cluster together and share a subset of the class's fields
  (Feathers' "grouping methods" heuristic)
- Private methods that have grown beyond single-use helpers into their own
  responsibility cluster
- Data clumps: groups of 3+ variables that always travel together (Fowler)

**Coupling signals (external):**

- Feature Envy: a method uses more features of another class than its own
- Shotgun Surgery: a change requires touching many unrelated files
- Change Coupling (Tornhill): files that consistently change together
  empirically belong together

**Complexity thresholds:**

- Long Method: extract when a method can be given a clear separate intent
- Large Class: extract when distinct responsibility clusters emerge, detectable
  by separate field subsets
- Divergent Change: one class changes for multiple unrelated reasons = separate
  responsibilities = extract

#### Behavioral/Temporal Analysis Signals (Tornhill Approach)

Beyond static analysis, behavioral signals from git history provide stronger
prioritization:

1. **Hotspot composite metric**: files with both high complexity AND high change
   frequency are the highest-priority extraction candidates — they represent
   both greatest pain and greatest opportunity
2. **Stable old code**: "Old code usually has no bugs" — mature, rarely-touched
   components with clear purpose make excellent library extraction candidates;
   they have proven their stability
3. **Temporal coupling discovery**: running
   `git log --diff-filter=M --follow --name-only` to find files that co-change
   reveals hidden coupling that dependency analysis misses

#### Decision Rules for Extraction Timing

| Signal                                                     | Extraction Recommended  |
| ---------------------------------------------------------- | ----------------------- |
| 3+ independent consumers with identical logic              | Yes (Rule of Three)     |
| 2 consumers with identical logic                           | Wait (Rule of Two)      |
| Abstraction nameable with clear intent                     | Yes                     |
| Abstraction requires boolean parameters to handle variants | No (premature)          |
| Component complexity + churn both high                     | Yes (hotspot)           |
| Component stable, old, rarely changed                      | Yes (library candidate) |
| Single consumer, speculative reuse                         | No                      |

#### Test-Based Signals (from Feathers / codesai)

The "Bloated Constructor" test smell is a critical extraction signal: when test
setup requires simulating many peer objects just to test one class's behavior,
the implicit abstraction should become explicit. Additionally: tests that break
frequently due to interface churn within a cluster of collaborating objects
signal extraction need.

---

### SQ-2: Strangler Fig Pattern

#### Core Mechanics

The strangler fig wraps old behavior incrementally: a facade/proxy intercepts
requests and routes them to either the legacy system or newly extracted
services. Over time, more routes point to new services until the legacy system
receives no traffic and can be decommissioned.

#### Shopify's 7-Step Production Process

1. **Define interface** — create a public interface (new model or new methods on
   existing class) that still reads from the legacy source
2. **Replace old calls** — incrementally redirect all callers to the new
   interface
3. **Create new data source** — add new table/column for the extracted concern
4. **Dual-write** — write to both old and new with transactions to maintain
   consistency
5. **Backfill** — background job migrates historical data; pessimistic locks
   prevent race conditions
6. **Migrate reads** — switch readers to the new data source exclusively
7. **Remove legacy** — stop writes to old source, delete obsolete code and
   columns

**Key quality gate**: use complexity metrics (Flog, cyclomatic complexity) to
identify which parts of large classes need extraction most urgently before
starting this process.

#### Outputs-First Ordering Rule (2025 Insight)

When a legacy system has multiple integration points (event streams, REST APIs,
inputs), the correct extraction order is:

1. Pure outputs first (e.g., Kafka/event streams) — independent, no feedback
   loop
2. Input/output combinations second (e.g., REST APIs)
3. Pure inputs last

Starting with inputs creates partial strangling that forces the "Writeback
anti-pattern" (new system writes back to legacy for downstream consumers).
Starting with outputs allows safe incremental migration.

#### Documented Failure Modes

- **Distributed Monolith**: failing to implement an Anti-Corruption Layer and
  instead just wrapping old DB calls in a new API — the services appear
  extracted but remain tightly coupled to legacy data model
- **Façade Bottleneck**: the routing proxy introduces latency or becomes a
  single point of failure
- **Wrong Decomposition Boundaries**: extracting before understanding the domain
  means boundaries will be wrong and will need re-extraction
- **Permanent Dual-Write**: data synchronization that was intended as temporary
  becomes permanent because no one commits to full migration
- **Monolith Keeps Growing**: new features continue flowing into the legacy
  system instead of the new services, undermining the extraction effort

#### When NOT to Use Strangler Fig

- System is small and near end-of-life
- Components are too tightly coupled to isolate safely (data model is fully
  interleaved)
- Organization lacks DevOps maturity to run dual systems
- No identifiable architectural "seams" exist

#### Case Studies

- **Shopify**: Extracted store settings from monolithic Shop model using the
  7-step process above. Code quality metrics (Flog) identified extraction
  candidates within the Shop model.
- **Allianz Insurance**: Combined Strangler Fig with Apache Kafka CDC to sync
  legacy mainframes with modern cloud services in real time during migration.

---

### SQ-3: API and Interface Extraction

#### Stable Interface Boundary Signals

An interface is ready to become a package boundary when:

1. **Independent change rate**: the interface changes for different reasons than
   its callers — the stable side should absorb more external dependencies than
   volatile side
2. **Ubiquitous language divergence**: the same term has different meanings in
   different areas (DDD signal — separate bounded contexts, therefore separate
   interfaces)
3. **Multiple downstream consumers with different needs**: when different
   callers need different subsets of an interface, that interface should be
   split (Interface Segregation Principle)
4. **External system integration point**: any point where the application
   depends on an external system (legacy API, third-party service) should have
   an explicit, stable boundary — Anti-Corruption Layer or Open Host Service
   pattern

#### Robert Martin's Package Design Principles as Boundary Tests

**For cohesion (what goes in a package):**

- Common Closure Principle: would a change here require changes to other
  components outside this package? If yes, those components belong together
- Common Reuse Principle: are these components always deployed and used
  together? If yes, they belong in the same package

**For stability (how stable should a boundary be):**

- Stable Dependencies Principle: volatile packages must not be depended on by
  stable packages. Map dependency direction before extracting
- Stable Abstractions Principle: if a package is stable (depended on by many),
  make it abstract. Concrete + stable = "Zone of Pain"

**Metrics for stability score:**

- I (instability) = Ce / (Ca + Ce), where Ce = efferent couplings (dependencies
  out), Ca = afferent (dependencies in)
- I = 0 is maximally stable; I = 1 is maximally volatile
- Boundaries should flow from I=1 to I=0

#### Contract-First API Design as Boundary Enforcer

Healthy service boundaries show these properties at their API contract:

- Business-centric language (nouns/verbs from domain, not DB schema)
- Explicit, unambiguous field/type definitions
- Extensible (additive changes don't break consumers)
- All failure paths documented, not just success cases
- Versioning strategy that allows independent consumer evolution

Contract-first design (define the API before the implementation) forces explicit
boundary thinking before code is written — it surfaces hidden coupling that
would otherwise be discovered late.

#### Interface Segregation as Extraction Tool

Signs a "fat interface" should be split and extracted:

- Unused method stubs (`throw new UnsupportedOperationException()`)
- Interface names containing conjunctions ("And", "Or") — signals multiple
  responsibilities
- Small changes in one module trigger cascading updates in unrelated modules
- Different clients use completely non-overlapping method subsets

Extraction approach: identify distinct client groups, extract a minimal
interface for each client group, give each a meaningful domain name, migrate
incrementally rather than all at once.

#### Event Storming for Boundary Discovery

Pivotal events in an event storming session often indicate natural bounded
context transitions. Signals:

- Domain terminology changes at boundary (different ubiquitous language)
- Parallel event streams that are not directly coupled to each other (separate
  swimlanes)
- Aggregate clusters that have no shared entities with adjacent clusters

---

### SQ-4: Micro-Frontend Extraction

#### Decision Criteria: When to Extract

**Extract a micro-frontend when:**

- 4+ independent teams need to deploy the same frontend independently
- Features have materially different deployment cadences (weekly vs. quarterly)
- Teams need technology stack independence
- A feature has clear vertical business domain ownership (full-stack,
  end-to-end)
- The application is large enough that the monolith is meaningfully slowing team
  velocity

**Do not extract when:**

- Fewer than 10 developers on the frontend
- Application is small or early-stage
- No strong DevOps capability to manage multiple independent CI/CD pipelines
- Teams don't have clear domain boundaries
- The overhead of coordination matches or exceeds the coordination problem being
  solved

**The 4+ team rule of thumb** is the most reliable organizational signal. The
coordination overhead of micro-frontends (multiple pipelines, Module Federation
versioning, CSS isolation) is only worthwhile when the coordination overhead of
a monolith exceeds it — which happens around 4-5 teams.

#### Extraction Workflow (Module Federation Approach)

1. **Keep monolith as shell (host)** — the existing app becomes the container;
   do not rewrite it
2. **Extract one low-risk, stable feature as a remote** — settings page, admin
   panel, or other high-cohesion, low-coupling feature
3. **Configure Module Federation plugin** on both shell and remote
4. **Implement shared dependency strategy** — `singleton: true` for React,
   ReactDOM to avoid duplicate instances
5. **Establish isolation boundaries** — CSS namespacing, namespaced routes
   (`/app1/settings` not `/settings`), custom event bus (not shared Redux)
6. **Verify stability for 2-4 weeks** before extracting the next feature
7. **Iterate, gradually decomposing over 3-6 months**

#### Shell vs. Remote Responsibility Split

**Shell application owns:**

- Global layout and navigation
- Authentication and token management
- Theming and design system tokens
- Shell-to-remote communication contracts (minimal event API)

**Remote micro-frontend owns:**

- Full vertical feature domain (UI + BFF/API)
- Independent CI/CD pipeline
- Independent deployment authority
- Internal state management

#### Communication Patterns

- **Preferred**: URL as communication medium (route-based signaling), custom
  browser events via `window.dispatchEvent()`
- **Avoid**: Shared Redux store, direct cross-app function calls, shared
  database connections
- **Rule**: Minimize cross-app communication; excessive cross-app state sharing
  re-introduces the coupling you were trying to eliminate

#### Known Technical Challenges with Solutions

| Challenge                     | Solution                                                  |
| ----------------------------- | --------------------------------------------------------- |
| Style conflicts               | CSS prefix per micro-frontend (e.g., `.app1-button`)      |
| Dependency version mismatch   | `singleton: true` in Module Federation config             |
| Routing conflicts             | Namespaced route paths per app                            |
| Dynamic loading errors        | `output.publicPath: "auto"` in webpack                    |
| Performance (10-30% overhead) | Lazy loading + real-world measurement before optimization |

#### The Modular Monolith Alternative (2025 Pragmatic Shift)

For most mid-size teams, a modular monolith with strict boundaries provides 80%
of the organizational benefits of micro-frontends at 20% of the complexity cost.
Feature-sliced design and strict module boundaries (Nx workspace rules, barrel
file enforcement) achieve team autonomy without the full distribution overhead.

---

## Practical Extraction Decision Framework

### Decision Gate 1: Is there a real problem extraction would solve?

Ask in order:

1. Is a component suffering high change frequency and high complexity? (Tornhill
   hotspot)
2. Are multiple teams blocked by deployment coupling?
3. Is there a clear interface boundary that is frequently violated?
4. Are there multiple independent consumers of the same logic?

If "no" to all four: do not extract. Duplication is cheaper than wrong
abstraction.

### Decision Gate 2: Is the boundary well-understood?

1. Can you name the extracted component without conjunctions ("and/or")?
2. Does the component have a single reason to change?
3. Do all three of (common closure, common reuse, stable dependency direction)
   align?

If you cannot answer yes to all three: wait, gather more context.

### Decision Gate 3: Is the extraction safe to do incrementally?

1. Can you identify seams (dependency injection points, interface boundaries)?
2. Can you establish a façade/routing layer before extraction?
3. Can you dual-write during transition without data integrity risk?
4. Is there sufficient test coverage to catch regressions?

If "no" to safety questions: add seams first (sprout/wrap techniques), then
extract.

### Prioritization Matrix (Sam Newman's Value vs. Difficulty)

Place extraction candidates on a 2x2:

|                     | High Value                      | Low Value             |
| ------------------- | ------------------------------- | --------------------- |
| **Low Difficulty**  | Extract first (wins + momentum) | Extract if incidental |
| **High Difficulty** | Plan carefully, extract second  | Defer indefinitely    |

**High value signals**: enables other extractions, unlocks team deployment
independence, resolves a scaling bottleneck, eliminates a hotspot.

**Low difficulty signals**: few dependencies, clear domain boundary, existing
interface, good test coverage.

### The Extraction Anti-Pattern Checklist

Before extracting, verify these anti-patterns are NOT present:

- [ ] Distributed Monolith risk: would the extracted service still share the
      same data model?
- [ ] Premature abstraction: fewer than 3 consumers and speculative reuse?
- [ ] Wrong boundary: does the proposed boundary cross a natural DDD aggregate?
- [ ] Writeback risk: would the new service need to write back to the legacy
      system for downstream consumers?
- [ ] Permanent dual-write: is there a concrete plan and deadline for completing
      the migration?

---

## Gaps Identified

1. **Quantitative thresholds for hotspot metrics**: Tornhill's qualitative
   guidance (high churn + high complexity) is clear, but no specific threshold
   values (e.g., ">10 changes in 6 months + >500 LOC = hotspot") are available
   in public sources. CodeScene is the commercial tool that applies these
   metrics; the exact thresholds are proprietary.

2. **Frontend-specific cohesion metrics**: Static cohesion metrics (LCOM, etc.)
   are well-studied for object-oriented class systems but less established for
   React component trees. No publicly available tool provides automated
   extraction candidate scoring for React codebases.

3. **Event Storming to extraction mapping**: While event storming is
   well-documented as a bounded context discovery technique, specific guidance
   on translating event storming output into a prioritized extraction queue with
   effort estimates is sparse in public sources.

4. **Data gravity / database extraction complexity**: Most guidance focuses on
   code boundary extraction; the separate problem of database schema
   decomposition (which is often the hard constraint in strangler fig
   migrations) is underspecified across the sources found.

5. **Sam Newman's 2024 formal criteria**: Newman's specific formal criteria for
   extraction prioritization from recent conference talks are cited secondhand
   but the primary source content was not directly accessible.

---

## Serendipity

- **Outputs-first strangler ordering** (Sherman 2025): the insight that
  strangler fig has a mandatory implementation order (outputs → I/O → inputs) to
  avoid the Writeback anti-pattern is practically important and rarely
  documented explicitly. This is a high-value operational detail for any
  extraction project.

- **"Composite simpler than sum of parts" principle** (codesai 2026): an
  extraction is only valid if "the API of a composite object should not be more
  complicated than that of any of its components." This is a concrete test to
  apply before committing to an extraction.

- **Bloated Constructor as test smell = extraction signal**: the test setup
  complexity is often more visible than production code complexity. A test that
  requires 8+ constructor arguments or complex mock setups is a reliable early
  warning of extraction need — often detectable before the production code
  smells become obvious.

---

## Sources

| #   | URL                                                                                                                               | Title                                                    | Type                    | Trust       | CRAAP | Date          |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------- | ----------- | ----- | ------------- |
| 1   | https://shopify.engineering/refactoring-legacy-code-strangler-fig-pattern                                                         | Refactoring Legacy Code with Strangler Fig Pattern       | Engineering blog        | HIGH        | 4.2   | 2022          |
| 2   | https://martinfowler.com/articles/micro-frontends.html                                                                            | Micro Frontends                                          | Authoritative reference | HIGH        | 4.8   | 2019, updated |
| 3   | https://martinfowler.com/bliki/StranglerFigApplication.html                                                                       | StranglerFigApplication                                  | Authoritative reference | HIGH        | 4.8   | 2004, updated |
| 4   | https://martinfowler.com/bliki/LegacySeam.html                                                                                    | LegacySeam                                               | Authoritative reference | HIGH        | 4.8   | 2023          |
| 5   | https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis                                          | Use Domain Analysis to Model Microservices               | Official docs           | HIGH        | 4.5   | 2026-02-23    |
| 6   | https://understandlegacycode.com/blog/key-points-of-software-design-x-rays/                                                       | Key Points of Software Design X-Rays (Tornhill)          | Technical blog          | MEDIUM-HIGH | 4.0   | 2020          |
| 7   | https://understandlegacycode.com/blog/refactoring-rule-of-three/                                                                  | Don't make Clean Code harder, use Rule of Three          | Technical blog          | MEDIUM-HIGH | 4.0   | 2020          |
| 8   | https://understandlegacycode.com/blog/key-points-of-working-effectively-with-legacy-code/                                         | Key Points of Working Effectively with Legacy Code       | Technical blog          | MEDIUM-HIGH | 4.0   | 2021          |
| 9   | https://refactoring.guru/refactoring/smells                                                                                       | Code Smells (Refactoring Guru)                           | Reference site          | HIGH        | 4.3   | Evergreen     |
| 10  | https://codesai.com/posts/2026/02/bundling-up                                                                                     | Bundling Up to Reduce Coupling                           | Technical blog          | MEDIUM-HIGH | 3.8   | 2026-02       |
| 11  | https://docs.flxbl.io/flxbl/techniques/development-practices/defining-the-boundaries-of-a-package                                 | Defining Package Boundaries (flxbl)                      | Docs site               | MEDIUM      | 3.8   | 2024-2025     |
| 12  | https://kevbuchanan.github.io/posts/stable-abstraction-principle                                                                  | Stable-Abstraction Principle                             | Technical blog          | MEDIUM      | 3.5   | 2018          |
| 13  | https://semaphore.io/blog/domain-driven-design-microservices                                                                      | DDD for Microservices                                    | Technical blog          | MEDIUM-HIGH | 3.8   | 2024          |
| 14  | https://paulserban.eu/blog/post/contract-first-apis-clarifying-service-boundaries-for-healthy-systems/                            | Contract-First APIs                                      | Technical blog          | MEDIUM      | 3.7   | 2024          |
| 15  | https://shermanonsoftware.com/2025/04/21/the-strangler-fig-pattern-has-an-implementation-order-outputs-first/                     | Strangler Fig Has Implementation Order: Outputs First    | Technical blog          | MEDIUM-HIGH | 4.0   | 2025-04-21    |
| 16  | https://www.daydreamsoft.com/blog/strangler-fig-pattern-for-legacy-system-modernization-a-safe-path-to-incremental-transformation | Strangler Fig for Legacy Modernization                   | Technical blog          | MEDIUM      | 3.5   | 2024          |
| 17  | https://blog.logrocket.com/solving-micro-frontend-challenges-module-federation/                                                   | Solving Micro-Frontend Challenges with Module Federation | Technical blog          | MEDIUM-HIGH | 3.8   | 2024          |
| 18  | https://dev.to/tahamjp/micro-frontends-in-2025-are-they-still-worth-it-23lp                                                       | Micro-Frontends in 2025: Are They Still Worth It?        | Developer blog          | MEDIUM      | 3.5   | 2025          |
| 19  | https://www.xenonstack.com/insights/micro-frontend-architecture                                                                   | Micro-Frontend Architecture Best Practices               | Technical blog          | MEDIUM      | 3.5   | 2024-2025     |
| 20  | https://www.ijcaonline.org/archives/volume186/number19/maddeh-2024-ijca-923579.pdf                                                | Examining Coupling and Cohesion Patterns                 | Peer-reviewed paper     | HIGH        | 4.5   | 2024          |

---

## Contradictions

**Contradiction 1: Extract eagerly vs. defer until three occurrences**

Some sources (React docs, component library guidance) recommend extracting when
any component is "complex enough on its own." The Rule of Three discipline
recommends waiting until three occurrences. Resolution: the React guidance
applies to _complexity-based_ extraction (single consumer, too complex for one
component), while Rule of Three applies to _duplication-based_ extraction. Both
can coexist.

**Contradiction 2: Micro-frontends as standard practice vs. harmful complexity**

Earlier (2019-2022) Martin Fowler-era guidance positioned micro-frontends as a
natural evolution for large teams. 2025 consensus has shifted: "For most teams,
a monolithic frontend is the right choice." This is not a factual contradiction
but a maturity-of-practice shift — micro-frontends are now positioned as a
solution to a specific organizational scaling problem, not a default
architecture choice.

**Contradiction 3: Extract high-change components vs. extract stable components
first**

Tornhill recommends targeting high-churn hotspots (extract the painful, complex,
frequently changed code). Newman's "low-hanging fruit first" recommendation
suggests starting with stable, low-risk modules that don't change much.
Resolution: these serve different goals. Tornhill targets components for
_cleanup/refactoring_. Newman targets components for _first microservice
extraction_ as a proof of concept. Extract stable components first to build
confidence, then tackle hotspots.

---

## Confidence Assessment

- HIGH claims: 9
- MEDIUM claims: 3
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The core heuristics (cohesion/coupling, code smells, Rule of Three, strangler
fig steps, DDD bounded contexts, package principles) are well-established across
multiple authoritative sources. The micro-frontend section reflects 2025
practitioner consensus across multiple independent sources. Confidence is
reduced slightly for quantitative thresholds (exact numbers for hotspot
thresholds) and some behavioral analysis specifics.
