---
name: market-research-reports
description:
  "Generate comprehensive market research reports (50+ pages) in the style of
  top consulting firms (McKinsey, BCG, Gartner). Features professional LaTeX
  formatting, extensive visual generation with scientific-schematics and
  generate-image, deep integration with research-lookup for data gathering, and
  multi-framework strategic analysis including Porter's Five Forces, PESTLE,
  SWOT, TAM/SAM/SOM, and BCG Matrix."
allowed-tools: [Read, Write, Edit, Bash]
---

# Market Research Reports

## When to Use

- "Generate comprehensive market research reports (50+ pages) in the style of
- User explicitly invokes `/market-research-reports`

## When NOT to Use

- When the task doesn't match this skill's scope -- check related skills
- When a more specialized skill exists for the specific task

## Overview

Market research reports are comprehensive strategic documents that analyze
industries, markets, and competitive landscapes to inform business decisions,
investment strategies, and strategic planning. This skill generates
**professional-grade reports of 50+ pages** with extensive visual content,
modeled after deliverables from top consulting firms like McKinsey, BCG, Bain,
Gartner, and Forrester.

**Key Features:**

- **Comprehensive length**: Reports are designed to be 50+ pages with no token
  constraints
- **Visual-rich content**: 5-6 key diagrams generated at start (more added as
  needed during writing)
- **Data-driven analysis**: Deep integration with research-lookup for market
  data
- **Multi-framework approach**: Porter's Five Forces, PESTLE, SWOT, BCG Matrix,
  TAM/SAM/SOM
- **Professional formatting**: Consulting-firm quality typography, colors, and
  layout
- **Actionable recommendations**: Strategic focus with implementation roadmaps

**Output Format:** LaTeX with professional styling, compiled to PDF. Uses the
`market_research.sty` style package for consistent, professional formatting.

## When to Use This Skill

This skill should be used when:

- Creating comprehensive market analysis for investment decisions
- Developing industry reports for strategic planning
- Analyzing competitive landscapes and market dynamics
- Conducting market sizing exercises (TAM/SAM/SOM)
- Evaluating market entry opportunities
- Preparing due diligence materials for M&A activities
- Creating thought leadership content for industry positioning
- Developing go-to-market strategy documentation
- Analyzing regulatory and policy impacts on markets
- Building business cases for new product launches

## Visual Enhancement Requirements

**CRITICAL: Market research reports should include key visual content.**

Every report should generate **6 essential visuals** at the start, with
additional visuals added as needed during writing. Start with the most critical
visualizations to establish the report framework.

### Visual Generation Tools

**Use `scientific-schematics` for:**

- Market growth trajectory charts
- TAM/SAM/SOM breakdown diagrams (concentric circles)
- Porter's Five Forces diagrams
- Competitive positioning matrices
- Market segmentation charts
- Value chain diagrams
- Technology roadmaps
- Risk heatmaps
- Strategic prioritization matrices
- Implementation timelines/Gantt charts
- SWOT analysis diagrams
- BCG Growth-Share matrices

```bash
# Example: Generate a TAM/SAM/SOM diagram
python skills/scientific-schematics/scripts/generate_schematic.py \
  "TAM SAM SOM concentric circle diagram showing Total Addressable Market $50B outer circle, Serviceable Addressable Market $15B middle circle, Serviceable Obtainable Market $3B inner circle, with labels and arrows pointing to each segment" \
  -o figures/tam_sam_som.png --doc-type report

# Example: Generate Porter's Five Forces
python skills/scientific-schematics/scripts/generate_schematic.py \
  "Porter's Five Forces diagram with center box 'Competitive Rivalry' connected to four surrounding boxes: 'Threat of New Entrants' (top), 'Bargaining Power of Suppliers' (left), 'Bargaining Power of Buyers' (right), 'Threat of Substitutes' (bottom). Each box should show High/Medium/Low rating" \
  -o figures/porters_five_forces.png --doc-type report
```

**Use `generate-image` for:**

- Executive summary hero infographics
- Industry/sector conceptual illustrations
- Abstract technology visualizations
- Cover page imagery

```bash
# Example: Generate executive summary infographic
python skills/generate-image/scripts/generate_image.py \
  "Professional executive summary infographic for market research report, showing key metrics in modern data visualization style, blue and green color scheme, clean minimalist design with icons representing market size, growth rate, and competitive landscape" \
  --output figures/executive_summary.png
```

---

## Report Structure & Detailed Section Templates

> Read `.claude/skills/market-research-reports/structure.md` for detailed
> section templates, chapter-by-chapter content requirements, visual generation
> examples, LaTeX formatting reference, quality standards, and validation
> checklists.

**Report outline (11 chapters + front/back matter, 50+ pages):**

| Section                                      | Pages   |
| -------------------------------------------- | ------- |
| Front Matter (Cover, ToC, Executive Summary) | ~5      |
| Ch 1: Market Overview & Definition           | 4-5     |
| Ch 2: Market Size & Growth Analysis          | 6-8     |
| Ch 3: Industry Drivers & Trends              | 5-6     |
| Ch 4: Competitive Landscape                  | 6-8     |
| Ch 5: Customer Analysis & Segmentation       | 4-5     |
| Ch 6: Technology & Innovation Landscape      | 4-5     |
| Ch 7: Regulatory & Policy Environment        | 3-4     |
| Ch 8: Risk Analysis                          | 3-4     |
| Ch 9: Strategic Opportunities                | 4-5     |
| Ch 10: Implementation Roadmap                | 3-4     |
| Ch 11: Investment Thesis & Financials        | 3-4     |
| Back Matter (Methodology, Data, Profiles)    | ~5      |
| **TOTAL**                                    | **50+** |

---

## Workflow

### Phase 1: Research & Data Gathering

**Step 1: Define Scope**

- Clarify market definition
- Set geographic boundaries
- Determine time horizon
- Identify key questions to answer

**Step 2: Conduct Deep Research**

Use `research-lookup` extensively to gather market data:

```bash
# Market size and growth data
python skills/research-lookup/scripts/research_lookup.py \
  "What is the current market size and projected growth rate for [MARKET] industry? Include TAM, SAM, SOM estimates and CAGR projections"

# Competitive landscape
python skills/research-lookup/scripts/research_lookup.py \
  "Who are the top 10 competitors in the [MARKET] market? What is their market share and competitive positioning?"

# Industry trends
python skills/research-lookup/scripts/research_lookup.py \
  "What are the major trends and growth drivers in the [MARKET] industry for 2024-2030?"

# Regulatory environment
python skills/research-lookup/scripts/research_lookup.py \
  "What are the key regulations and policy changes affecting the [MARKET] industry?"
```

**Step 3: Data Organization**

- Create `sources/` folder with research notes
- Organize data by section
- Identify data gaps
- Conduct follow-up research as needed

### Phase 2: Analysis & Framework Application

**Step 4: Apply Analysis Frameworks**

For each framework, conduct structured analysis:

- **Market Sizing**: TAM -> SAM -> SOM with clear assumptions
- **Porter's Five Forces**: Rate each force High/Medium/Low with rationale
- **PESTLE**: Analyze each dimension with trends and impacts
- **SWOT**: Internal strengths/weaknesses, external opportunities/threats
- **Competitive Positioning**: Define axes, plot competitors

**Step 5: Develop Insights**

- Synthesize findings into key insights
- Identify strategic implications
- Develop recommendations
- Prioritize opportunities

### Phase 3: Visual Generation

**Step 6: Generate All Visuals**

Generate visuals BEFORE writing the report. See structure.md for complete
generation commands and recommended visuals by section.

### Phase 4: Report Writing

**Step 7: Initialize Project Structure**

Create the standard project structure:

```
writing_outputs/YYYYMMDD_HHMMSS_market_report_[topic]/
├── progress.md
├── drafts/
│   └── v1_market_report.tex
├── references/
│   └── references.bib
├── figures/
│   └── [all generated visuals]
├── sources/
│   └── [research notes]
└── final/
```

**Step 8: Write Report Using Template**

Use the `market_report_template.tex` as a starting point. Write each section
following the structure guide, ensuring:

- **Comprehensive coverage**: Every subsection addressed
- **Data-driven content**: Claims supported by research
- **Visual integration**: Reference all generated figures
- **Professional tone**: Consulting-style writing
- **No token constraints**: Write fully, don't abbreviate

**Writing Guidelines:**

- Use active voice where possible
- Lead with insights, support with data
- Use numbered lists for recommendations
- Include data sources for all statistics
- Create smooth transitions between sections

### Phase 5: Compilation & Review

**Step 9: Compile LaTeX**

```bash
cd writing_outputs/[project_folder]/drafts/
xelatex v1_market_report.tex
bibtex v1_market_report
xelatex v1_market_report.tex
xelatex v1_market_report.tex
```

**Step 10: Quality Review**

Verify the report meets quality standards:

- [ ] Total page count is 50+ pages
- [ ] All essential visuals (5-6 core + any additional) are included and render
      correctly
- [ ] Executive summary captures key findings
- [ ] All data points have sources cited
- [ ] Analysis frameworks are properly applied
- [ ] Recommendations are actionable and prioritized
- [ ] No orphaned figures or tables
- [ ] Table of contents, list of figures, list of tables are accurate
- [ ] Bibliography is complete
- [ ] PDF renders without errors

**Step 11: Peer Review**

Use the peer-review skill to evaluate the report:

- Assess comprehensiveness
- Verify data accuracy
- Check logical flow
- Evaluate recommendation quality

---

## Integration with Other Skills

This skill works synergistically with:

- **research-lookup**: Essential for gathering market data, statistics, and
  competitive intelligence
- **scientific-schematics**: Generate all diagrams, charts, and visualizations
- **generate-image**: Create infographics and conceptual illustrations
- **peer-review**: Evaluate report quality and completeness
- **citation-management**: Manage BibTeX references

---

## Resources

### Reference Files

Load these files for detailed guidance:

- **`references/report_structure_guide.md`**: Detailed section-by-section
  content requirements
- **`references/visual_generation_guide.md`**: Complete prompts for generating
  all visual types
- **`references/data_analysis_patterns.md`**: Templates for Porter's, PESTLE,
  SWOT, etc.

### Assets

- **`assets/market_research.sty`**: LaTeX style package
- **`assets/market_report_template.tex`**: Complete LaTeX template
- **`assets/FORMATTING_GUIDE.md`**: Quick reference for box environments and
  styling

### Scripts

- **`scripts/generate_market_visuals.py`**: Batch generate all report visuals

---

## Troubleshooting

### Common Issues

**Problem**: Report is under 50 pages

- **Solution**: Expand data tables in appendices, add more detailed company
  profiles, include additional regional breakdowns

**Problem**: Visuals not rendering

- **Solution**: Check file paths in LaTeX, ensure images are in figures/ folder,
  verify file extensions

**Problem**: Bibliography missing entries

- **Solution**: Run bibtex after first xelatex pass, check .bib file for syntax
  errors

**Problem**: Table/figure overflow

- **Solution**: Use `\resizebox` or `adjustbox` package, reduce image width
  percentage

**Problem**: Poor visual quality from generation

- **Solution**: Use `--doc-type report` flag, increase iterations with
  `--iterations 5`

---

Use this skill to create comprehensive, visually-rich market research reports
that rival top consulting firm deliverables. The combination of deep research,
structured frameworks, and extensive visualization produces documents that
inform strategic decisions and demonstrate analytical rigor.

---

## Version History

| Version | Date       | Description            |
| ------- | ---------- | ---------------------- |
| 1.0     | 2026-02-25 | Initial implementation |
