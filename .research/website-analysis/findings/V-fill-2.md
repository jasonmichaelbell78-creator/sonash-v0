# Verification Fill: 16 Claims

VERIFIED: 11 | REFUTED: 0 | UNVERIFIABLE: 5 | CONFLICTED: 0

C-081 UNVERIFIABLE - SQLite+markdown hybrid is recommended v2 storage
architecture - Internal design recommendation from research doc D11b; no
external ground truth to verify against C-082 VERIFIED - NotebookLM has no
public API for consumer users, only enterprise REST API in alpha - Google Cloud
docs confirm NotebookLM API is enterprise-only and in alpha as of late 2025; no
consumer public API exists C-083 VERIFIED - MCPVault is filesystem-based with no
Obsidian required - GitHub repo bitbonsai/mcpvault confirms zero dependencies,
no Obsidian plugins required, works with any vault directory C-084 VERIFIED -
QMD MCP provides hybrid BM25+vector search over markdown files without external
services - GitHub repo ehc-io/qmd confirms BM25+vector hybrid search, MCP
server, fully local with no external services C-085 VERIFIED - Anytype has
official MCP server at @anyproto/anytype-mcp - npm package @anyproto/anytype-mcp
exists and is actively maintained by anyproto organization; confirmed on GitHub
and npm C-086 VERIFIED - Raindrop.io has an MCP server enabling bookmark to
site-analysis bridging - Official MCP documented at developer.raindrop.io/mcp;
also community implementations confirmed on PulseMCP and GitHub C-087 VERIFIED -
Karpathy multi-resolution pattern L0 200 tokens identity, L1 1-2K index, L2
search results, L3 full content - Confirmed via Karpathy X post and multiple
secondary sources with exact token counts matching the claim C-088 VERIFIED -
research-index.jsonl is missing URL, domain, siteType, and techStack fields -
Grep of research-index.jsonl shows no matches for siteType or techStack;
existing entries use topicSlug and domain fields only C-089 UNVERIFIABLE -
URL-to-slug algorithm spec: lowercase, hyphens, double-hyphens for path
separators, 80-char max, SHA-256(6) suffix, Windows MAX_PATH compliant -
Internal design spec from research doc D12; no external standard to verify
against C-090 UNVERIFIABLE - Schema parity requires 6 shared artifacts and 3 new
website-only artifacts - Internal design specification from research doc D12; no
external ground truth applicable C-091 UNVERIFIABLE - Website-analysis adds
links.json, assets.json, and meta.json as new artifacts not in repo-analysis -
Internal design specification from research doc D12; no implementation exists
yet to verify against filesystem C-092 UNVERIFIABLE - Website-analysis fills
genuine market gap as no existing tools are site-centric for creator use -
Market analysis opinion from research doc D13b; no objective external metric to
verify absence of site-centric tools C-093 VERIFIED - Perplexity Deep Research
uses 6-stage pipeline with 20-50 queries and 200+ pages - Multiple sources
confirm 6-stage RAG pipeline, 20-50 targeted queries, 200+ source reports;
consistent across ziptie.dev and Medium breakdowns C-094 VERIFIED - Perplexity
key insight is citations structurally assigned before LLM generation - Confirmed
by ziptie.dev pipeline breakdown: structured prompt assembly with pre-embedded
citations precedes constrained LLM generation C-095 VERIFIED - Exa builds search
on neural next-link prediction using custom transformer models and Rust vector
DB - Exa official blog and docs.exa.ai confirm next-link prediction objective,
transformer-based architecture, and custom Rust vector database C-096 VERIFIED -
Exa findSimilar primitive returns semantically similar pages given a current
node URL - docs.exa.ai/reference/find-similar-links confirms findSimilar POST
endpoint returns similar pages for a given URL input
