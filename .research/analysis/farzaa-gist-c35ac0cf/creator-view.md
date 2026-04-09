# Personal Wiki Skill — farzaa's Implementation of the LLM Wiki Pattern

**URL:** https://gist.github.com/farzaa/c35ac0cfbeb957788650e36aabea836d
**Author:** farzaa **Scan:** Standard, 2026-04-07 **Fit:** active-sprint |
Excellent (80)

---

## 1. What's Relevant To Your Work

This is the most directly useful gist of the three we've analyzed today. Where
Karpathy described the pattern abstractly and the contemplative reasoning prompt
was a workaround for native capabilities, farzaa built an actual Claude Code
skill with commands, phases, and quality rules. It's a concrete reference design
for T24 (synthesis adoption).

**The 7-command architecture maps cleanly to your existing skills:**

| farzaa's command      | Your equivalent                             | Gap                                                            |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| `/wiki ingest`        | `/repo-analysis`, `/website-analysis`       | No gap — your ingest is more sophisticated                     |
| `/wiki absorb`        | No direct equivalent                        | **Key gap** — you ingest but don't absorb into a unified wiki  |
| `/wiki query`         | `/deep-research` (query mode)               | Your query is multi-agent; his is single-wiki-scan             |
| `/wiki cleanup`       | `/alerts`, orphan detection, health scripts | Your lint is automated; his is on-demand                       |
| `/wiki breakdown`     | No direct equivalent                        | **Gap** — systematic entity extraction from existing knowledge |
| `/wiki rebuild-index` | `npm run docs:update-readme`                | Similar — index regeneration                                   |
| `/wiki reorganize`    | No direct equivalent                        | **Gap** — no skill for restructuring existing artifacts        |

**The two gaps — absorb and breakdown — are exactly what T24 should address.**
Absorb = take analysis outputs and weave them into the active knowledge layer.
Breakdown = mine existing knowledge for missing entities/concepts that deserve
their own artifacts.

**Three design patterns worth extracting immediately:**

1. **Anti-cramming / anti-thinning** — your EXTRACTIONS.md already has this
   problem. 81 candidates in one flat file. Some sources have 17 entries
   (HKUDS), some have 5. The balance question: when does a source deserve its
   own sub-index vs staying in the flat list?

2. **15-entry checkpoint cycle** — during batch operations (like running
   `/repo-synthesis` across 6 repos), pause every N items to rebuild indices,
   audit quality, and check for anti-patterns. Your convergence loops do this
   for claims; this applies it to knowledge management.

3. **Writer-not-filing-clerk identity** — the framing that the LLM's job is to
   understand and synthesize, not categorize and file. Your analysis skills
   already lean this way (Creator View is synthesis), but the extraction journal
   is pure filing. T24 could bridge this gap.

---

## 2. What This Site Understands

farzaa understands something your system has been circling around: **the
difference between ingesting knowledge and absorbing it.** Ingest is mechanical
(read source, extract facts, write entries). Absorb is intellectual (read entry,
understand meaning, update the web of understanding). Your `/repo-analysis`
ingests. Your `/repo-synthesis` begins to absorb. But the absorption stops at
the synthesis report — it doesn't flow back into living artifacts.

The skill also understands quality anti-patterns:

- **Cramming**: everything goes into the same 5 big articles (your equivalent:
  SESSION_CONTEXT.md absorbing everything)
- **Thinning**: creating many stubs without depth (your equivalent: MEMORY.md
  entries that are one-liners)
- **Diary structure**: organizing by date instead of by theme (your equivalent:
  SESSION_HISTORY.md is pure chronology)

| Axis               | Band            | Notes                                            |
| ------------------ | --------------- | ------------------------------------------------ |
| Actionability      | Excellent (92)  | Drop into `.claude/skills/` and it works         |
| Novelty            | Healthy (70)    | First public Claude Code skill for personal wiki |
| Evidence quality   | Critical (35)   | No benchmarks, no usage reports                  |
| Technical depth    | Healthy (78)    | 7 commands, phases, subagent workflows           |
| Recency            | Healthy (60)    | 9 revisions, actively maintained                 |
| Relevance to stack | Excellent (90)  | Claude Code skill — our exact platform           |
| Cross-ref density  | Critical (10)   | Zero external links                              |
| Synthesis quality  | Healthy (75)    | Good balance of rules and philosophy             |
| Ecosystem coverage | Needs Work (55) | Mentions Obsidian, Day One, Apple Notes          |
| Contrarian signal  | Needs Work (50) | "Writer not filing clerk" is a stance            |
| Teaching quality   | Excellent (80)  | Clear examples, good/bad comparisons             |
| Reproducibility    | Excellent (95)  | Literal skill file, ready to install             |
| Strategic fit      | Excellent (82)  | Direct reference for T24                         |

**Overall quality:** Healthy (67) | **Personal fit:** Excellent (80)

---

## 3. Voice and Editorial POV

farzaa writes with the authority of someone who has used this skill extensively
on their own data. The writing standards section reads like lessons learned from
real experience — "the gravitational pull of existing articles is the enemy" and
"the most common problem is diary-driven structure" are observations, not
theories.

The "Steve Jobs test" for article structure is a memorable heuristic:
Wikipedia's Steve Jobs article uses "Early life," "Career" (by era), NOT "The
Xerox PARC Visit," "The Lisa Project Failure." Theme-driven, not event-driven.

The tone is directive and opinionated. No hedging, no "consider" or "might want
to." This is how the author builds wikis and they're telling you to do it this
way.

---

## 4. Where Your Approach Differs

**Productive divergences:**

- **farzaa uses a single wiki directory.** You distribute knowledge across
  `.research/`, `docs/`, `.planning/`, `MEMORY.md`. His approach is simpler (one
  place to look); yours is more modular (different concerns in different
  locations). Neither is wrong — the question is whether your distribution makes
  cross-referencing harder.

- **His absorb is sequential (one entry at a time).** Your analysis skills are
  parallel (multi-agent). His approach ensures coherence; yours prioritizes
  throughput. For personal wiki, sequential makes sense. For your scale (81
  extraction candidates, 6 repos, multiple websites), parallel is necessary.

- **His cleanup spawns subagents in batches of 5.** Your agent orchestration
  uses dynamic allocation based on task complexity. His fixed-batch approach is
  simpler and might be more predictable.

**Fundamental divergence:**

- **He has no session continuity.** His skill assumes one long session. No
  compaction handling, no checkpoint/restore, no cross-session state beyond
  `_absorb_log.json`. Your infrastructure (SESSION_CONTEXT.md, `/checkpoint`,
  `/session-begin`, `/session-end`) is an entire layer his skill doesn't have.
  This is the gap Karpathy also missed.

---

## 5. The Challenge

The skill is designed for personal journals and life data — people, places,
emotions, relationships. Your data is technical — repos, skills, research
findings, code patterns. The taxonomy (philosophies/, tensions/, eras/) doesn't
map to your domain. The writing standards (Wikipedia tone, Steve Jobs test) work
for biography but not for technical knowledge management.

Extracting the _patterns_ (anti-cramming, checkpoint cycles, writer identity)
transfers well. Extracting the _specifics_ (directory taxonomy, article format,
length targets) does not.

---

## 6. Knowledge Candidates

| ID  | What to Extract                           | Type                 | Confidence | Effort |
| --- | ----------------------------------------- | -------------------- | ---------- | ------ |
| K1  | Anti-cramming / anti-thinning balance     | design-principle     | HIGH       | Low    |
| K2  | 15-entry checkpoint cycle                 | workflow-pattern     | HIGH       | Low    |
| K3  | 5-batch parallel subagent cleanup         | workflow-pattern     | HIGH       | Medium |
| K4  | Writer-not-filing-clerk identity          | design-principle     | MEDIUM     | Low    |
| K5  | Concurrency safety rules for LLM file ops | pattern              | HIGH       | Low    |
| K6  | 7-command architecture as T24 reference   | architecture-pattern | HIGH       | Medium |

---

## Engineer View

GitHub Gist platform — dimensions platform-inherited.

| Dimension        | Band            | Notes                                              |
| ---------------- | --------------- | -------------------------------------------------- |
| Performance      | N/A             | GitHub Gist                                        |
| Security Headers | N/A             | GitHub platform                                    |
| Accessibility    | Healthy (65)    | Markdown with good heading hierarchy (53 headings) |
| SEO              | Needs Work (40) | Generic OG tags                                    |
| Technical Stack  | N/A             | GitHub Gist                                        |
| Mobile Readiness | Healthy (70)    | GitHub responsive layout                           |

---

## Metadata

- **11 findings** extracted (9 HIGH confidence, 1 MEDIUM, 2 absences)
- **6 knowledge candidates** ranked
- **0 external links**
- **5 absence patterns** identified
