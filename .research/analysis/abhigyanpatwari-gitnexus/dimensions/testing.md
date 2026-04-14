# GitNexus Testing Infrastructure & Eval Framework Assessment

**Date:** 2026-04-13

## Summary Ratings

- Test Infrastructure Band: **Robust** (85/100)
- Eval Framework Band: **Comprehensive** (90/100)
- Overall Score: **87/100**

### Justifications

**Test Band:** Vitest + Playwright across 211 test files; multi-platform CI;
pre-commit typechecking enforced; coverage thresholds auto-ratchet.
Well-structured (unit/integration/e2e) with realistic test fixtures and CLI E2E
scenarios.

**Eval Band:** Sophisticated SWE-bench harness with three comparative modes
(baseline/native/native_augment) for measuring code intelligence impact.
Docker-based per-instance isolation with eval-server (~100ms tool calls).
Multi-model support (Claude, GLM, MiniMax). Comprehensive metrics + post-run
analysis pipeline.

---

## 1. Test Frameworks & Coverage

### Frameworks

- **Vitest**: Unit + Integration tests; 176 files in gitnexus/
- **Playwright**: E2E web tests; 15 files; conditional on web changes
- **Pytest**: Eval harness tests; 5 files

### Test Inventory

| Framework  | Type        | Count   | Coverage     |
| ---------- | ----------- | ------- | ------------ |
| Vitest     | Unit        | ~60     | 26-28%       |
| Vitest     | Integration | ~60     | merged       |
| Vitest     | E2E CLI     | ~56     | merged       |
| Vitest     | Unit Web    | ~15     | not reported |
| Playwright | E2E Web     | ~15     | not reported |
| Pytest     | Harness     | ~5      | not reported |
| **Total**  | —           | **211** | —            |

Test/Source Ratio: gitnexus (253 TS : 176 tests = 0.7:1); gitnexus-web (63 TS :
15 tests = 0.24:1)

---

## 2. CI/CD Pipeline

### Workflows (`.github/workflows/`)

- **ci.yml**: Main orchestrator (quality, tests, e2e, ci-status gate)
- **ci-quality.yml**: Type checking + linting + formatting (prettier, eslint,
  tsc)
- **ci-tests.yml**: vitest run --coverage on ubuntu + cross-platform (macOS,
  Windows)
- **ci-e2e.yml**: Playwright tests; conditional on gitnexus-web/\*\* changes

### Coverage Thresholds (Auto-Ratcheting)

- Statements: 26% | Branches: 23% | Functions: 28% | Lines: 27%
- Excludes: CLI entry, HTTP server, wiki generation

---

## 3. Pre-commit Hooks

File: `.husky/pre-commit`

Enforces:

1. Prettier formatting (via lint-staged)
2. TypeScript checking (tsc/tsc -b for changed packages)
3. Tests deferred to CI (fast local loop)

---

## 4. eval/ Framework: LLM Evaluation Harness

### Innovation: Three-Mode Comparative Evaluation

Measures whether code intelligence (GitNexus call graphs, execution flows, blast
radius) improves AI agent problem-solving on real GitHub issues (SWE-bench).

**Three Modes:**

1. **Baseline** — Pure bash tools (grep, find, cat, sed); control group
2. **Native** — Baseline + explicit GitNexus MCP tools (query, context, impact,
   cypher)
3. **Native Augment** (Recommended) — Native tools + auto-enriched grep results
   with callers/callees/flows

### Per-Instance Execution

```
1. Docker container (SWE-bench repo at specific commit)
2. Node.js + gitnexus CLI installed
3. gitnexus analyze runs (cached per repo:commit in ~/.gitnexus-eval-cache/)
4. eval-server starts (localhost:4848; keeps LadybugDB warm)
5. Standalone tool scripts installed in /usr/local/bin/
6. Agent runs with mode-specific prompts
7. Observation post-processing (native_augment: grep results enriched)
8. Metrics collected: cost, tokens, tool calls, augmentation stats
```

### Tool Performance

Agent bash → /usr/local/bin/gitnexus-query → curl localhost:4848/tool/query
(~100ms fast path) → fallback npx gitnexus query (5-10s cold CLI)

### Directory Structure

eval/ ├── run_eval.py # Main CLI (debug, single, matrix commands) ├──
agents/gitnexus_agent.py # Extends DefaultAgent; mode logic + augmentation ├──
environments/gitnexus_docker.py # Docker orchestration + eval-server ├──
prompts/ # 6 Jinja2 templates (system + instance × 3 modes) ├── configs/ │ ├──
models/ # Claude, GLM, MiniMax, DeepSeek YAML │ └── modes/ # baseline, native,
native_augment YAML ├── analysis/analyze_results.py # Post-run tables,
comparisons, CSV export ├── tests/ # tool_scripts, parse_run_id, property_based,
errors └── README.md # Comprehensive docs

### Metrics Collected

- Patch Rate, Resolve Rate, Total Cost, Avg Cost/Instance
- API Calls, GN Tool Calls, Augment Hits, Augment Hit Rate

### Models Supported

Claude (Haiku/Sonnet/Opus 4), MiniMax, GLM, DeepSeek; routed via OpenRouter or
direct provider APIs

---

## 5. Test Quality Assessment

**Sample 1: gitnexus/test/integration/cli-e2e.test.ts** Quality: High. Real
subprocess spawning, git repo initialization, environment isolation, timeout
handling, cross-platform concerns.

**Sample 2: eval/tests/test_tool_scripts.py** Quality: High. Tests actual
mechanism (tool script rendering), validates eval-server endpoint + fallback,
catches regressions.

**Sample 3: gitnexus-web/test/** Inferred quality: Medium-High. Unit-level
coverage; E2E reserved for critical paths only.

---

## 6. Gaps Identified

1. gitnexus-web coverage % not reported
2. Eval harness metrics validation missing (patch/resolve rate tests)
3. Eval-server + agent integration untested
4. Model fallback behavior not explicit
5. Tool script error edge cases
6. Augmentation edge cases (multiline, special chars, binary)
7. Index staleness detection not tested at scale
8. E2E web tests limited to critical user paths

---

## 7. Top 2 Patterns Worth Learning for SoNash

### Pattern 1: Three-Mode Comparative Framework

**Why:** Isolates impact of code intelligence on agent behavior. **For SoNash:**
Build baseline/native/native_augment modes to measure:

- Does SoNash improve accuracy/cost/speed?
- Do agents prefer explicit tools or enriched search?
- Which mode is most cost-effective?

### Pattern 2: Eval-Server for Fast Tool Access

**Why:** ~100ms per call vs 5-10s cold CLI. Critical for agent-scale evaluation.
**For SoNash:** Index once during setup; keep HTTP server warm (e.g.,
localhost:5959) serving graph queries. Reduces token burn, improves wall-clock
time, enables ambitious evals.

---

## 8. Recommendations for SoNash

1. Mirror eval/ structure → eval_sonash/ with agents, environments, prompts,
   configs, analysis
2. Eval-server early → Index once; daemon keeps graph warm
3. Reuse prompt templates → Adapt native_augment Jinja to SoNash tools
4. Start with Haiku → Fast iteration; Sonnet 4 for accuracy
5. Test the harness → pytest for metrics validation (patch/resolve rate)
6. Document tool chaining → Guide agents through graph workflows

---

**Report written:** 2026-04-13
