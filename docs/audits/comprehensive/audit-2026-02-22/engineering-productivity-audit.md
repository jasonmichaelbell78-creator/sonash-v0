# Engineering Productivity Audit

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-02-22
**Status:** ACTIVE
<!-- prettier-ignore-end -->

---

## 1. Executive Summary

SoNash is a Next.js 16.1.1 / React 19.2.3 / Firebase 12.6.0 application with an
unusually sophisticated AI-assisted development tooling layer. The core
application code (app/, components/, lib/) is well-structured and uses modern
patterns. However, the project has accumulated a meta-tooling ecosystem of
significant complexity: **101 npm scripts, 59 AI skills, 21 hook files (5,629
lines), and a 14-step pre-commit hook chain** that routinely runs 30-60+
seconds.

The primary DX risk is **tooling overhead fatigue**: the AI workflow
infrastructure has grown to a size where it creates friction for both human and
AI developers. Commit latency, session startup time, and cognitive load from
navigating dozens of skills/scripts are the top productivity drags.

The application itself demonstrates solid engineering fundamentals (strict
TypeScript, 294 tests, no circular dependencies, Firestore security rules), and
the CI pipeline is comprehensive. Immediate quick-wins are available in the
build and test pipeline configuration.

**Overall DX Score: 62/100** (see Section 4 for breakdown)

---

## 2. Top Findings Table

| ID    | Finding                                                                                       | Area     | Severity | Effort |
| ----- | --------------------------------------------------------------------------------------------- | -------- | -------- | ------ |
| EP-01 | Pre-commit hook chain takes 30-60s, blocking developer flow                                   | Build    | S1       | E2     |
| EP-02 | Test pipeline requires full TypeScript compile before running (tsc + tsc-alias + node --test) | Build    | S1       | E2     |
| EP-03 | 101 npm scripts with no grouping/discoverability — cognitive overload                         | DX       | S2       | E1     |
| EP-04 | No service worker — PWA manifest present but offline support is incomplete                    | Offline  | S2       | E3     |
| EP-05 | SessionStart hook runs npm install + function build + test compile on every session           | AI       | S2       | E2     |
| EP-06 | Static export (`output: "export"`) disables Next.js image optimization                        | Build    | S2       | E2     |
| EP-07 | 59 skills with largest SKILL.md files at 1,735 lines — skill discovery friction               | AI       | S2       | E2     |
| EP-08 | ESLint produces 181 warnings baseline — warning noise may mask real issues                    | Quality  | S2       | E1     |
| EP-09 | PostToolUse hooks fire on EVERY Read/Write/Edit/Bash — cumulative latency per AI turn         | AI       | S2       | E2     |
| EP-10 | No `npm run type-check` alias — developers must memorize `npx tsc --noEmit`                   | DX       | S3       | E0     |
| EP-11 | PWA icons use JPEG (not PNG/WebP) — iOS home screen icon quality degraded                     | Offline  | S3       | E0     |
| EP-12 | `firebase-service-account.json` appears in root — potential secret exposure risk              | Security | S2       | E1     |
| EP-13 | `nul` file present in repo root (Windows artifact)                                            | DX       | S3       | E0     |
| EP-14 | `incremental: true` in tsconfig.json but `noEmit: true` — incremental has no benefit          | Build    | S3       | E0     |
| EP-15 | No Turbopack configuration — dev server uses webpack by default                               | Build    | S2       | E1     |

---

## 3. Detailed Findings (Grouped by Severity)

### S1 — High Severity

#### EP-01: Pre-commit Hook Chain Latency (30-60+ seconds)

**Area:** Build / Developer Experience **Severity:** S1 | **Effort:** E2

The `.husky/pre-commit` script runs a 14-step chain:

1. ESLint (background, ~15s)
2. Tests (background, ~15s — conditional)
3. lint-staged / Prettier auto-format
4. Pattern compliance check
5. Audit S0/S1 validation
6. CANON schema validation
7. Skill configuration validation
8. Cross-document dependency check (blocking)
9. Documentation index auto-update
10. Document header validation
11. Agent compliance check
12. Technical debt schema validation
13. TypeScript type check (pre-push only)
14. Security patterns check (pre-push only)

Steps 1 and 2 run in parallel, which shows good engineering. However, the total
wall-clock time is dominated by ESLint (~15s) and tests (~15s) running in
parallel plus sequential overhead from steps 3-14. For documentation-only
commits, tests are skipped appropriately, but the remaining chain still adds
5-15 seconds.

**Impact:** Developers who commit frequently (as is best practice) experience
significant friction. The audit trail, override logging, and skip-reason
enforcement add bureaucratic overhead to the git workflow.

**Recommendation:**

- Move audit S0/S1 validation, CANON schema, and skill validation to CI-only
  (not pre-commit)
- Consider making cross-doc check a pre-push gate rather than pre-commit
- Add a `--fast` commit flag that skips non-blocking checks with auto-logged
  reason

---

#### EP-02: Test Pipeline Requires Three Compilation Steps

**Area:** Build / Testing **Severity:** S1 | **Effort:** E2

The `npm test` command requires:

```
npm run test:build   # tsc -p tsconfig.test.json
                     # tsc-alias -p tsconfig.test.json  (path alias resolution)
                     # node --test dist-tests/**/*.test.js
```

The test build uses a separate `tsconfig.test.json` with CommonJS output to
`dist-tests/`. This means:

1. TypeScript compiles ALL test files (even unchanged ones) — no incremental
   support (`incremental: false` in tsconfig.test.json)
2. tsc-alias must post-process the output to resolve path aliases
3. The compiled output in `dist-tests/` must be maintained alongside source

This approach adds 10-20 seconds to every test run. Using a modern test runner
(Vitest or Jest with ts-jest) would eliminate the compilation step.

**Impact:** Pre-commit hooks, CI, and developers running tests manually all pay
this compilation tax on every run.

**Recommendation:**

- Migrate to Vitest which handles TypeScript natively (Vitest is already used
  for `tests/pattern-compliance.test.js` — inconsistency exists!)
- The pattern compliance tests already use Vitest (`npm run test:patterns` uses
  `vitest run`) — extend this to all tests
- Eliminate the tsc→dist-tests compile step entirely

---

### S2 — Medium Severity

#### EP-03: 101 npm Scripts with No Grouping or Discovery System

**Area:** Developer Experience **Severity:** S2 | **Effort:** E1

The `package.json` contains 101 scripts across these rough categories:

- Core (build, dev, start, test): 4
- Documentation: 8 (docs:\*)
- Roadmap: 2 (roadmap:\*)
- Reviews: 5 (reviews:\*)
- Patterns: 6 (patterns:\*)
- Sessions: 4 (session:\*)
- Audits: 8 (audit:\*)
- Technical Debt: 8 (sprint:_, tdms:_)
- Skills: 4 (skills:\*)
- Hooks: 3 (hooks:\*)
- Learning: 6 (learning:\*)
- Security: 2 (security:\*)
- Agents: 2 (agents:\*)
- AI Ecosystem: 3 (ecosystem-audit:\*)
- Miscellaneous: 36

There is no `npm run help` command, no grouping documentation in package.json,
and no README for the scripts themselves (only `scripts/README.md` exists, but
it doesn't catalog all 101 scripts).

**Impact:** New developers (human or AI) face significant cognitive load
determining which script to run. Scripts with similar names (audit:validate vs
validate:canon vs audit:health) have unclear relationships.

**Recommendation:**

- Add `npm run help` script that prints categorized script summary
- Group related scripts with consistent prefixes (already partially done)
- Archive or remove scripts that have been superseded

---

#### EP-04: PWA Manifest Present but No Service Worker

**Area:** Offline Support **Severity:** S2 | **Effort:** E3

`public/manifest.json` declares a PWA with `"display": "standalone"` but there
is no service worker file (`sw.js` or `service-worker.js`) anywhere in the
project. With `output: "export"` (static export), Next.js does not automatically
generate a service worker.

**Current State:**

- manifest.json: present
- service-worker: ABSENT
- offline capability: NONE
- install prompt: would appear but app would not work offline

For a sober recovery app where users may need journal/meeting access in poor
connectivity (meeting rooms, rural areas), offline support is a meaningful
feature gap. Without a service worker, the "installable PWA" experience is
misleading — users can install it but it will fail when offline.

**Recommendation:**

- Add `next-pwa` or `@sentry/nextjs` service worker support
- At minimum, cache the static shell so installed PWA doesn't show blank screen
  offline
- Or remove `manifest.json` if offline support is not planned to set accurate
  expectations

---

#### EP-05: SessionStart Hook Runs Heavy Operations Every Session

**Area:** AI Tooling Overhead **Severity:** S2 | **Effort:** E2

The `.claude/hooks/session-start.js` runs on every Claude session start:

1. Checks npm dependencies (root + functions)
2. Builds Firebase Functions (if source changed)
3. Compiles test files (tsc -p tsconfig.test.json)
4. Checks pattern compliance
5. Checks consolidation status

Steps 3 and 4 add 15-30+ seconds to every session startup. The functions build
is gated on file changes (sensible), but the test compilation is unconditional.

**Impact:** Each AI session has a 30-60 second startup tax before the agent can
begin work. For a developer who opens multiple sessions per day or who uses
context compaction frequently, this compounds significantly.

**Recommendation:**

- Gate test compilation on whether test files have changed (compare mtimes or
  use a hash file similar to how functions build is gated)
- Make pattern compliance check async/non-blocking in session start
- Consider a "fast mode" session start for read-only/exploration sessions

---

#### EP-06: Static Export Disables Next.js Image Optimization

**Area:** Build / Performance **Severity:** S2 | **Effort:** E2

`next.config.mjs` uses `output: "export"` required for Firebase Hosting static
deployment. This requires `images: { unoptimized: true }` which disables:

- Automatic WebP/AVIF conversion
- Responsive image srcset generation
- Lazy loading optimization
- Server-side image resizing

For a mobile-first app with user profile photos and meeting imagery, this is a
meaningful performance gap. The DEVELOPMENT.md performance checklist even notes
"Use Next.js Image component for all images" — but with unoptimized: true, the
Image component provides no optimization.

**Recommendation:**

- Evaluate Firebase App Hosting (supports full Next.js server features) vs
  Firebase Hosting
- Or implement Cloudinary/Imgix for client-side image optimization
- Document the limitation explicitly in DEVELOPMENT.md so developers don't
  assume Image component is optimizing

---

#### EP-07: 59 Skills with Large SKILL.md Files

**Area:** AI Tooling **Severity:** S2 | **Effort:** E2

The `.claude/skills/` directory contains 59 skills totaling ~24,251 lines across
SKILL.md files. The largest:

- doc-optimizer: 1,735 lines
- audit-process: 1,531 lines
- system-test: 1,261 lines
- multi-ai-audit: 1,023 lines

Loading a 1,735-line skill file consumes significant context window. The
`SKILL_INDEX.md` file exists for discovery but the sheer number of skills
creates cognitive overhead in choosing the right one.

**Impact:** Skill selection requires reading SKILL_INDEX.md, which itself
requires cognitive effort. Skills with overlapping purposes (audit-code,
audit-security, audit-comprehensive, audit-process,
audit-engineering-productivity) cause confusion about which to invoke.

**Recommendation:**

- Consolidate similar audit skills into a single parametric audit skill
- Add brief (1-2 line) descriptions to SKILL_INDEX.md entries
- Consider skill deprecation/archiving for rarely-used skills
- Add `npm run skills:usage` to surface which skills are most frequently invoked

---

#### EP-08: 181 ESLint Warning Baseline

**Area:** Code Quality **Severity:** S2 | **Effort:** E1

ESLint produces 181 warnings as a documented baseline, categorized as:

- `detect-object-injection` (91): audited false positives
- `detect-non-literal-fs-filename` (66): CLI scripts with controlled paths
- `detect-unsafe-regex` (14): bounded input
- `detect-non-literal-regexp` (6): intentional patterns
- `detect-possible-timing-attacks` (1): own password comparison
- `@typescript-eslint/no-unused-vars` (3): legitimate unused vars

While these are documented as false positives, 181 warnings creates noise that
can mask real warnings when they appear. The ESLint output becomes a "warning
wall" that developers learn to ignore.

**Impact:** New genuine warnings are buried in 181 existing ones. Developers may
disable the warning check in their editors to reduce noise.

**Recommendation:**

- Use `// eslint-disable-next-line` with justification comments on confirmed
  false-positive lines in scripts
- Configure `eslint-plugin-security` to ignore specific patterns that are
  consistently false positives in this codebase
- Target 0 warning baseline — or document an explicit "warning budget"

---

#### EP-09: PostToolUse Hooks Fire on Every Read/Write/Edit/Bash

**Area:** AI Tooling Overhead **Severity:** S2 | **Effort:** E2

The `.claude/settings.json` configures PostToolUse hooks for:

- Every `Write` → post-write-validator.js (955 lines)
- Every `Edit` → post-write-validator.js
- Every `MultiEdit` → post-write-validator.js
- Every `Read` → post-read-handler.js (537 lines)
- Every `Bash` → commit-tracker.js (221 lines) + commit-failure-reporter.js (300
  lines)
- Every `Task` → track-agent-invocation.js (210 lines)
- Every `UserPromptSubmit` → user-prompt-handler.js (502 lines)

Each hook invocation is a separate Node.js process start (~50-100ms), plus hook
execution time. For an AI session that performs 50 Read operations, 20
Write/Edits, and 30 Bash calls, this adds up to:

- 50 × ~100ms (Read hooks) = ~5 seconds
- 20 × ~200ms (Write hooks with validation) = ~4 seconds
- 60 × ~150ms (Bash hooks × 2 hooks each) = ~9 seconds
- Total estimated overhead: ~18 seconds per session turn, not counting hook
  logic

**Recommendation:**

- Make commit-tracker and commit-failure-reporter a single combined hook
- Consider a long-running hook daemon instead of per-invocation Node.js spawns
- The post-read-handler should be opt-in (most reads don't need tracking)
- Batch hook execution where possible

---

#### EP-12: `firebase-service-account.json` in Repository Root

**Area:** Security / DX **Severity:** S2 | **Effort:** E1

A file named `firebase-service-account.json` is present in the project root.
Service account JSON files contain private keys that grant full administrative
access to Firebase. Even if this file is gitignored, its presence in the root
directory is unusual and requires verification.

**Impact:** If accidentally committed, this would be a critical security
incident. If it's a placeholder/template, it should be clearly named as such.

**Recommendation:**

- Verify this file is in `.gitignore`
- If it contains real credentials, move to a secrets manager or encrypted
  storage
- If it's a template, rename to `firebase-service-account.json.example`
- Add to `scripts/secrets/` directory structure or document in DEVELOPMENT.md

---

#### EP-15: No Turbopack Configuration

**Area:** Build Performance **Severity:** S2 | **Effort:** E1

The dev server uses `next dev` without `--turbopack`, meaning webpack is used.
Next.js 15+ (and 16.x) include Turbopack as a stable option that delivers
10-100x faster HMR and initial compilation compared to webpack for large
TypeScript projects.

With React 19, Firebase 12, Framer Motion, Recharts, and Leaflet as
dependencies, the initial compilation is likely taking 20-60 seconds without
Turbopack.

**Recommendation:**

- Update dev script to `next dev --turbopack`
- Test for compatibility with the current dependency set
- Document any incompatible plugins or workarounds

---

### S3 — Low Severity

#### EP-10: No `type-check` npm Script Alias

**Area:** Developer Experience **Severity:** S3 | **Effort:** E0

DEVELOPMENT.md references `npm run type-check` in the debugging section but no
such script exists in `package.json`. Developers get an error. The actual
command is `npx tsc --noEmit`. CI uses `npx tsc --noEmit` directly.

**Recommendation:** Add `"type-check": "tsc --noEmit"` to package.json scripts.

---

#### EP-11: PWA Icons Use JPEG Format

**Area:** Offline / PWA **Severity:** S3 | **Effort:** E0

`public/manifest.json` references `pwa-icon.jpg` for both 192x192 and 512x512
sizes. PWA standards recommend PNG format for icons. iOS Safari will not install
JPEG PWA icons properly, and some Android launchers may display them with
quality artifacts.

**Recommendation:**

- Convert `pwa-icon.jpg` to PNG
- Create separate 192×192 and 512×512 PNG files
- Update manifest.json to reference correct sizes with `image/png` type

---

#### EP-13: `nul` File in Repository Root

**Area:** Developer Experience **Severity:** S3 | **Effort:** E0

A file named `nul` exists in the repository root. This is a Windows artifact
(result of redirecting output to `NUL` which creates a file on some systems). It
should be deleted and added to `.gitignore`.

**Recommendation:** Delete `nul` file, add `nul` to `.gitignore`.

---

#### EP-14: `incremental: true` with `noEmit: true` in tsconfig.json

**Area:** Build **Severity:** S3 | **Effort:** E0

`tsconfig.json` has both `"incremental": true` and `"noEmit": true`. TypeScript
`incremental` mode stores build info to speed up subsequent compilations, but
with `noEmit: true`, the tsbuildinfo file may not be properly maintained,
resulting in no actual speedup while still writing a `.tsbuildinfo` file.

In practice, Next.js manages its own incremental compilation internally, so this
setting is redundant at best.

**Recommendation:** Remove `"incremental": true` from tsconfig.json, or verify
that `.tsbuildinfo` is actually being generated and used to speed up type
checks.

---

## 4. DX Scorecard

| Category                   | Score      | Notes                                                                                       |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| Local Dev Setup            | 70/100     | DEVELOPMENT.md is thorough; two-terminal setup (emulators + Next.js) is standard            |
| Error Messages             | 65/100     | Sentry integrated; hook failures show useful output; Firebase errors require console lookup |
| Build Times                | 55/100     | No Turbopack; test compilation step; 3-step test pipeline                                   |
| Tooling Discovery          | 45/100     | 101 scripts with no help system; 59 skills with overlapping names                           |
| Error Handling UX          | 70/100     | sonner toasts for rate limits; Firebase error codes still exposed in places                 |
| Offline Support            | 20/100     | PWA manifest present, no service worker — misleading                                        |
| Hot Reload / Dev Stability | 60/100     | Standard Next.js HMR; no Turbopack; static export limitations                               |
| Script Discoverability     | 40/100     | No `npm run help`; scripts mixed with AI infrastructure scripts                             |
| AI Tooling Overhead        | 50/100     | Rich functionality; but 30-60s commit + session startup costs                               |
| CI Pipeline                | 80/100     | Comprehensive; good parallelization; coverage reporting                                     |
| Testing                    | 72/100     | 294 tests, 99.7% pass rate; slow test pipeline compilation                                  |
| TypeScript Strictness      | 85/100     | Strict mode enabled; no-any enforced; Zod runtime validation                                |
| **Overall**                | **62/100** | Strong fundamentals; tooling overhead is the primary drag                                   |

---

## 5. Recommendations

### Immediate Wins (E0 — Zero Effort)

These can be done in minutes:

1. **EP-10**: Add `"type-check": "tsc --noEmit"` to package.json
2. **EP-13**: Delete `nul` file, add to `.gitignore`
3. **EP-14**: Remove `"incremental": true` from tsconfig.json
4. **EP-11**: Convert `pwa-icon.jpg` to PNG format

### Quick Wins (E1 — Small Effort, ~hours)

5. **EP-15**: Enable Turbopack (`next dev --turbopack`)
6. **EP-03**: Add `npm run help` script that prints categorized script list
7. **EP-08**: Configure per-line eslint-disable comments for confirmed false
   positives; target 0-warning baseline
8. **EP-12**: Verify `firebase-service-account.json` is gitignored; document in
   DEVELOPMENT.md

### Medium Effort (E2 — ~1-2 days)

9. **EP-02**: Migrate tests to Vitest (already partially done for pattern
   tests); eliminate tsc→dist-tests compile step
10. **EP-01**: Slim pre-commit hook chain by moving audit/CANON/skill validation
    to CI-only
11. **EP-05**: Gate test compilation in session-start.js on file hash changes
12. **EP-09**: Combine commit-tracker + commit-failure-reporter into single
    hook; evaluate long-running hook daemon
13. **EP-06**: Evaluate Firebase App Hosting for full Next.js feature support;
    or document image optimization limitations
14. **EP-07**: Consolidate audit skills into parametric skill; archive unused
    skills

### Large Effort (E3 — ~weeks)

15. **EP-04**: Implement service worker with `next-pwa` for offline journal and
    meeting cache access

---

## Appendix A: Metrics Summary

| Metric                    | Count                       |
| ------------------------- | --------------------------- |
| npm scripts               | 101                         |
| AI skills                 | 59                          |
| Claude hook files         | 21 (5,629 lines)            |
| Pre-commit hook steps     | 14                          |
| ESLint warning baseline   | 181                         |
| Test suite size           | 294 tests (99.7% passing)   |
| PostToolUse hook triggers | 7 matchers                  |
| CI workflow steps         | ~18 steps across 2 jobs     |
| Largest SKILL.md          | 1,735 lines (doc-optimizer) |
| Scripts directory files   | 64 files                    |
| Debt management scripts   | 20+ files in scripts/debt/  |

## Appendix B: Positive Patterns Observed

These patterns represent genuine engineering excellence and should be preserved:

- **Strict TypeScript**: `strict: true` with no-any enforced throughout
- **Security rules**: Firestore security rules enforce per-user data isolation
- **App Check**: Firebase App Check on all Cloud Functions
- **Pre-commit parallelism**: ESLint and tests run concurrently
- **Skip reason enforcement**: SKIP_REASON validation prevents casual bypasses
- **Incremental functions build**: Functions build only when source files change
- **Test coverage**: 294 tests, 99.7% pass rate
- **POSIX compatibility**: Pre-commit hook correctly uses `sh -e` compatible
  syntax
- **Supply chain security**: CI action pinned to SHA (CVE-2025-30066 mitigation)
- **Error sanitization**: `scripts/lib/sanitize-error.js` used consistently

---

_Audit generated: 2026-02-22 | Scope: Full project tooling layer | Method:
Static analysis_
