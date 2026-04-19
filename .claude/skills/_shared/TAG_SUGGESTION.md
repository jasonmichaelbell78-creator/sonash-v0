# Tag Suggestion Protocol

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-15
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Canonical Tag Suggestion template for all Content Analysis System handler skills
(`/repo-analysis`, `/website-analysis`, `/document-analysis`,
`/media-analysis`).

Each skill MUST execute this protocol in its own Phase 6c. Skills provide their
own **signal sources** line and reference this file for the rest.

---

## When

After Value Map (Phase 6), before Self-Audit. Required for Standard and Deep
depths. Quick Scan MAY skip (tags filled opportunistically on promotion).

## What

Propose tags for BOTH the analysis record (`analysis.json.tags`) AND each
extraction-journal entry (`extraction-journal.jsonl` rows) per CONVENTIONS.md
§14:

- **At least 3 semantic tags per entry** (required)
- Draw from the 8 categories: `domain`, `technology`, `concept`, `technique`,
  `pattern`, `applicability`, `quality`, `taxonomic`
- No upper bound — tag as many subjects as the content genuinely spans
- Respect forbidden tags (CONVENTIONS.md §14.2)
- Respect naming rules (CONVENTIONS.md §14.5)

## How

1. **Read signal sources** — skill-specific inputs (see each skill's signal line
   at its Phase 6c section).
2. **Pull from vocabulary** — `.research/tag-vocabulary.json` first; never
   invent without proposal.
3. **Propose genuinely new tags** — with category + one-sentence definition;
   user approves before first use (per CONVENTIONS.md §14.4 vocabulary-first
   growth).
4. **Present to user** using this format:

   ```
   Suggested tags for [entry name]:

     Accepted vocabulary: [tag1, tag2, tag3, ...]
     Proposed new:        [new-tag — category: <cat>; "<definition>"]

   Accept / Modify / Add?
   ```

5. **Wait for explicit user response.** Do NOT pre-populate `analysis.json.tags`
   or `extraction-journal.jsonl` entries without approval.
6. **Write approved tags** to both files once accepted. Update
   `.research/tag-vocabulary.json` with any newly approved tags.

## Writing to `.research/tag-vocabulary.json` (sanctioned pattern)

**Canonical path:** direct **Edit tool** on `.research/tag-vocabulary.json`,
inserting new tag entries inline before the closing `}` of the `tags` object
(alongside existing entries). Bump `last_updated` to today's date in the same or
adjacent Edit.

**Do NOT use** (hook-denied patterns observed Session #287):

- `jq --slurpfile <tmpfile> ... > out && mv` where `<tmpfile>` was
  heredoc-written by an unseen Bash — flagged as "modification of shared state
  with unverifiable parameters."
- `Write(scripts/tmp-*.js) && node ... && rm` one-shot script patterns — flagged
  as "unverifiable code execution."

Both are valid mechanics in isolation but the hook cannot attest the
intermediate payloads were what the user approved. Direct Edit keeps the full
diff visible in the transcript.

**Floor:** the Edit must include the new tag name + category + definition
exactly as the user approved in the Phase 6c prompt. Do not paraphrase
definitions or silently add extra tags beyond the approved set.

## Skills declare their own signal sources

Each skill's Phase 6c section includes one line like:

```
**Signal sources for <skill>**: creator-view.md, entry notes,
engineer-view.md, <skill-specific artifact(s)>.
```

This is the only skill-specific content — the rest of the protocol is shared.

## Sources of signal truth (reference)

| Skill             | Primary signal sources                                                  |
| ----------------- | ----------------------------------------------------------------------- |
| repo-analysis     | creator-view, notes, engineer-view, mined-links, top dependencies       |
| website-analysis  | creator-view, notes, engineer-view, meta.json, outbound-link ecosystem  |
| document-analysis | creator-view, notes, engineer-view, cited references                    |
| media-analysis    | creator-view, notes, engineer-view, transcript, speaker/channel context |

---

## Why this file exists

Prior to v1.0, the 4 CAS handler skills each duplicated ~45 lines of Tag
Suggestion prose verbatim. Consolidation eliminates drift and gives a single
edit point for protocol changes. Per-skill variation is reduced to the
signal-sources line plus any domain-specific exceptions declared inline.

**Referenced by:** `/repo-analysis` §Tag Suggestion, `/website-analysis` §Tag
Suggestion, `/document-analysis` §Tag Suggestion, `/media-analysis` §Tag
Suggestion.

**See also:** CONVENTIONS.md §14 (Tag Conventions — the authoritative source for
categories, naming rules, forbidden tags, and vocabulary growth).
