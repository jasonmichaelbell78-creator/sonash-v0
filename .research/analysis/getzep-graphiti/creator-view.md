# Creator View — getzep/graphiti

_A 25K-star Apache-2.0 Python framework for building temporal context graphs for
AI agents, backed by Zep Software. Reviewed against a home-context centered on
Claude Code OS (portable skills, agents, memory) with SoNash as a secondary
recovery-notebook app._

---

## 1. What This Repo Understands (and its blindspots)

Graphiti understands one thing very deeply: **memory for agents is a temporal
problem, not a document problem.** Its whole design ethos hinges on the claim
that truth is a window, not a value. When you tell an agent "Kendra loves Adidas
shoes," Graphiti doesn't store that as a string — it stores it as an edge with a
`valid_from` and a `valid_to`, and when Kendra later switches to Nikes, the
Adidas edge isn't deleted. It's _invalidated_. History stays queryable. This is
the bi-temporal model, and it's the one idea that the rest of the repo orbits
around.

From that one root commitment, a lot falls out consistently. Every derived fact
must trace back to an "episode" — the raw ingested data that produced it — so
provenance is built in, not bolted on. Ingestion is incremental, not batch,
because truth in an agent's world is always arriving. Retrieval is hybrid
(semantic + BM25 + graph traversal + cross-encoder reranking) with a stated goal
of sub-second latency, because if you can't query fast, an agent can't use you.
The ontology has both a prescribed side (Pydantic models you declare upfront)
and a learned side (structure that emerges from the data), so you can start
simple and let patterns surface. And because agents need to operate on shared
graphs, everything is tagged with a `group_id` for multi-tenancy. The design
feels _inevitable_ given the starting premise.

There's also a quieter understanding layered on top: **AI assistants need their
own operating docs.** `mcp_server/docs/cursor_rules.md` is a 34-line document
handed to any Claude Desktop or Cursor instance that wires into the graph. It
tells the AI how to behave: search first, filter by entity type, save new
preferences immediately, follow discovered procedures step-by-step. This is not
a README for humans — it's a protocol for machines. And the protocol is not
optional in the "use it when you feel like it" sense; it's written as if the
assistant is an employee with a handbook. The fact that Graphiti shipped _this_
alongside the code signals they've thought seriously about how to make a memory
system actually get used by the agents that own it.

But there are real blindspots. Graphiti's "pluggable everything" story has a
hidden floor: the README explicitly warns that the framework "works best with
LLM services that support Structured Output (OpenAI, Gemini)," and smaller
models "may result in incorrect output schemas and ingestion failures."
Pluggable is not equal. Ollama is listed, but the fine print is that you'll hit
schema errors unless you pick your local model carefully. The REST API server in
`server/` has zero authentication — anyone who reaches port 8000 can
`DELETE /group/{group_id}` or clear the whole graph. Graphiti's response is
"wrap it yourself," which is honest but unsporting; the deploy-as-you-wish
stance is a real burden for anyone who doesn't already run API gateways. The
docs are strong at the conceptual layer (README is a masterclass) but thin at
the reference layer — there's no architecture overview document, no migration
guide, no performance tuning guide outside the MCP README, and the 15 examples
assume a database is already running before you `python quickstart.py`. The
project knows what it's for and says so; the project does not always know what
it's _hard_ for.

## 2. What's Relevant To Your Work

Six things from Graphiti earn a place in your CC-OS thinking right now, and two
of them are specific enough to act on this week.

The first and strongest is **`mcp_server/docs/cursor_rules.md`**. This is the
artifact you don't have. Your `CLAUDE.md` v6.0 has §4 Behavioral Guardrails — 16
items about asking first, not implementing without approval, reading SKILL.md
before improvising. Those are _meta_ rules about how Claude should behave. But
you have no equivalent document that tells Claude _how to use the memory
system_. You have memory MCP configured. You have the episodic-memory skill. You
have `C:\Users\jason\.claude\projects\...\memory\MEMORY.md` with a 4-type
ontology. And yet there's no 34-line protocol that says "before starting any
task, search MEMORY.md and the memory MCP; filter by type; save new
preferences/feedback as they arrive; respect discovered procedures." Graphiti's
cursor_rules.md is exactly the template for this. It's adjacent to — not
redundant with — the Auto Memory instructions already in your harness, because
those tell Claude _what to save_; cursor_rules tells Claude _what to search and
when_.

The second is the **versioned LLM model catalog in Graphiti's `CLAUDE.md`**.
Their doc carries a dated ("as of November 2025") table: GPT-5 family (reasoning
models, `temperature=0` required), Claude 4.5 pinned dates, Gemini 2.5. The
_point_ of this is not documentation — it's a defense against an AI assistant
"correcting" a current model name like `gpt-5-mini` to something older it saw in
training. You have §1 Stack Versions for JS frameworks (Next.js 16.2, React
19.2) but no equivalent for LLM model names. Given you run agents that spawn
agents that call models, and given the Claude Opus 4.7 tag I'm running on now, a
catalog section would pay for itself the first time it prevents a rewrite.

The third — and this one's conceptual — is the **9-type MCP entity ontology** vs
your 4-type MEMORY.md ontology. Graphiti's types are `Preference`,
`Requirement`, `Procedure`, `Location`, `Event`, `Organization`, `Document`,
`Topic`, `Object`. Yours are `user`, `feedback`, `project`, `reference`. There's
partial overlap: Graphiti's "Preference" roughly maps onto your user-memory
preference bullets; "Procedure" maps onto your feedback-type "how to apply"
lines. But Graphiti has nothing like your `feedback` type — corrections the user
gave, with a "why" and "how to apply" — and you have nothing like their `Event`
or `Location`, because your memory is solo-developer scoped and doesn't need
geospatial or time-bounded activity tracking. The ontologies aren't substitutes.
They're tuned for different agent jobs. Worth noting when you work on
episodic-memory skill evolution: procedure/preference/requirement is a more
action-oriented vocabulary than user/feedback/project/reference, and may serve
an agent better when deciding _what to do_ vs _who to be_.

The fourth is the **opt-out telemetry pattern**. Your statusline collects
session metadata. Graphiti's README has a "What we collect / What we don't
collect" block that is 10 lines of pure trust-building: "never collect content,
API keys, paths, queries." They point at the source file
(`graphiti_core/telemetry/telemetry.py`). They auto-disable under pytest. They
use a local anon UUID at `~/.cache/graphiti/telemetry_anon_id`. This is a
template you can lift almost word-for-word for any future home tool that does
phone-home.

Fifth, **Structured Output as a hard floor**. Graphiti's README pauses to warn
that LLM pluggability only works well with providers that support structured
output, and smaller models fail. This is a guard-rail _pattern_, not a code
pattern. Your deep-research skill dispatches searcher agents and implicitly
assumes any Claude model works. If you ever expand that beyond Anthropic (and
Anthropic has structured output natively, so you're fine for now), adopt
Graphiti's posture: name the floor, don't hide it behind "configurable
provider."

Sixth, the **SEMAPHORE_LIMIT per-provider tuning table** in the mcp_server
README. OpenAI Tier 1 (3 RPM) → limit 1-2; Tier 3 → 10-15; Anthropic default →
5-8; Ollama → hardware-dependent. Your CLAUDE.md §2 rule 3 says "handle 429
errors gracefully" but doesn't give operational guidance. Deep-research-searcher
agents are exactly the kind of fan-out workload where this guidance would help.
Low priority but cheap to adopt: a sentence or two in
`.claude/skills/deep-research` about "expect to dial concurrency per Claude
tier, not per formula."

And a seventh, briefly: Graphiti has **two Claude-Code-Review workflows in
`.github/workflows/`** (one automatic, one manual) alongside a general
`claude.yml`. Three Claude-named workflows on a single repo is a signal that
their dual-trigger pattern is worth extracting for any CC-OS project template
you build.

### 2b. Use-As-Is Verdict

**Classification:** framework.

**Verdict:** **Extract-only.**

Not Adopt, because Graphiti is Python 3.10+ and expects Neo4j / FalkorDB / Kuzu
/ Neptune as a graph backend. Your home stack is Next.js 16.2 / React 19.2 /
Firebase / TypeScript. Stack mismatch is terminal — you'd be importing a whole
operational surface (a graph DB, an LLM budget) to get a memory abstraction you
don't currently need.

Not Trial either. You don't have an agent with long-term-memory requirements
that justify standing up a Neo4j instance plus OpenAI spend. The episodic-memory
skill and memory MCP cover the "search conversations, save preferences" use case
at a fraction of the operational cost. Adding Graphiti would be building
infrastructure for a problem you haven't been blocked on.

Not Avoid — the code is Apache-2.0, clean, and the concepts are first-rate.

Extract-only means: take the patterns, not the package. Specifically: the
cursor_rules.md protocol, the versioned model catalog, the telemetry framing,
the SEMAPHORE guidance, the "structured output is a floor" warning. Optionally:
run the MCP server standalone against Claude Desktop as a _personal_ memory
experiment, separate from SoNash and from CC-OS work, just to feel the
bi-temporal model in your own hands. That would be curiosity, not adoption.

**Blockers for adoption:** language mismatch (Python), infrastructure
requirement (graph DB + LLM API spend), no meaningful use case at home-scale.

**Recommendation:** lift the `cursor_rules.md` pattern into home
`.claude/skills/episodic-memory/` as an AI-client operating protocol, and add a
versioned LLM model-catalog block to `CLAUDE.md` §1.

## 3. Where Your Approach Differs

**Ahead, in a few specific places.** Your home ecosystem is richer than
Graphiti's at the "how AI assistants coordinate" layer. You have 34 agents, 72
skills, convergence loops, sub-agent delegation, team patterns, PR review
workflows — a whole orchestration vocabulary that Graphiti doesn't try to
compete in. Their repo has one CLAUDE.md, one AGENTS.md, and one
cursor_rules.md: that's thin compared to your `.claude/skills/` + MEMORY.md +
SESSION_CONTEXT.md + ROADMAP.md stack. And your memory system is two-tier
(MEMORY.md for persistent user/feedback/project/reference, episodic-memory skill
for conversation transcripts) where Graphiti is single-tier (one temporal
graph). The two-tier split is likely the right shape for solo-developer use;
Graphiti's single-tier is the right shape for multi-agent shared memory.

**Different, but not better-or-worse.** Your memory is file-based (markdown +
JSONL logs) + in-process memory MCP. Graphiti's is an external graph DB. Yours
is simpler to reason about; theirs is richer in queryable structure. Your LLM is
Claude-only for real work; theirs is genuinely polyglot (with caveats). Your
truth model is flat — current state in MEMORY.md, overwritten when corrected.
Theirs is bi-temporal — corrections invalidate but preserve. Both work for what
they're for.

**Behind, honestly, in three places.** First: your memory has no temporal model.
When a feedback correction supersedes an earlier one, the old entry is
overwritten. You have a counter — "corrected 4+ times" — but you've thrown away
the _trajectory_. Graphiti's fact-invalidation model says: keep the original,
timestamp the invalidation, let queries ask "what was true before this was
corrected." That's a real capability gap; corrections are instructive, and
erasing them erases the learning signal. Second: you have no
structured-output-as-floor guard in any home skill that dispatches multiple
models. Graphiti named the floor explicitly. Third: no versioned LLM model
catalog in your `CLAUDE.md`, which matters more as Claude Opus 4.7 diverges from
training-data expectations.

## 4. The Challenge

The challenge Graphiti puts to your home system is this: **when a user
correction supersedes an earlier memory, is the original preserved or
destroyed?**

Look at your `feedback_convergence_loops_mandatory.md` entry — it says
"Corrected 4+ times." A counter. Useful signal. But somewhere in the history of
those four corrections, there was a _first_ version of your thinking that the
user found wrong, and a _second_ attempt that was still wrong in a different
way, and a third, and a fourth, and now a converged understanding. You have the
destination but not the route. If someone asks you in six months "why does the
user insist on convergence loops?", you can quote the current memory, but you
can't show the pattern of failures that made it necessary.

Graphiti's answer is bi-temporal: the old facts remain with a `valid_to`
timestamp; queries can ask about any point in time. That's probably overkill for
your memory system. But a lighter version — a `history:` sub-field in feedback
memories that preserves superseded corrections with dates — is not overkill.
It's a fact-invalidation log for a system that currently overwrites.

The second challenge is this: **who tells Claude to use the memory system, and
when?** Your `CLAUDE.md` §4 has 16 behavioral guardrails. None of them say
"before starting any task, search MEMORY.md and the memory MCP; filter by type;
save new preferences immediately." You rely on the system-prompt instructions in
the auto-memory block to carry that load. Graphiti's answer is different: every
AI client gets a 34-line `cursor_rules.md` handed to it alongside the tools. It
is not assumed, it is _prescribed_.

If Claude forgets to check memory on a given turn, is that Claude's bug or your
prompt's bug? Graphiti's position is: the prompt's bug. The agent should never
be expected to remember without a prompt-level rule. Apply that to your home
system and the missing artifact is clear: an explicit memory-access protocol doc
that lives next to the skills, not inside the system prompt, so it's auditable
and editable.

## 5. Knowledge Candidates

**T1 — active, directly usable:**

- The `cursor_rules.md` pattern as a template for a home `MEMORY_PROTOCOL.md` —
  search first, filter by type, capture immediately, respect discovered
  procedures.
- Versioned LLM model catalog in `CLAUDE.md` — dated table of current model
  names so Claude doesn't "correct" `claude-opus-4-7` to `claude-3-opus`.
- Opt-out telemetry transparency template — "what we collect / what we don't"
  block usable verbatim for any home tool that phones home.
- "Structured Output is a hard floor" posture — named in any home skill that
  dispatches multiple LLM providers.

**T2 — systems, would need integration:**

- Bi-temporal fact invalidation, lighter version — a `history:` field in
  feedback memories preserving superseded corrections. Not a full graph-DB
  model; just don't overwrite.
- Cross-walk of Graphiti's 9-type ontology against home's 4-type. The
  `Procedure` type in particular — action-oriented vs your reference-oriented
  vocabulary — is worth considering for episodic-memory skill evolution.
- SEMAPHORE_LIMIT tuning guidance ported into deep-research skill docs:
  per-Claude-tier concurrency expectations for searcher dispatch.

**T3 — lower, reference-only:**

- Cross-encoder reranking via log-probs on boolean classification prompts.
  Interesting pattern; applies only if home ever needs reranking.
- Driver Operations Redesign spec — a clean namespace-pattern architecture for
  pluggable backends. Useful quality-reference for any home refactor that
  touches backend drivers.
- The CI pattern of dual Claude-Code-Review workflows (auto + manual) alongside
  a general `claude.yml`.

## 6. What's Worth Avoiding

Graphiti ships a REST server with **zero authentication** by default.
`DELETE /group/{group_id}` is live on port 8000 the moment you
`docker compose up`. Their stance is "bring your own API gateway," which is
honest for a library but foolish for anyone who deploys the defaults. If home
ever fronts a backend with FastAPI, don't treat "auth is someone else's job" as
a shippable position. It isn't.

Graphiti's **examples assume the database is already running**. There's no "5
minutes to Hello World" claim in the README because there can't be — you're
installing Neo4j Desktop or running `docker run falkordb/falkordb` before any
Python code can be useful. This is a friction pattern. Home skills should either
be self-contained or state the dependency _in the first sentence_, not five
paragraphs in.

The **pluggable-everything-but-not-really** framing is worth avoiding. Graphiti
lists OpenAI, Azure, Anthropic, Gemini, Groq, and Ollama as LLM providers — and
then buries the warning that smaller models cause schema failures. Home is safer
here (Claude-only by policy) but the lesson generalizes: if a feature is
pluggable with floors, name the floors in the same sentence as the feature. Not
in the fine print.

And one micro-signal: Graphiti's `tests/test_graphiti_mock.py` is **2053
lines**. That's not in itself a bug — it may reflect deep coverage — but a mock
file that size is usually either a treasure of test surface or a fragile house
of cards one refactor away from rewriting. When home test files grow past a few
hundred lines, split them before they reach mock-brittleness.
