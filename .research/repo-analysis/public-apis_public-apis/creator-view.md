# Creator View: public-apis/public-apis

**Analyzed:** 2026-04-06 | **Skill Version:** 4.1 | **Depth:** Standard

---

## 1. What This Repo Understands (+ Blindspots)

This repo understands that developers don't want to search for APIs — they want
a single, organized catalog they can browse by category. The 1,490 entries
across 40+ categories represent 10 years of community curation: every entry has
been formatted as `API | Description | Auth | HTTPS | CORS`, making the catalog
both human-scannable and machine-parseable.

What sets this apart from codecrafters' similar curated-list pattern is the
**validation infrastructure**. `scripts/validate/format.py` (277 lines) enforces
the table format, category structure, alphabetical ordering, description length,
and auth/HTTPS/CORS value constraints. `scripts/validate/links.py` (273 lines)
checks for dead links and duplicates. Both have tests (466 + 172 lines). Three
CI workflows run these on PRs. This is a curated list that invested in
**structural integrity tooling** — even if the maintenance has stalled, the
format validation ensures new entries can't break the catalog.

The CONTRIBUTING.md is specific about format requirements: auth must be one of 5
values, CORS must be one of 3 values, descriptions can't exceed 100 characters.
These constraints are enforced by the Python scripts, not just documented.

**Blindspots:** The commercial overlay is heavy. APILayer's banner is the first
thing you see, with 10 promoted APIs before any community content. This is the
"commercial capture" stage of celebrity stagnation: the project's community
value was monetized through sponsorship placement, and maintenance investment
didn't scale with it. 1,197 open issues (most are API submissions) with 1 commit
in 90 days tells the story.

The validation scripts check format and links, but not API liveness. An API can
have a valid link to documentation but be completely defunct. After 10 years,
significant API churn is certain — the catalog is increasingly a snapshot of
2016-2023 rather than a current reference.

---

## 2. What's Relevant To Your Work

Content evaluation of 1,490 API entries across 51 categories surfaced specific
APIs and tools applicable to SoNash and your infrastructure.

**Health APIs (33 entries) — SoNash feature candidates.** SoNash is a recovery
notebook. The Health category has 33 APIs. Most are Covid-focused (aging), but
the category signals exist: CMS.gov (Medicare data, apiKey), Healthcare.gov (no
auth), NPPES (provider lookup, no auth). For a future "recovery resources"
feature, health/wellness APIs are the starting point. The 807 no-auth APIs
across all categories mean zero-friction prototyping.

**Google Calendar API (OAuth) — direct integration candidate.** SoNash uses
Firebase Auth which supports Google OAuth. Calendar integration for sobriety
milestones, meeting reminders, daily check-in scheduling. The most mature
calendar API in the catalog.

**Open-Meteo Weather API (no auth, CORS yes) — zero-friction weather data.**
Weather-mood correlation journaling: "how does weather affect my recovery
today?" No API key needed, CORS enabled = callable directly from SoNash
frontend. Perfect for prototype.

**Google Cloud Natural Language API — journal sentiment analysis.** Same cloud
ecosystem as Firebase. Could analyze journal entries for emotional patterns over
time. Sentiment tracking across weeks/months of sobriety.

**Text Analysis category (17 entries)** — sentiment tracking, language
detection, keyword extraction. Multiple APIs that could power journal analysis
features.

**validate_links.yml — transferable link checking workflow.** 29 lines. Daily
cron + manual trigger. You have no link checking for docs/\*, SKILL_INDEX.md,
EXTRACTIONS.md, MEMORY.md. This is the concrete extractable: port `links.py`
(273 lines) to Node, wire into a GitHub Action or pre-push hook.

**Format validation as quality gate.** `scripts/validate/format.py` solves a
parallel problem to `npm run patterns:check`: enforcing structural rules on
community-contributed artifacts. Simpler approach (regex + enum validation) than
your AST-based pattern checker, but the principle is identical.

**Link validation workflow.** `validate_links.yml` runs daily and validates all
URLs in the README. You have no equivalent for your documentation —
SKILL_INDEX.md, EXTRACTIONS.md, MEMORY.md all contain references that could rot.
The pattern (scheduled + on-push link checking) is directly transferable.

**Structured catalog format.** The `API|Description|Auth|HTTPS|CORS` table
format is designed for machine parsing. If JASON-OS ever publishes a skill
catalog, this format (structured table with enum columns) is a reference for how
to make a human-readable list also machine-queryable.

---

## 3. Where Your Approach Differs

**Ahead: Validation sophistication.** Your pattern checker has 55+ rules, runs
on pre-commit, and blocks commits. Their format checker has ~15 rules, runs on
CI, and blocks PRs. Yours is more comprehensive and earlier in the pipeline.

**Ahead: Maintenance investment.** You actively maintain 72 skills, run audits,
track tech debt, and have session-end pipelines. They have 1,490 entries with no
active maintenance. Your infrastructure prevents the stagnation they're
experiencing.

**Different: Commercial model.** They monetize through sponsorship placement.
You don't monetize at all (creation for joy). This means you won't face their
specific stagnation pattern (sponsor capture → declining community trust).

**Behind: Nothing meaningful.** Their validation scripts are simpler versions of
patterns you already have. The link checking is the only net-new capability.

---

## 4. The Challenge

The link validation workflow is the one thing worth extracting. You have
documentation artifacts (EXTRACTIONS.md, SKILL_INDEX.md, MEMORY.md, ROADMAP.md)
with embedded URLs that are never validated. A scheduled or on-push link checker
would catch rotting references before they mislead. This is a small, concrete
improvement with clear value.

---

## 5. Knowledge Candidates

| Tier | Candidate                                    | Novelty | Effort | Notes                                                                                                                                                 |
| ---- | -------------------------------------------- | ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- | ----- | ----------------------------------------------------------- |
| T1   | Link validation workflow pattern             | Low     | E1     | validate_links.yml + Python requests checker. Transferable to docs/\*, skill-indexes, README.                                                         |
| T1   | Celebrity stagnation case study (cross-repo) | Medium  | E0     | Second data point alongside codecrafters. Same trajectory with better infrastructure — proves that validation scripts alone don't prevent stagnation. |
| T2   | Structured catalog format (enum columns)     | Low     | E0     | API                                                                                                                                                   | Desc | Auth | HTTPS | CORS. Reference if JASON-OS publishes a skill/tool catalog. |
| T3   | Format validation script pattern             | Low     | E0     | Regex-based format enforcement. Already have more sophisticated equivalent.                                                                           |

---

## 6. What's Worth Avoiding

**The sponsor-first README pattern.** 10 APILayer promoted APIs before any
community content. This erodes community trust and signals "this project exists
to sell you something." If JASON-OS ever has partners or sponsors, keep them
separate from the content index.

**The "validation without maintenance" trap.** This repo proves that format
validation scripts don't prevent stagnation. The scripts ensure structural
integrity of new entries, but they don't ensure entries are current, links are
live, or categories are relevant. Validation is necessary but not sufficient for
catalog health. The missing piece is _lifecycle management_ — and that's exactly
what the "Skill Retirement Process Design" knowledge candidate from codecrafters
addresses.
