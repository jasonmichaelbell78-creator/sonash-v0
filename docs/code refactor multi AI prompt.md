
Quick “run order” suggestion (so you get maximum signal fast)

Claude Code (tool-capable) — best at repo-wide audits + grep-based proof

Codex (tool-capable) — great at refactor detection + TS ergonomics

Copilot (IDE) — great at local pattern spotting + quick confirmations

Gemini Jules — useful second opinion + alternative refactor lens

Kimi K2 — extra coverage; expect more suspected findings unless it can browse deeply



PROMPT



ROLE

You are a senior TypeScript/Next.js engineer performing a refactor audit on a repo that was “vibe coded” by multiple AI agents. Your #1 priority is cross-cutting duplication/inconsistency across the codebase.



REPO

https://github.com/jasonmichaelbell78-creator/sonash-v0



STACK / CONTEXT (treat as true)

\- Next.js 16.1 (App Router), React 19.2.3, TypeScript 5.x

\- Tailwind CSS v4, Framer Motion 12, shadcn/ui

\- Firebase: Auth, Firestore, Cloud Functions v2, App Check

\- Security: reCAPTCHA v3, App Check, Firestore Rules, rate limiting

\- Quality gates: npm run lint, npm test, npm run test:coverage

\- Client-side Firestore path validation mirrors rules: lib/security/firestore-validation.ts



SCOPE

Include: app/, components/, hooks/, lib/, functions/, tests/, types/

Secondary (only if relevant): scripts/, styles/, data/

Exclude: docs/, public/ (unless a finding depends on it)



CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse\_files=<yes/no>, run\_commands=<yes/no>, repo\_checkout=<yes/no>, limitations="<one sentence>"



NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:

\- at least one concrete file path AND

\- at least one primary symbol name (component/function/type) from those files

If you cannot provide both, put it in SUSPECTED\_FINDINGS with confidence <= 40.



FOCUS AREAS (use ONLY these categories)

1\) Hygiene/Duplication

2\) Types/Correctness

3\) Next/React Boundaries

4\) Security (Firebase/Auth/Rules/App Check)

5\) Testing



WHAT TO FIND (PRIORITY ORDER)

PASS 1 — Cross-cutting duplication/inconsistency (highest priority)

Identify duplicated or inconsistent implementations across multiple areas, especially:

\- Firebase init/service wrappers, auth guards, Firestore read/write helpers, path validation, rate-limiting, logging/audit, analytics

\- UI primitives duplicated outside components/ui (buttons/cards/modals/toasts/spinners/loading states)

\- Repeated hook patterns (state sync, localStorage, keyboard shortcuts, scrolling, prompts, networking/offline)

\- Repeated types/enums/constants (entry types, statuses, feature flags, routes, Firestore paths)

For each duplication cluster: produce ONE consolidated finding with a list of the duplicated files/symbols.



PASS 2 — Types/Correctness

\- any/unknown leakage, inconsistent domain types, nullable handling, unsafe casts

\- places where runtime validation should match TS types (esp. data in/out of Firestore)



PASS 3 — Next/React Boundaries + Security + Tests (only after pass 1 is done)

\- Server vs client component boundary issues, data fetching patterns, state placement

\- Trust boundaries: where client code assumes privileges; rules alignment; secrets/config; App Check usage assumptions

\- Missing or weak tests around shared helpers and security-critical code paths



OPTIONAL: TOOL EVIDENCE (ONLY IF you can run commands)

If run\_commands=yes and repo\_checkout=yes:

\- Prefer to support PASS 1 claims with at least one “hard artifact” per major cluster:

&nbsp; - search output (grep/ripgrep) OR

&nbsp; - duplication scan output OR

&nbsp; - lint/type/test output that points at repeated patterns

If you cannot run tools, proceed with static browsing and keep confidence lower for cross-cutting claims.



OUTPUT FORMAT (STRICT)

Return 3 sections in this exact order, no code fences:



1\) FINDINGS\_JSONL

(one JSON object per line, each object must be valid JSON)



Schema:

{

&nbsp; "category": "Hygiene/Duplication|Types/Correctness|Next/React Boundaries|Security|Testing",

&nbsp; "title": "short, specific",

&nbsp; "fingerprint": "<category>::<primary\_file>::<primary\_symbol>::<problem\_slug>",

&nbsp; "severity": "S0|S1|S2|S3",

&nbsp; "effort": "E0|E1|E2|E3",

&nbsp; "confidence": 0-100,

&nbsp; "files": \["path1", "path2"],

&nbsp; "symbols": \["SymbolA", "SymbolB"],

&nbsp; "duplication\_cluster": {

&nbsp;   "is\_cluster": true/false,

&nbsp;   "cluster\_summary": "if true, describe the repeated pattern",

&nbsp;   "instances": \[{"file":"...","symbol":"..."}, ...]

&nbsp; },

&nbsp; "why\_it\_matters": "1-3 sentences",

&nbsp; "suggested\_fix": "concrete refactor direction (no rewrite)",

&nbsp; "acceptance\_tests": \["what to run/verify after change"],

&nbsp; "pr\_bucket\_suggestion": "firebase-access|ui-primitives|hooks-standardization|types-domain|boundaries|security-hardening|tests-hardening|misc",

&nbsp; "dependencies": \["fingerprint it depends on", "..."],

&nbsp; "evidence": \["optional: short grep output or tool output summary (no long logs)"],

&nbsp; "notes": "optional"

}



Severity guide:

\- S0: high-risk security/data loss/major bug

\- S1: likely bug/perf/security footgun

\- S2: maintainability drag/inconsistency/duplication

\- S3: cosmetic cleanup



Effort guide:

\- E0: minutes

\- E1: hours

\- E2: 1–3 days or staged PR

\- E3: multi-PR/multi-week (avoid unless unavoidable)



2\) SUSPECTED\_FINDINGS\_JSONL

(same schema, but confidence <= 40; evidence missing file+symbol OR claim is broad)



3\) HUMAN\_SUMMARY (markdown)

\- Top duplication clusters (5–10 bullets)

\- Top 5 high-risk items (S0/S1)

\- “Do next” shortlist (<= 10 items) emphasizing small, reviewable PRs



You are a senior TypeScript/Next.js engineer performing a refactor audit on a repo that was “vibe coded” by multiple AI agents. Your #1 priority is cross-cutting duplication/inconsistency across the codebase.



REPO

https://github.com/jasonmichaelbell78-creator/sonash-v0



STACK / CONTEXT (treat as true)

\- Next.js 16.1 (App Router), React 19.2.3, TypeScript 5.x

\- Tailwind CSS v4, Framer Motion 12, shadcn/ui

\- Firebase: Auth, Firestore, Cloud Functions v2, App Check

\- Security: reCAPTCHA v3, App Check, Firestore Rules, rate limiting

\- Quality gates: npm run lint, npm test, npm run test:coverage

\- Client-side Firestore path validation mirrors rules: lib/security/firestore-validation.ts



SCOPE

Include: app/, components/, hooks/, lib/, functions/, tests/, types/

Secondary (only if relevant): scripts/, styles/, data/

Exclude: docs/, public/ (unless a finding depends on it)



CAPABILITIES (REQUIRED FIRST OUTPUT)

Before any findings, print exactly:

CAPABILITIES: browse\_files=<yes/no>, run\_commands=<yes/no>, repo\_checkout=<yes/no>, limitations="<one sentence>"



NON-NEGOTIABLE EVIDENCE RULE (ANTI-HALLUCINATION)

A finding is CONFIRMED only if it includes:

\- at least one concrete file path AND

\- at least one primary symbol name (component/function/type) from those files

If you cannot provide both, put it in SUSPECTED\_FINDINGS with confidence <= 40.



FOCUS AREAS (use ONLY these categories)

1\) Hygiene/Duplication

2\) Types/Correctness

3\) Next/React Boundaries

4\) Security (Firebase/Auth/Rules/App Check)

5\) Testing



WHAT TO FIND (PRIORITY ORDER)

PASS 1 — Cross-cutting duplication/inconsistency (highest priority)

Identify duplicated or inconsistent implementations across multiple areas, especially:

\- Firebase init/service wrappers, auth guards, Firestore read/write helpers, path validation, rate-limiting, logging/audit, analytics

\- UI primitives duplicated outside components/ui (buttons/cards/modals/toasts/spinners/loading states)

\- Repeated hook patterns (state sync, localStorage, keyboard shortcuts, scrolling, prompts, networking/offline)

\- Repeated types/enums/constants (entry types, statuses, feature flags, routes, Firestore paths)

For each duplication cluster: produce ONE consolidated finding with a list of the duplicated files/symbols.



PASS 2 — Types/Correctness

\- any/unknown leakage, inconsistent domain types, nullable handling, unsafe casts

\- places where runtime validation should match TS types (esp. data in/out of Firestore)



PASS 3 — Next/React Boundaries + Security + Tests (only after pass 1 is done)

\- Server vs client component boundary issues, data fetching patterns, state placement

\- Trust boundaries: where client code assumes privileges; rules alignment; secrets/config; App Check usage assumptions

\- Missing or weak tests around shared helpers and security-critical code paths



OPTIONAL: TOOL EVIDENCE (ONLY IF you can run commands)

If run\_commands=yes and repo\_checkout=yes:

\- Prefer to support PASS 1 claims with at least one “hard artifact” per major cluster:

&nbsp; - search output (grep/ripgrep) OR

&nbsp; - duplication scan output OR

&nbsp; - lint/type/test output that points at repeated patterns

If you cannot run tools, proceed with static browsing and keep confidence lower for cross-cutting claims.



OUTPUT FORMAT (STRICT)

Return 3 sections in this exact order, no code fences:



1\) FINDINGS\_JSONL

(one JSON object per line, each object must be valid JSON)



Schema:

{

&nbsp; "category": "Hygiene/Duplication|Types/Correctness|Next/React Boundaries|Security|Testing",

&nbsp; "title": "short, specific",

&nbsp; "fingerprint": "<category>::<primary\_file>::<primary\_symbol>::<problem\_slug>",

&nbsp; "severity": "S0|S1|S2|S3",

&nbsp; "effort": "E0|E1|E2|E3",

&nbsp; "confidence": 0-100,

&nbsp; "files": \["path1", "path2"],

&nbsp; "symbols": \["SymbolA", "SymbolB"],

&nbsp; "duplication\_cluster": {

&nbsp;   "is\_cluster": true/false,

&nbsp;   "cluster\_summary": "if true, describe the repeated pattern",

&nbsp;   "instances": \[{"file":"...","symbol":"..."}, ...]

&nbsp; },

&nbsp; "why\_it\_matters": "1-3 sentences",

&nbsp; "suggested\_fix": "concrete refactor direction (no rewrite)",

&nbsp; "acceptance\_tests": \["what to run/verify after change"],

&nbsp; "pr\_bucket\_suggestion": "firebase-access|ui-primitives|hooks-standardization|types-domain|boundaries|security-hardening|tests-hardening|misc",

&nbsp; "dependencies": \["fingerprint it depends on", "..."],

&nbsp; "evidence": \["optional: short grep output or tool output summary (no long logs)"],

&nbsp; "notes": "optional"

}



Severity guide:

\- S0: high-risk security/data loss/major bug

\- S1: likely bug/perf/security footgun

\- S2: maintainability drag/inconsistency/duplication

\- S3: cosmetic cleanup



Effort guide:

\- E0: minutes

\- E1: hours

\- E2: 1–3 days or staged PR

\- E3: multi-PR/multi-week (avoid unless unavoidable)



2\) SUSPECTED\_FINDINGS\_JSONL

(same schema, but confidence <= 40; evidence missing file+symbol OR claim is broad)



3\) HUMAN\_SUMMARY (markdown)

\- Top duplication clusters (5–10 bullets)

\- Top 5 high-risk items (S0/S1)

\- “Do next” shortlist (<= 10 items) emphasizing small, reviewable PRs






Prompt 2 — Optional “Tool Checklist Addendum” (won’t block any model)

Use this as a second message only to tool-capable agents (Claude Code, Codex, Copilot-in-IDE, Jules), after you paste Prompt 1:




If (run_commands=yes AND repo_checkout=yes), prioritize PASS 1 duplication with these checks (do not install heavy tooling unless already present):

1) Quality gates (capture only failures + file paths):
- npm run lint
- npm test
- npm run test:coverage

2) Cross-cutting duplication triangulation (pick 2–4 that are available):
- ripgrep searches for repeated patterns (firebase init, getFirestore(), collection paths, auth guards, “use client”, localStorage keys, feature flags)
- ts/prune-style check for unused exports (if available)
- circular dependency check (if available)
- duplication scan (if available)

In evidence, paste only the minimal excerpt needed to support the finding (e.g., file paths + 1–3 matching lines).
If a command is not available, write “SKIPPED: <reason>” and continue.
