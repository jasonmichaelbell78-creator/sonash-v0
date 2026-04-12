# Creator View: Outline (outline/outline)

## 1. What This Repo Understands (+ Blindspots)

Outline understands something that most knowledge-base tools don't bother with:
that the _shape_ of team knowledge matters as much as its content. It knows that
documents need hierarchy (collections > documents > nested documents), that
real-time collaboration requires careful persistence coordination (its
HocusPocus PersistenceExtension uses SELECT FOR UPDATE to prevent race
conditions), and that a rich text editor is an opinionated product decision, not
just a component you drop in.

The MCP server implementation reveals a deeper understanding: that AI agents
will be a first-class consumer of knowledge bases. Rather than bolting MCP on as
an afterthought, Outline routes MCP tools through the same command layer as its
HTTP API. The `buildAPIContext()` bridge in `server/tools/util.ts` is a
deliberate architectural choice -- it says "AI access should have the same
authorization and audit trail as human access." That's a mature position that
most production apps haven't reached yet.

The command pattern (`server/commands/`) is where Outline's real architectural
sophistication lives. Commands like `documentCreator`, `documentMover`, and
`documentUpdater` encapsulate multi-model business logic. Both API routes and
MCP tools delegate to the same commands. This isn't just code reuse -- it's a
statement that business logic belongs in a transport-agnostic layer. It's the
kind of decision that pays compound interest when you add your third surface
(MCP was the second after HTTP).

The plugin system demonstrates understanding of extensibility at scale. 22
plugins with a structural client/server/shared split enforced by the build
system -- not by convention or lint rules, but by actual separate compilation.
The `PluginManager` with its 10 hook types (API, AuthProvider, Processor, Task,
etc.) is a clean registry pattern.

**Blindspots:**

- **Documentation is externalized.** Outline understands how to build great
  internal docs for users, but its _contributor_ documentation lives almost
  entirely at docs.getoutline.com. The repo itself has thin docs -- a 68-line
  ARCHITECTURE.md and a missing CONTRIBUTING.md. For a project of this
  complexity, that's a gap.
- **Frontend testing is effectively absent.** 7 test files for 723 frontend
  source files. The server side has excellent test infrastructure (TestServer
  pattern, 36 factory builders), but the React/MobX layer flies blind.
- **Build system is dated.** The server build is a sequential Babel CLI
  subprocess loop in `build.js` -- no incremental compilation, no parallelism.
  For 2,400 files, this matters.
- **CSP is permissive.** `connect-src: *` in the Content Security Policy is
  justified by a Safari WebSocket bug that was fixed in Safari 15. This is
  security debt that hasn't been cleaned up.

## 2. What's Relevant To Your Work

The highest-relevance items for SoNash and JASON-OS, informed by Deep Read and
Content Evaluation:

**Production MCP Server (`server/tools/`) -- HIGH.** This is the most directly
useful artifact. Outline's 7 MCP tool modules show how to build a production MCP
server that:

- Filters tool registration by OAuth scopes (`AuthenticationHelper.canAccess()`)
- Bridges MCP context to existing API infrastructure (`buildAPIContext()`)
- Uses Zod for input validation (same pattern as SoNash)
- Wraps handlers with tracing (`withTracing()`)
- Returns structured responses via presenters

For JASON-OS Domain 02a (MCP infrastructure), this is the most mature reference
implementation you've analyzed. The `server/tools/fetch.ts` tool is especially
interesting -- it handles URL-or-ID input, self-token resolution ("me",
"current_user"), and multi-resource-type dispatch in a single tool.

**Command Pattern (`server/commands/`) -- HIGH.** SoNash uses Cloud Functions
(`httpsCallable`) for server-side mutations. If SoNash ever exposes an MCP
surface (which JASON-OS Domain 02a suggests), the command pattern provides the
abstraction layer. Business logic in transport-agnostic commands; Cloud
Functions AND MCP tools both delegate to them. The `documentCreator.ts` to
`documentUpdater.ts` to `documentMover.ts` pattern is clean enough to port
conceptually.

**CLAUDE.md Comparison -- HIGH.** Outline's 197-line CLAUDE.md (really
AGENTS.md) is prescriptive about code style: class member ordering, JSDoc
requirements, interface-over-type preference, specific ProseMirror security
rules. SoNash's 135-line CLAUDE.md is prescriptive about behavioral guardrails
and agent workflows. These are complementary approaches. The takeaway isn't
"copy Outline's" -- it's that Outline proves a CLAUDE.md can carry real code
conventions without becoming bloated. SoNash's CLAUDE.md carries behavioral
rules; combining both would be the full picture.

**Plugin Architecture (`PluginManager` + Hook enum) -- MEDIUM-HIGH.** The 10
hook types in `server/utils/PluginManager.ts` (API, AuthProvider, EmailTemplate,
Processor, Task, etc.) with priority-based ordering and auto-discovery is a
clean extensibility model. For JASON-OS, where skills and agents need
registration/discovery/priority, this is directly analogable.

**@Encrypted Decorator -- MEDIUM.** Field-level encryption at the model layer
via `server/models/decorators/Encrypted.ts` using `sequelize-encrypted`. For
SoNash M4.5 (Security & Privacy), the pattern of decorating sensitive fields
rather than encrypting at the application layer is worth studying.

**TestServer Pattern -- MEDIUM.** `server/test/TestServer.ts` creates a real Koa
HTTP server on an ephemeral port for integration tests. SoNash tests mock
`httpsCallable` -- the Outline approach tests the actual transport. Different
architectures, but the principle of testing through the real API surface
applies.

**Onboarding Content-as-Code (`server/onboarding/`) -- MEDIUM.** 4 markdown
templates injected into new workspaces. For SoNash M7.3 Nashville & Knowledge,
this pattern of storing user-facing content as markdown templates in the
codebase (rather than in a CMS) is a good fit for a developer-centric project.

## 3. Where Your Approach Differs

| Area                | Outline                                           | SoNash                                         | Classification                         |
| ------------------- | ------------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| State management    | MobX stores + Sequelize ORM                       | Firebase + React hooks                         | **Different**                          |
| AI workflow docs    | CLAUDE.md: code conventions (197 lines)           | CLAUDE.md: behavioral guardrails (135 lines)   | **Ahead**                              |
| MCP integration     | Production MCP server with OAuth + scoped tools   | MCP servers configured, none first-party       | **Behind**                             |
| Plugin/skill system | PluginManager, 10 hook types, auto-discovery      | 81 skills, flat directory, no runtime registry | **Behind (runtime), Ahead (quantity)** |
| Testing approach    | TestServer + factory (server), near-zero frontend | Mock-based httpsCallable, 3720 passing         | **Different**                          |
| Real-time collab    | Y.js + HocusPocus + WebSockets                    | Not applicable                                 | **N/A**                                |
| Security model      | OAuth + CanCan + @Encrypted                       | Firebase Auth + Security Rules + App Check     | **Different**                          |
| Documentation       | 68-line ARCHITECTURE.md, external docs            | SESSION_CONTEXT, ROADMAP, 20+ doc types        | **Ahead**                              |

**Summary:** SoNash is ahead on AI workflow documentation and meta-tooling
ecosystem. Outline is ahead on production MCP implementation and runtime plugin
architecture. Both have solid but different security models. The core learning
is in areas where Outline is ahead -- MCP and plugin systems.

## 4. The Challenge

Here's the thing worth sitting with: **Outline has already shipped a production
MCP server, and it did so by building on a transport-agnostic command layer that
already existed.**

SoNash's Cloud Functions are tightly coupled to the `httpsCallable` transport.
If JASON-OS Domain 02a ever needs SoNash to expose an MCP surface -- and the
research suggests it will -- you'll need a command-layer abstraction between
your business logic and your transport. Outline didn't build the command pattern
FOR MCP; they built it years ago for clean architecture, and MCP was a free
lunch.

The question isn't "should you add MCP to SoNash?" -- it's "is your business
logic abstracted enough that adding ANY new surface is cheap?" Right now, the
answer is probably no. Every Cloud Function contains both transport logic and
business logic. That's fine for a single-surface app, but it's architectural
debt if multi-surface is in the future.

## 5. Knowledge Candidates

### T1 -- Active Extraction Candidates

| Candidate                                           | Type      | Novelty | Effort | Relevance |
| --------------------------------------------------- | --------- | ------- | ------ | --------- |
| MCP OAuth scope-filtered tool registration          | pattern   | high    | E2     | high      |
| Command pattern (transport-agnostic business logic) | knowledge | high    | E1     | high      |
| PluginManager hook type registry                    | pattern   | high    | E2     | high      |
| buildAPIContext() MCP-to-API bridge                 | pattern   | high    | E1     | high      |

### T2 -- Systems Understanding

| Candidate                                              | Type      | Novelty | Effort | Relevance |
| ------------------------------------------------------ | --------- | ------- | ------ | --------- |
| @Encrypted field-level decorator pattern               | pattern   | medium  | E1     | medium    |
| TestServer ephemeral-port integration testing          | pattern   | medium  | E1     | medium    |
| Abstract generic Store<T> with request dedup           | pattern   | medium  | E1     | medium    |
| PersistenceExtension SELECT FOR UPDATE race prevention | knowledge | medium  | E0     | medium    |

### T3 -- Lower Priority

| Candidate                                  | Type    | Novelty | Effort | Relevance |
| ------------------------------------------ | ------- | ------- | ------ | --------- |
| Content-as-code onboarding templates       | pattern | low     | E0     | medium    |
| Presenter response formatting layer        | pattern | low     | E1     | low       |
| Bull queue processor BaseProcessor pattern | pattern | low     | E1     | low       |

## 6. What's Worth Avoiding

**The RPC-over-POST API pattern.** Outline uses POST for everything -- reads
included. This abandons HTTP semantics (caching via GET, idempotency headers,
content negotiation) in exchange for simpler client code. For SoNash, which
already has a REST-like Cloud Function surface, adopting RPC-style would be a
regression. The tradeoff makes sense for Outline's architecture but shouldn't be
copied.

**Fat route files.** `server/routes/api/documents/documents.ts` handles ~30
endpoints in one file. The command pattern keeps business logic clean, but the
routing layer itself becomes a discovery burden. SoNash's approach of one Cloud
Function per operation is actually cleaner here.

**Externalized documentation.** Outline's README delegates all setup,
deployment, and API docs to docs.getoutline.com. For an open-source project
wanting contributors, this creates friction. SoNash's approach of keeping
operational docs in-repo (SESSION_CONTEXT.md, ROADMAP.md, 20+ doc types) is
better for contributor experience, even if it requires more maintenance.

**CSP-as-wildcard.** The `connect-src: *` CSP policy justified by a years-old
Safari bug is the kind of debt that becomes invisible. Don't let "temporary"
permissive security settings become permanent.
