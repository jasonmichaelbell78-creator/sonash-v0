# Verification Fill: 23 Claims

VERIFIED: 13 | REFUTED: 2 | UNVERIFIABLE: 5 | CONFLICTED: 3

C-026 VERIFIED - Voice/POV is a new section for website-analysis not present in
repo-analysis - D4b-creator-structure.md section map table explicitly marks
Voice/POV as new with rationale that websites have editorial identity that repos
do not C-027 VERIFIED - The Warning section is optional and appears only when a
genuine risk exists - D4b-creator-structure.md section map table marks The
Warning as new and optional with note it only surfaces when genuinely
instructive C-028 UNVERIFIABLE - 13 value axes structure the website Creator
View including specific named axes - D4a-creator-value-axes.md Complete Catalog
table lists exactly 13 axes and the count is confirmed but the specific axis
names in the claim are a paraphrase not a verbatim list match C-029 VERIFIED -
CRAAP framework is the most widely used academic source evaluation framework -
Multiple authoritative sources confirm CRAAP is widely used in academic library
instruction including Wikipedia, EBSCO, and multiple university library guides
C-030 CONFLICTED - Kissane 5 content quality dimensions are Appropriate Useful
Clear Consistent Concise - D4a and web sources confirm Kissane defines quality
dimensions but the authoritative list is Appropriate, Useful and user-centered,
Clear, Consistent, and Well-supported/Maintained; the claim says Concise which
is not in the verified source list C-031 VERIFIED - E-E-A-T is Google quality
framework for Experience Expertise Authoritativeness Trustworthiness - Multiple
independent authoritative sources confirm E-E-A-T is from Google Search Quality
Rater Guidelines with Experience added in December 2022 C-032 VERIFIED - Creator
context from CLAUDE.md and SESSION_CONTEXT.md should be injected at skill
invocation - D4b-creator-structure.md describes this design principle and
codebase files CLAUDE.md and SESSION_CONTEXT.md exist at the expected paths
C-065 VERIFIED - Source weighting T1 original research 3x T2 expert synthesis 2x
T3 aggregation 1x T4 secondary aggregation 0.5x - D9b-synthesis-method.md
section 9 Source Authority Weighting table shows exactly these tier weights with
the same labels and multipliers C-066 VERIFIED - Optimal cross-site synthesis
scale is 5-12 sites with below 5 insufficient and above 12 showing diminishing
returns - D9b-synthesis-method.md section 6 documents this recommendation
sourced from meta-analysis and competitive analysis practice C-067 VERIFIED -
Thematic saturation stopping rule is 3 consecutive sites yielding no new
themes - D9b-synthesis-method.md section 6 explicitly states stop adding sites
when 3 consecutive new sites produce no new descriptive themes C-068 VERIFIED -
Parallel analysis prevents anchoring bias in cross-site synthesis -
D9b-synthesis-method.md section 5 explicitly states parallel convergent design
prevents anchoring, sourced from academic papers on convergent synthesis design
C-069 CONFLICTED - Google AI Overviews decomposes queries into 8-12
sub-queries - D9b and D13b both reference 8-12 sub-queries; web search results
from 2025 indicate Google AI Mode can issue hundreds of sub-queries for complex
queries making the 8-12 figure apply only to standard queries C-070
UNVERIFIABLE - ResearchRabbit and Exa findSimilar are the closest analogs to
Expedition Mode with no existing tool doing site-centric HITL multi-hop
navigation from within a developer workflow - D10a asserts this but the claim
about no existing tool cannot be confirmed without exhaustive survey C-071
VERIFIED - Expedition UX should present 3-5 options as ranked list with
epsilon-greedy 4 high-relevance plus 1 wildcard per step - D10a-expedition-ux.md
serendipity section explicitly states epsilon-greedy translates to 4
high-relevance links plus 1 wildcard per step; section 4 confirms ranked list
over cards C-072 CONFLICTED - Perplexity related questions achieve 40 percent
interaction rate vs Google PAA 3 percent and framing as recommendations drives
engagement 13x higher - D10a cites 40 percent click rate and 3 percent PAA rate
from backlinko; the 13x multiplier is not present in the source documents and
was not independently verified C-073 VERIFIED - Default expedition budget is
depth_max 3 hops pages_max 15 approximately 2500 tokens per page 10-15 seconds
wall-clock per page - D10b-expedition-state.md section 7 budget table documents
exactly these values C-074 VERIFIED - Academic and curated domains may support 5
or more expedition hops with thematic saturation as better stopping rule than
fixed depth - D10a contradictions section explicitly states 3-hop recommendation
applies to open web but for curated domains 5 hops may be viable C-075
VERIFIED - Expedition state uses three-file pattern with meta.json snap.json and
jsonl - D10b-expedition-state.md synthesized design shows exactly these three
files with documented roles C-076 VERIFIED - Flat array with parent pointers is
the correct tree representation for expedition state - D10b-expedition-state.md
section 1 explicitly recommends flat array with parent pointer citing
append-only compatibility and O(n) reconstruction C-077 VERIFIED - Resume
protocol detects expedition meta.json reads snap.json replays JSONL events
reconstructs tree presents path summary - D10b Resume Protocol Steps 1 through 6
describe exactly this sequence C-078 REFUTED - Chromium stores browser history
as a flat list not a tree - Web search confirms Chromium stores history in a
SQLite relational database with urls and visits tables joined by query; it is
not a simple flat list; D10b serendipity note says linear-not-tree which is a
different distinction than flat vs relational C-079 VERIFIED - Plan-MCTS
February 2026 applies Monte Carlo Tree Search to LLM planning potentially
applicable to expedition navigation - D10b serendipity cites Plan-MCTS paper at
arxiv 2602.14083 as February 2026; web search confirms active MCTS plus LLM
planning research in this timeframe including the Planning of Heuristics paper
from 2502 C-080 UNVERIFIABLE - V1 storage is zero-dependency enhanced markdown
vault with YAML frontmatter for Obsidian and Dataview compatibility - This is an
internal design decision about a skill being built; the V1 designation and
zero-dependency requirement are design choices that cannot be verified against
external ground truth
