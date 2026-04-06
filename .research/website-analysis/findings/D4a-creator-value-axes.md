# Findings: Website Value Axes vs. GitHub Repositories (SQ4a)

**Searcher:** deep-research-searcher **Profile:** web + academic **Date:**
2026-04-05 **Sub-Question IDs:** SQ4a

---

## Key Findings

### 1. Content Quality Has Five Canonical Dimensions (Kissane Framework) [CONFIDENCE: HIGH]

Erin Kissane's "The Elements of Content Strategy" (A Book Apart, widely cited as
the canonical framework in content strategy practice) defines good content as
being:

- **Appropriate** — fitting for audience, context, delivery method, style, and
  format; respects user mental models including device and emotional state
- **Useful and user-centered** — genuinely serves user needs, not
  self-promotional or one-directional
- **Clear** — language, information architecture, and presentation reduce
  cognitive load; "consistency of language and presentation acts as a consistent
  interface"
- **Consistent** — unified voice across touchpoints; does not restrict
  creativity but provides stable interface for audiences
- **Well-supported / Maintained** — accurate, current, and backed by elimination
  of outdated material; "more is more" is explicitly rejected

**Implication for website Creator View:** A repo's "What It Knows" maps to
content's "Appropriate + Useful" axes. A website's equivalent must ask: _Does
this content serve the audience it claims to serve? Is it genuinely informed by
user needs or self-serving?_

Sources: [1], [2]

---

### 2. Information Architecture Decomposes Into Four Evaluable Systems (Rosenfeld/Morville) [CONFIDENCE: HIGH]

The canonical IA framework (Rosenfeld, Morville, Arango — "Polar Bear Book," 4th
ed.) defines four interdependent systems that reveal how a site organizes
knowledge:

- **Organization System** — how content is categorized and grouped; the
  underlying taxonomy and ontology; reveals the creator's mental model of the
  subject domain
- **Labeling System** — terminology and naming conventions throughout; reveals
  vocabulary choices and assumed shared knowledge with audience
- **Navigation System** — pathways users follow; wayfinding cues; hierarchical
  vs. flat structures; reveals priority ordering of content
- **Search System** — findability vs. discoverability; information scent (the
  trail of contextual clues)

Nielsen Norman Group's study guide adds:

- **Findability vs. Discoverability** as a primary tension: sites optimized for
  search vs. sites designed for browsing reveal different creator philosophies
  about how users engage with content
- **Information Scent** — quality of link labels and navigation text as a signal
  of how well the creator understands their audience's path to knowledge

**Implication for website Creator View:** IA structure is not just usability
data — it's _epistemological evidence_. How a site organizes its knowledge
reveals what the creator thinks the important distinctions are, what's
subordinate to what, what clusters naturally together. This is what a repo's
architecture reveals via its directory structure, module boundaries, and naming
conventions — but websites make it navigable and therefore more legible.

Sources: [3], [4], [5]

---

### 3. Voice and Editorial Stance Are Multi-Dimensional and Assessable [CONFIDENCE: MEDIUM-HIGH]

Journalism and content strategy research identify the following dimensions of
editorial voice/perspective:

**Tone dimensions** (ScienceDirect, Journalism University):

- Formal vs. casual register
- Authoritative vs. conversational delivery
- Analytical vs. narrative mode
- Single vs. polyphonic voice (does the site argue from one perspective or
  present multiple viewpoints?)

**Editorial stance dimensions:**

- **Point of view** — does the site argue for a position? (editorial strategy
  frameworks define POV as foundational: "arrows from your strategic narrative
  lead to your unique point of view")
- **Bias visibility** — acknowledged or unacknowledged perspective
- **Audience assumptions** — what does the writing assume the reader already
  knows? (reveals intended audience mental model)
- **Epistemic posture** — claims presented as settled vs. exploratory vs.
  provisional

**Readability as proxy:**

- Reading level targeting (7th-8th grade US = broad audience; higher = expert
  audience) — reveals who the creator thinks they're writing for
- Use of active vs. passive voice
- Inverted pyramid structure (front-loaded importance) vs. narrative structure

**Implication for website Creator View:** A repo's "What This Repo Understands"
(deep knowledge and philosophy embedded in code) maps to a website's _editorial
stance and point of view_. The website equivalent asks: _What does this site
believe that others in its space don't? What perspective does it argue from?
What does it assume is already settled?_

Sources: [6], [7], [8], [9]

---

### 4. The Link Graph Is a Curated Knowledge Endorsement Map [CONFIDENCE: MEDIUM]

Outbound links carry specific signal value distinct from content:

- **Outbound links as editorial endorsements** — "Outbound links should be an
  editorial choice, not a bargaining chip"; each link is an endorsement of the
  linked source. Strategic outbound links "act like scholarly footnotes: they
  prove mastery of a topic"
- **Contextual links > blogroll/sidebar** — in-content links carry stronger
  editorial weight than sidebar/blogroll links; the location reveals how central
  the endorsement is
- **Blogrolls as curated knowledge maps** — a blogroll or "links page" is an
  explicit act of curation; it reveals who the creator reads, trusts, and wants
  to be associated with; functionally equivalent to a repo's ACKNOWLEDGMENTS or
  dependency list but for ideas rather than code
- **Internal link patterns as IA signal** — internal links reveal what the
  creator considers "cornerstone content"; heavily linked-to pages are the
  site's conceptual anchors; "find topics associated with cornerstone content
  and identify where gaps exist"

**The link graph as knowledge graph:** Modern SEO research frames outbound links
as entity associations — they signal which knowledge community the site
positions itself within. "Articles, podcasts, videos, communities, and tools all
feed the same knowledge graph."

**Implication for website Creator View:** Repos don't have outbound links — they
have dependencies (package.json, imports). But dependencies are functional, not
editorial. A website's link graph is _explicitly curatorial_: it shows what the
creator reads, learns from, and wants readers to follow. This is a
website-exclusive value axis.

Sources: [10], [11], [12]

---

### 5. Content Depth and Freshness Are Measurable Quality Dimensions [CONFIDENCE: MEDIUM-HIGH]

**Content Depth** (MarketMuse, SEO research corpus):

- "How well a page explains its topic — not about writing long posts but about
  answering the main query and all related subtopics clearly and fully"
- Semantic density (information per unit of text) is a better quality indicator
  than length alone
- "Content Depth Score evaluates whether an article provides in-depth
  information that fully addresses user intent, questions, and subtopics"
- Depth signals mastery vs. surface coverage; it distinguishes a genuine subject
  matter expert from someone aggregating existing knowledge

**Content Freshness / Temporal Currency:**

- "Freshness is not merely about recency of publication — a page published five
  years ago but consistently updated with current information can send stronger
  freshness signals than a page published last month"
- Temporal currency is a CRAAP-test dimension (Currency): publication date
  relative to topic's rate of change
- Freshness supports trust: "when users encounter outdated data or broken
  references, confidence drops quickly"
- Update patterns reveal site maintenance philosophy (active vs. abandoned)

**Implication for website Creator View:** These two dimensions together form a
quality signal pair — _depth_ (how much the creator knows about a topic) and
_currency_ (how current that knowledge is). A repo has code quality and recency;
a website has content depth and freshness. The website equivalents are richer
for knowledge assessment because they're explicitly communicative, not inferred.

Sources: [13], [14], [15]

---

### 6. Visual Design Functions as a Creator Priority Signal [CONFIDENCE: MEDIUM]

Typography and visual design choices signal content quality and creator values:

**Typography as trust signal** (Web Style Guide, authoritative web standards
reference):

- Consistency in font choices, spacing, styling "gives polish" and builds reader
  confidence; "sloppy, inconsistent formatting confounds expectation, decreasing
  confidence in words"
- Visual hierarchy (contrast, scannable patterns) reveals how the creator
  understands their audience's reading behavior
- Appropriate line length, leading, and alignment are legibility signals
- Semantic markup (H1-H6 hierarchy, accessibility compliance) reveals how much
  the creator thinks about non-visual access to their content

**Whitespace as priority signal:**

- Whitespace "signals how important an element is and where it should be in a
  logical layout"
- Generous whitespace = prioritizes reader comprehension over content density;
  constrained whitespace = maximizes visible content
- "94% of people say site design is how they establish their first impression"

**Design as editorial positioning:**

- Visual design choices locate a site in a genre: academic (spare, text-dense,
  footnoted), editorial (publication-style, curated imagery), blog (personal,
  chronological), documentation (structured, navigable)
- Design genre signals audience expectations and creator self-concept

**Implication for website Creator View:** Visual design is not primarily a UX
evaluation axis for a creator learning from a site — it's a signal about the
_creator's priorities_. A sparse, text-forward design says: "the ideas are
primary." Heavy imagery and short copy says: "visuals communicate first." A
creator extracting knowledge from a site should note what design philosophy they
embody.

Sources: [16], [17], [18]

---

### 7. The Emerald Journal Model: 13-Dimension Website Quality Framework [CONFIDENCE: HIGH]

A systematic academic review of website quality evaluation (Emerald Journal of
Documentation, 2023) synthesized 120+ quality parameters into 13 dimensions,
organized around three analytical perspectives:

- **Strategic** (owner objectives): Content and Services, Advertising/Marketing,
  Legal Aspects
- **Functional** (technical features): Technology and Security, Information
  Architecture, Multimedia, Performance/Effectiveness
- **Experiential** (user perceptions): Usability and Accessibility, User
  Experience, Graphic Design, Interactivity, Assistance/Support,
  Participation/Sociability

The **Content and Services** dimension includes: relevance, readability,
clarity, completeness, reliability, and "truthfulness and rigour."

The **User Experience** dimension includes: trust, satisfaction, credibility,
and meeting user expectations — all content-quality proxies.

**Key insight:** The three-perspective model (strategic / functional /
experiential) maps interestingly to a creator's interests: a creator learning
from a website is primarily interested in the _strategic_ perspective (what does
this site know and what does it intend?) and secondarily in the _experiential_
(what does it feel like to engage with this knowledge?). The
functional/technical dimensions are least relevant to knowledge extraction.

Sources: [19]

---

### 8. CRAAP Framework as Base Evaluation Layer for Website Content [CONFIDENCE: HIGH]

The CRAAP test (Blakeslee, CSU Chico, 2004; widely adopted in library science
and academic instruction) provides a standardized 5-dimension content evaluation
that directly applies to website analysis:

- **Currency** — timeliness of content relative to topic's rate of change
- **Relevance** — how suitable information is for a specific purpose; depth of
  coverage
- **Authority** — credibility and expertise of the author/organization; academic
  background, professional credentials, institutional affiliation
- **Accuracy** — verifiability, citation practices, fact-checking, cross-
  referencing; presence of bias
- **Purpose** — reason the content exists: to inform, teach, entertain, or
  persuade; affects how to interpret its claims

**Implication for website Creator View:** CRAAP is a reader/researcher lens that
applies cleanly to a "Creator View" — a creator analyzing someone else's website
wants to know how trustworthy the knowledge is, how deep the expertise goes, and
what agenda shapes the content selection.

Sources: [20], [21]

---

## Mapping to Repo Creator View Sections

The repo Creator View has 5 sections. Here is the analysis of each:

### Section 1: "What This Repo Understands" — TRANSFERS WITH MODIFICATION

**Repo version:** Mental models, techniques, philosophies embedded in code and
docs. "Not what it DOES — what it KNOWS."

**Website equivalent:** _What This Site Knows_

- What domain knowledge does the content reveal? What does the author understand
  deeply vs. shallowly?
- What is the epistemic posture? (Settled expertise vs. active exploration vs.
  curation of others' knowledge)
- What topics are treated with depth (semantic density, subtopic coverage)? What
  is conspicuously absent?
- What assumptions does the writing embed about what the reader already knows?
- Content depth + CRAAP Authority + CRAAP Accuracy are the signals

**Verdict:** TRANSFERS with new signal sources. Replace code structure signals
with content depth, vocabulary sophistication, citation practice, and
comparative coverage.

---

### Section 2: "What's Relevant To Your Work" — TRANSFERS DIRECTLY

**Repo version:** Direct comparison to home repo. "They do X, you do Y."

**Website equivalent:** _What's Relevant To Your Work_

- This section is purely about the analyst's context. A website is a knowledge
  source exactly like a repo is.
- The comparison changes (content decisions vs. code decisions) but the
  structure doesn't.

**Verdict:** TRANSFERS DIRECTLY. Framing may shift from architecture/code
comparison to content approach/angle comparison.

---

### Section 3: "Where Your Approach Differs" — TRANSFERS WITH ENRICHMENT

**Repo version:** Classify differences as Ahead / Different / Behind.

**Website equivalent:** _Where Your Approach Differs_

- Can apply the same Ahead/Different/Behind classification but to content
  choices: topic coverage, content format, POV framing, IA approach, visual
  design philosophy
- Richer than the repo version because websites have _more explicit_ creative
  choices visible. Code differences require inference; content differences are
  stated.

**Verdict:** TRANSFERS with expanded surface area. More dimensions to compare
(IA, voice, link curation, visual design) vs. repo (architecture, tooling,
conventions).

---

### Section 4: "The Challenge" — TRANSFERS DIRECTLY

**Repo version:** "THE thing from this repo you should seriously consider." Only
when warranted.

**Website equivalent:** _The Challenge_

- Same intent: one opinionated recommendation from the whole analysis
- For websites: "This site does X with its content strategy / editorial POV /
  knowledge organization that you should seriously consider"
- May be about voice, may be about IA, may be about a specific content depth on
  a topic

**Verdict:** TRANSFERS DIRECTLY. Format identical.

---

### Section 5: "Knowledge Candidates" — TRANSFERS WITH REPLACEMENT

**Repo version:** What could you LEARN from deeper engagement? Not code to
extract — understanding to gain. Tiered: Tier 1 (active projects), Tier 2
(systems understanding), Tier 3 (interesting).

**Website equivalent:** _Knowledge Candidates_ (different signal sources)

- In repos, candidates come from: patterns, architectural decisions, tooling
  choices
- In websites, candidates come from: content angles not covered in your work,
  editorial stances you haven't considered, link graph entries (resources,
  authors, sites the creator trusts), taxonomic approaches you could borrow,
  specific deep-knowledge pages worth reading in full

**Verdict:** TRANSFERS with replacement of signal sources. The link graph and
outbound citations are exclusively website phenomena — they provide a _curated
reading list_ that repos simply cannot offer. This makes Knowledge Candidates
richer for websites.

---

### NEW SECTION RECOMMENDATION: "Editorial Stance and Point of View"

**Not present in repo Creator View** — repos don't argue for positions.

**Website-exclusive section:** _What This Site Believes_

- What position does the site argue from? Is it advocacy, education, curation,
  or exploration?
- What does this site believe that others in its space don't (or won't say)?
- What topics does it systematically avoid or underweight? (Absence as signal)
- What is the tone/register: formal/academic, personal/confessional,
  polemical/opinionated, neutral/journalistic?
- What audience assumptions are embedded in the vocabulary and topic selection?

**Why it's unique to websites:** A GitHub repo has an implicit point of view
(architectural philosophy, tooling choices), but it doesn't _argue_. A website
with editorial content makes explicit claims, advocates positions, and curates
based on perspective. That perspective is learnable and transferable.

**Confidence:** MEDIUM-HIGH (strongly supported by journalism/content strategy
frameworks; not yet validated as a named "section" in any existing website
analysis framework)

---

### NEW SECTION RECOMMENDATION: "Link Graph as Knowledge Map"

**Not present in repo Creator View** — repos have functional dependencies, not
editorial endorsements.

**Website-exclusive section:** _The Link Graph_

- What does the outbound link pattern reveal about who the creator reads and
  trusts?
- Are there blogroll/resource pages? These are explicit curated reading lists.
- What are the "cornerstone pages" revealed by internal link density?
- What knowledge communities does this site position itself within (via who it
  cites)?
- Where does the creator send readers who want to go deeper?

**Why it's unique to websites:** No equivalent in repos. Package dependencies
are functional (use this library to do X) not intellectual (read this because it
will help you think). The website link graph is an explicit map of intellectual
influences and recommended knowledge sources.

---

## Complete Catalog of Website Value Axes

| Axis                       | Category               | Repo Equivalent?          | Primary Signals                                          |
| -------------------------- | ---------------------- | ------------------------- | -------------------------------------------------------- |
| Content depth              | Knowledge quality      | Partial (code complexity) | Semantic density, subtopic coverage, citation practice   |
| Content freshness          | Knowledge currency     | Commit recency            | Last updated dates, broken reference frequency           |
| Editorial stance / POV     | Perspective            | None (implicit)           | Argument framing, topic selection, vocabulary            |
| Information architecture   | Knowledge organization | Directory structure       | Taxonomy, labeling, nav hierarchy                        |
| Voice and tone             | Communication style    | None                      | Register, sentence structure, reading level              |
| Link graph (outbound)      | Intellectual community | None                      | Who is cited, blogroll, resource pages                   |
| Internal link density      | Content prioritization | Module coupling           | Cornerstone pages, hub-and-spoke patterns                |
| Visual design philosophy   | Design values          | None                      | Typography, whitespace, imagery-to-text ratio            |
| Authority signals          | Credibility            | README authorship         | Author credentials, institutional affiliation, citations |
| Readability                | Accessibility          | Code legibility           | Reading level, sentence length, use of jargon            |
| Completeness               | Coverage               | Feature coverage          | What topics are treated, what is absent                  |
| Audience assumptions       | Targeting              | None                      | Vocabulary, assumed prior knowledge                      |
| Purpose / editorial intent | Goals                  | Project goals             | Inform vs. advocate vs. curate vs. sell                  |

---

## Sources

| #   | URL                                                                                                                                         | Title                                                                | Type                     | Trust  | CRAAP Avg | Date         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------ | ------ | --------- | ------------ |
| 1   | https://elements-of-content-strategy.abookapart.com/05-chapter-3/                                                                           | The Elements of Content Strategy — Ch. 3 (Kissane)                   | Official book            | HIGH   | 4.4       | 2011         |
| 2   | https://www.contentstrategy.at/literature-reviews/the-elements-of-content-strategy-review                                                   | Content Strategy Knowledge Base: Kissane Review                      | Community review         | MEDIUM | 3.8       | ~2020        |
| 3   | https://www.archbee.com/blog/book-review-information-architecture-for-the-web-and-beyond-by-louis-rosenfeld-peter-morville-and-jorge-arango | Archbee: IA for the Web and Beyond Review                            | Community review         | MEDIUM | 3.6       | 2022         |
| 4   | https://www.nngroup.com/articles/ia-study-guide/                                                                                            | Nielsen Norman Group: IA Study Guide                                 | Official / authoritative | HIGH   | 4.8       | Updated 2024 |
| 5   | https://www.researchgate.net/publication/44837374_Information_Architecture_for_the_World_Wide_Web                                           | Information Architecture for the World Wide Web (Rosenfeld/Morville) | Academic reference       | HIGH   | 4.6       | 1998/2015    |
| 6   | https://www.sciencedirect.com/article/pii/S0388000120300061                                                                                 | Voice and viewpoint in journalistic narratives                       | Academic peer-reviewed   | HIGH   | 4.5       | 2020         |
| 7   | https://journalism.university/journalistic-writings/editorial-writing-voice-of-newspaper/                                                   | Editorial Writing: The Voice of a Newspaper                          | Industry educational     | MEDIUM | 3.4       | ~2023        |
| 8   | https://www.storytelling.comnetwork.org/explore/181/writing-for-the-web-developing-voice-tone-and-editorial-structure                       | Writing for the Web: Voice, Tone and Editorial Structure             | Industry practice        | MEDIUM | 3.5       | ~2022        |
| 9   | https://www.braintraffic.com/blog/what-is-content-strategy                                                                                  | Brain Traffic: What Is Content Strategy (Halvorson)                  | Official/practitioner    | HIGH   | 4.2       | ~2023        |
| 10  | https://dmnews.com/outbound-links-boosting-your-rankings/                                                                                   | How strategic outbound links improve SEO                             | Industry article         | MEDIUM | 3.2       | 2024         |
| 11  | https://discourse.32bit.cafe/t/links-page-vs-blogroll-page/1005                                                                             | Links Page vs Blogroll Page                                          | Community forum          | LOW    | 2.8       | 2023         |
| 12  | https://inlinks.com/insight/knowledge-graph-content-audits/                                                                                 | How to Audit Your Website's Knowledge Graph                          | Industry tool            | MEDIUM | 3.4       | 2024         |
| 13  | https://blog.marketmuse.com/what-is-topical-depth/                                                                                          | What is Content Depth? (MarketMuse)                                  | Industry practice        | MEDIUM | 3.6       | 2023         |
| 14  | https://www.genrank.co/glossary/content-freshness-signals/                                                                                  | Content Freshness Signals                                            | Industry reference       | MEDIUM | 3.4       | 2025         |
| 15  | https://www.amicited.com/glossary/source-credibility-assessment/                                                                            | Source Credibility Assessment                                        | Industry reference       | MEDIUM | 3.5       | 2024         |
| 16  | https://webstyleguide.com/9-typography.html                                                                                                 | Web Style Guide: Typography                                          | Official/canonical       | HIGH   | 4.6       | Updated 2024 |
| 17  | https://www.loop11.com/the-power-of-white-space-in-ux-design/                                                                               | The Power of White Space in UX Design                                | Industry article         | MEDIUM | 3.4       | 2023         |
| 18  | https://ixdf.org/literature/topics/readability-in-ux-design                                                                                 | What is Readability in UX Design? (IxDF)                             | Official/authoritative   | HIGH   | 4.5       | Updated 2026 |
| 19  | https://www.emerald.com/jd/article/79/7/95/195061/Website-quality-evaluation-a-model-for-developing                                         | Emerald JD: Website quality evaluation — comprehensive model         | Peer-reviewed journal    | HIGH   | 4.7       | 2023         |
| 20  | https://en.wikipedia.org/wiki/CRAAP_test                                                                                                    | CRAAP Test (Wikipedia)                                               | Reference/secondary      | MEDIUM | 3.8       | Updated 2024 |
| 21  | https://www.ebsco.com/research-starters/social-sciences-and-humanities/craap-test                                                           | CRAAP Test — EBSCO Research Starters                                 | Academic reference       | HIGH   | 4.5       | 2024         |

---

## Contradictions

**Depth vs. Freshness tension:** Content strategy literature (Kissane) and
information quality frameworks both value depth and currency, but they can
conflict. A deeply researched piece from 2018 may outperform a shallow 2025
update. No framework resolves this cleanly — all treat them as independent axes
rather than combined. This is accurate (they are independent) but leaves the
analyst without a rule for weighting them against each other.

**Design as signal vs. design as noise:** The Web Style Guide treats typography
as a trust signal; SEO practitioners treat design primarily as a user-experience
factor. For a creator extracting knowledge, design may be largely noise —
interesting but not carrying the same epistemic weight as content decisions. The
correct framing for a Creator View may be: note design philosophy briefly but
don't analyze it with the same depth as IA or editorial stance.

**Blogroll/outbound links — declining vs. enduring signal:** Traditional web
culture (pre-2010) treated blogrolls as primary editorial signals. Modern SEO
literature notes they carry less authority than in-content links. This does not
eliminate their value for a Creator View (which is not about SEO), but it
suggests the _location_ of links (in-content vs. sidebar) matters for reading
editorial intent.

---

## Gaps

1. **No found framework specifically designed for "creator learning from a
   website"** — existing frameworks are either reader-focused (CRAAP,
   usability), business-focused (content strategy maturity), or SEO-focused. The
   "Creator View" lens is novel and has no direct academic precedent found in
   this research.

2. **Voice and perspective analysis lacks quantitative rigor** — journalism
   research identifies voice dimensions but without operationalized metrics that
   can be applied consistently by an AI analyst. The dimensions are real but
   their measurement is inherently qualitative.

3. **Academic IA evaluation framework (ResearchGate, 45 criteria/7 sections)**
   was inaccessible (403 error). This may contain additional structured
   dimensions not captured here. A follow-up search via different access method
   could recover this.

4. **The "Understands" equivalent for different website types** — the mapping
   above assumes an editorial/blog website. For e-commerce, news, documentation,
   or tool sites, the primary value axes may shift significantly. The framework
   found here is best-fit for knowledge/editorial websites; it needs domain
   calibration for other genres.

5. **Link graph analysis tools** — research found that InfraNodus and similar
   tools can extract topic networks from text, but no tool was found that
   specifically surfaces the "creator's intellectual community" from outbound
   link patterns in a way useful to the Creator View lens. This may be a gap
   where the skill needs to do manual interpretation.

---

## Serendipity

**InfraNodus** (infranodus.com): An AI text analysis tool that represents any
text as a network and uses graph analysis algorithms to identify the most
influential keywords, topics, and their relations. It explicitly finds "topical
clusters and blind spots." This could be a first-class tool for the website
Creator View's "What It Knows" equivalent — analyzing content as a knowledge
graph rather than as text. Worth evaluating as a potential integration point for
the `/website-analysis` skill.

**Content Engineering as emergent discipline** (Thumbtack Design, 2026): Content
engineering is emerging as a discipline combining content design (voice,
context, constraints), prompt strategy, and evaluation. This suggests websites
are increasingly being built with AI-aware content structures (schema markup,
Q&A format, entity linking). A `/website-analysis` skill should be aware that
newer sites may have explicit machine-readable semantic structure worth
extracting directly, not just inferred from HTML.

**The Four Lenses Framework** (The Augmented Educator): A framework for critical
engagement: critical reading, critical listening, critical seeing, and critical
making. "Critical seeing" — systematic visual analysis — is underrepresented in
content strategy literature but directly applicable to website analysis. This
could inform a structured "visual design as signal" subsection without requiring
a full UX audit.

---

## Confidence Assessment

- HIGH claims: 5 (Kissane framework, Rosenfeld/Morville IA systems, CRAAP
  framework, Emerald Journal 13-dimension model, Web Style Guide typography)
- MEDIUM-HIGH claims: 3 (voice/editorial stance dimensions, content depth and
  freshness as quality signals, visual design as priority signal)
- MEDIUM claims: 2 (link graph as editorial endorsement, IA as epistemological
  evidence)
- LOW claims: 0
- UNVERIFIED claims: 0

**Overall confidence: MEDIUM-HIGH**

The core framework is well-supported by authoritative sources (Kissane,
Morville, NNG, peer-reviewed journal). The mapping to Creator View sections is
analytical work not found directly in any source — it is reasoned from the
evidence rather than cited. The two new sections recommended ("Editorial Stance"
and "Link Graph as Knowledge Map") are supported by converging evidence from
journalism, content strategy, and SEO research but not by any single
authoritative source treating them as website-analysis dimensions specifically.
