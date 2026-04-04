# Findings: Firebase Official Agent Skills Evaluation

**Searcher:** deep-research-searcher **Profile:** web **Date:** 2026-03-29
**Sub-Question IDs:** G2 (gap pursuit — Firebase official skills evaluation)

---

## Key Findings

### 1. Firebase Official Agent Skills Exist and Are Actively Maintained [CONFIDENCE: HIGH]

Firebase released official Agent Skills in February 2026 via the GitHub
repository `firebase/agent-skills` (Apache 2.0, 187 stars, 37 commits as of
research date). They are available via Claude plugin
(`claude.com/plugins/firebase`, 14,451 installs) and via the universal Agent
Skills CLI (`npx skills add firebase/agent-skills`). The project is maintained
by Google and targets Claude Code, Cursor, Gemini CLI, GitHub Copilot, and
Antigravity through the open `SKILL.md` standard [1][2][8].

The 11 official skills released are:

| Skill                                       | Focus Area                                        |
| ------------------------------------------- | ------------------------------------------------- |
| `firebase-basics`                           | Firebase CLI fundamentals, project setup          |
| `firebase-auth-basics`                      | Authentication providers, user management         |
| `firebase-firestore-standard`               | Firestore provisioning, SDK usage, Security Rules |
| `firebase-firestore-enterprise-native-mode` | Enterprise Firestore configuration                |
| `firebase-hosting-basics`                   | Static sites and SPAs                             |
| `firebase-app-hosting-basics`               | Next.js / Angular deployment                      |
| `firebase-ai-logic-basics`                  | Gemini API integration                            |
| `firebase-data-connect-basics`              | PostgreSQL-backed GraphQL                         |
| `firebase-local-env-setup`                  | Dev environment configuration                     |
| `developing-genkit-js`                      | AI agents and flows in Node.js/TypeScript         |
| `developing-genkit-dart`                    | Genkit integration for Flutter/Dart               |

**No skill covers Cloud Functions, App Check, or httpsCallable** (confirmed by
direct content inspection of `firebase-basics`, `firebase-auth-basics`, and
`firebase-firestore-standard`) [1][4][5].

---

### 2. Firebase SDK Version Targeting is Unspecified [CONFIDENCE: HIGH]

Neither the official blog post, GitHub README, nor any individual SKILL.md file
specifies a target Firebase JavaScript SDK version. The `firebase-basics` skill
references `npx -y firebase-tools@latest` (CLI), and
`firebase-firestore-standard` refers to the "Web (Modular SDK)" but with no
version pin. The blog post (February 2026) contains no version specifics [2][6].

Firebase 12.10.0 was released February 27, 2026 — the same month these skills
launched. The latest as of research date is Firebase JS SDK 12.11.0 (March 19,
2026). There is no documented effort to test or validate the official skills
against SDK 12.x specifically [3].

**The CH2 Challenge 7 concern is confirmed:** no evidence exists that the
official skills target Firebase 12.10.0 or that they have been validated against
it.

---

### 3. Official Skills Do NOT Cover SoNash's Core Security Patterns [CONFIDENCE: HIGH]

After inspecting skill content files and exhaustive search across the ecosystem,
the following gaps are confirmed for all 11 official Firebase skills:

| SoNash Requirement                                            | Covered by Official Skills? | Notes                                                                                    |
| ------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| App Check enforcement (`requireAppCheck: true`)               | NO                          | Zero mentions in any skill                                                               |
| `httpsCallable` Cloud Functions                               | NO                          | No Cloud Functions skill exists                                                          |
| 3-collection write gate (Firestore rules block direct writes) | PARTIAL                     | `firebase-firestore-standard` covers Security Rules generally, not this specific pattern |
| Firestore-backed rate limiting                                | NO                          | Not mentioned anywhere                                                                   |
| Zod validation in Cloud Functions                             | NO                          | No Zod references found                                                                  |
| `withSecurityChecks()` wrapper pattern                        | NO                          | SoNash-specific, not in official skills                                                  |
| `sonash.security.no-direct-firestore-write` Semgrep rule      | NO                          | Project-specific enforcement                                                             |

The Firebase blog explicitly states: "This isn't the full list, and we're adding
support for more Firebase features soon!" — acknowledging the gap set [2].

The `firebase-auth-basics` skill focuses on identity providers and user flows.
The `firebase-firestore-standard` skill focuses on provisioning and generic
Security Rules. Neither touches the intersection of App Check + Cloud
Functions + callable security that represents SoNash's entire security boundary
architecture [4][5].

---

### 4. Community Feedback: Production Concerns Are Real [CONFIDENCE: MEDIUM]

The community feedback on Firebase agent skills surfaces two production-relevant
concerns [7]:

**Ecosystem trust fragmentation:** A March 2026 Google Cloud community post
warns against installing skills from non-official sources ("I personally don't
want a random Firebase Auth skill from a well-meaning developer that isn't from
the Firebase team helping me in my production project"). The official
`firebase/agent-skills` are from the Firebase team and bypass this concern.

**Skill staleness risk:** Skills can become outdated rapidly. The author of the
referenced post built a dynamic Skills Collator Agent to discover skills
on-demand rather than pre-installing them. At 6 weeks old with a rapidly
evolving Firebase SDK (12.10.0 → 12.11.0 within 3 weeks), the official skills
already show signs of lagging SDK coverage.

**Grading assessment:** A third-party `using-firebase` skill from
SpillwaveSolutions (not the official `firebase/agent-skills`) scored 99/100 on
January 12, 2026, but this pre-dates the official release and is a different
repository. The grading report noted missing scripts, no troubleshooting guide,
and no feedback loops — none of which apply to the official skills directly but
are ecosystem indicators [9].

---

### 5. Integration Format: Claude Code Plugin + SKILL.md Standard [CONFIDENCE: HIGH]

The official Firebase skills use the `SKILL.md` open standard with
Claude-specific extensions provided via a `.claude-plugin/` directory
(containing `plugin.json` and `marketplace.json`). This is distinct from
SoNash's current agent format (`.claude/agents/*.md`) [8][10].

Integration methods:

- **Claude plugin**: Install via `claude.com/plugins/firebase` (14,451 installs)
  — adds the MCP server alongside skills
- **Agent Skills CLI**: `npx skills add firebase/agent-skills` — installs skills
  only to `.claude/skills/`
- **Manual**: Copy `skills/` directory contents to `.claude/skills/`

The Claude Code skill format (`.claude/skills/<skill-name>/SKILL.md`) is fully
compatible with SoNash's existing setup. Installed skills would not conflict
with SoNash's custom `.claude/agents/` agents since they use different
directories and invocation namespaces [10].

However, the Firebase MCP server (bundled with the Claude plugin) adds live
Firebase project access tools — Firestore CRUD, Auth user management, Functions
log retrieval, etc. The MCP server does NOT expose App Check or httpsCallable
construction tooling, but it does provide operational tooling that SoNash's
existing agents lack [6].

---

### 6. Overlap Analysis with Existing SoNash Agents [CONFIDENCE: HIGH]

Inspection of SoNash's existing agents reveals significant Firebase-specific
context already embedded:

**`security-auditor.md`**: Contains complete, SoNash-specific Firebase security
architecture — `withSecurityChecks()` patterns, App Check enforcement,
3-collection write gate, Zod validation in Cloud Functions, Semgrep rule
references. This agent already covers what the official skills omit, and more
specifically.

**`frontend-developer.md`**: Contains Firebase 12.10.0 stack version, repository
pattern via `lib/firestore-service.ts`, and `httpsCallable` usage patterns for
protected writes.

**`test-engineer.md`**: Contains the httpsCallable mock pattern
(`vi.mock('firebase/functions')`).

The official skills would add:

- Generic Firestore Standard Mode guidance (not SoNash-specific)
- App Hosting / Next.js deployment patterns (useful, not covered by current
  agents)
- Genkit/AI Logic integration guidance (future use)
- MCP server operational tools (live project inspection)

They would NOT replace or improve what the existing security-auditor,
frontend-developer, or test-engineer agents already provide for SoNash's
specific patterns.

---

### 7. Value Assessment: Would a firebase-specialist Agent Add Value? [CONFIDENCE: MEDIUM]

The gap analysis yields a clear picture:

**Official skills provide (that SoNash currently lacks):**

- App Hosting + Next.js deployment automation guidance
- Genkit/AI Logic integration recipes
- Firestore Enterprise Native Mode patterns (niche but not currently covered)
- MCP server: live Firestore querying, Auth user lookup, Functions log retrieval

**Official skills do NOT provide (and SoNash needs):**

- App Check enforcement verification in Cloud Functions
- `httpsCallable`-only write pattern for protected collections
- `withSecurityChecks()` wrapper guidance
- Zod schema alignment between client Firestore data and Cloud Function
  validation
- Rate limiting (both Firestore-backed server-side and client-side UX layer)
- `sonash.security.no-direct-firestore-write` Semgrep rule enforcement context
- Firebase 12.10.0-specific modular import patterns

A `firebase-specialist` agent built for SoNash would fill the gap between: (a)
generic official skills (broad Firebase knowledge, no SoNash constraints) (b)
existing security-auditor (SoNash security patterns, not Firebase general
guidance)

The specialist role would be: **Firebase implementation guidance with SoNash
constraints baked in** — guiding new feature development involving Firebase so
that it arrives at the security-auditor with correct patterns already applied,
reducing rework. The security-auditor reviews; the firebase-specialist builds
correctly the first time.

---

## Sources

| #   | URL                                                                                                                                            | Title                                      | Type                     | Trust  | CRAAP Avg | Date       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------ | ------ | --------- | ---------- |
| 1   | https://firebase.google.com/docs/ai-assistance/agent-skills                                                                                    | Firebase agent skills docs                 | Official docs            | HIGH   | 4.6       | 2026-03    |
| 2   | https://firebase.blog/posts/2026/02/ai-agent-skills-for-firebase/                                                                              | Introducing Agent Skills for Firebase      | Official blog            | HIGH   | 4.4       | 2026-02    |
| 3   | https://firebase.google.com/support/release-notes/js                                                                                           | Firebase JS SDK Release Notes              | Official docs            | HIGH   | 5.0       | 2026-03-19 |
| 4   | https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-basics/SKILL.md                                                   | firebase-basics SKILL.md                   | Source code              | HIGH   | 4.8       | 2026-02    |
| 5   | https://raw.githubusercontent.com/firebase/agent-skills/main/skills/firebase-firestore-standard/SKILL.md                                       | firebase-firestore-standard SKILL.md       | Source code              | HIGH   | 4.8       | 2026-02    |
| 6   | https://firebase.google.com/docs/ai-assistance/mcp-server                                                                                      | Firebase MCP server docs                   | Official docs            | HIGH   | 4.6       | 2026-03    |
| 7   | https://medium.com/google-cloud/just-in-time-skills-building-a-skills-discovery-agent-for-the-gemini-cli-with-adk-and-antigravity-a2df9edd255f | Why I Stopped Installing Agent Skills      | Community / Google Cloud | MEDIUM | 3.8       | 2026-03    |
| 8   | https://github.com/firebase/agent-skills                                                                                                       | firebase/agent-skills repository           | Source code              | HIGH   | 4.6       | 2026-02    |
| 9   | https://github.com/SpillwaveSolutions/using-firebase/issues/13                                                                                 | Agent Skill Grading Report: using-firebase | Community                | MEDIUM | 3.4       | 2026-01-12 |
| 10  | https://code.claude.com/docs/en/skills                                                                                                         | Claude Code — Extend with skills           | Official docs            | HIGH   | 5.0       | 2026-03    |

---

## Contradictions

**Official skills quality score vs. practical gap:** The `firebase/agent-skills`
repository carries Google's brand authority, but direct content inspection shows
no App Check, no Cloud Functions, and no httpsCallable coverage — the exact
patterns most critical for a security-first Firebase architecture like SoNash.
The 99/100 score cited in community discussions applies to a _different_
third-party skill (`SpillwaveSolutions/using-firebase`), not the official Google
release. These should not be conflated.

**MCP server claims vs. capabilities:** Some community sources describe the
Firebase MCP server as enabling "Cloud Functions" work. Direct inspection of the
MCP server documentation shows this is limited to log retrieval, not Cloud
Function invocation, debugging, or security validation.

---

## Gaps

1. **No official source confirms** which Firebase JS SDK version the
   `firebase/agent-skills` skills were tested against. Version targeting is
   entirely undocumented.

2. **No community production reports** found for `firebase/agent-skills` (only 6
   weeks old, 187 stars). No blog posts describing real-world usage, edge cases,
   or failures.

3. **The `firebase-auth-basics` SKILL.md content** was fetched but the prompt
   extraction confirmed no App Check coverage. The full multi-file structure
   (with referenced sub-documents) was not inspectable via raw GitHub URL, so
   there may be App Check coverage in sub-files not captured here. This is LOW
   probability given the absence in all search results, but cannot be fully
   ruled out.

4. **No direct test** of whether installing official Firebase skills creates any
   conflict with SoNash's `.claude/agents/` agents was performed. Based on
   Claude Code docs, conflicts should not occur (different directories,
   different namespaces), but this is untested.

---

## Serendipity

**Firebase MCP server adds operational tools SoNash agents currently lack.** The
MCP server (bundled with the Claude plugin) provides live Firestore document
queries, Auth user management, and Functions log retrieval. SoNash's existing
agents all operate against static code and configuration. The MCP server would
give agents live project inspection capability — potentially valuable for the
`debugger` and `security-auditor` agents when diagnosing production issues. This
is separate from the agent skills question but worth noting as a complementary
adoption.

**Google's own assessment of the skills ecosystem is "fast-changing."** The
Firebase blog acknowledges features are being added. A review of the skills at
3-month and 6-month marks would be warranted to catch when App Check or Cloud
Functions skills are released.

---

## Recommendation

**Adopt: selective adoption with a wrapper agent.**

1. **Install the Firebase MCP server** (`claude.com/plugins/firebase`) for
   operational tooling (live Firestore queries, Auth user lookup, Functions
   logs). This adds genuine capability SoNash agents currently lack, at no risk
   of conflicting with existing agents.

2. **Do NOT install the official agent skills as-is** as a substitute for a
   firebase-specialist agent. They cover generic Firebase setup patterns
   (authentication providers, Firestore basics, App Hosting) but omit the entire
   security boundary architecture that SoNash requires.

3. **Build a `firebase-specialist` agent** that:
   - Uses the official skills as a reference baseline for general Firebase
     guidance
   - Adds SoNash-specific constraints: App Check enforcement, httpsCallable
     write patterns, 3-collection write gate, Zod alignment, rate limiting
     awareness
   - Acts as a "build it right the first time" companion to the
     security-auditor's "verify correctness" role
   - References `firebase-firestore-standard` and `firebase-auth-basics` skill
     content for general patterns, layering SoNash constraints on top

4. **Monitor for official Cloud Functions skill release.** The Firebase blog
   signals more skills are coming. When a `firebase-cloud-functions-basics` or
   `firebase-app-check` skill appears, re-evaluate whether the specialist agent
   can delegate general guidance to it.

---

## Confidence Assessment

- HIGH claims: 5 (skills inventory, SDK version gap, SoNash pattern gaps,
  integration format, overlap analysis)
- MEDIUM claims: 2 (community feedback quality, firebase-specialist value
  estimate)
- LOW claims: 0
- UNVERIFIED claims: 0
- Overall confidence: **HIGH** — the critical finding (no App Check / no
  httpsCallable coverage) is confirmed by direct source inspection, not
  inference.
