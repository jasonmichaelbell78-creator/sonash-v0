---
name: reference_documentation_standards
description: Documentation format rules — headers, version tables, index generation, eval regex
type: reference
status: active
---
- Doc header: prettier-ignore-start block with Version/Date/Status
- Version history table at bottom of major docs
- DOCUMENTATION_INDEX.md auto-generated via `npm run docs:index`
- Eval template regex: use `/## .*Prompt/` not strict match (headers vary widely)
- Markdown: CommonMark, no emojis unless user requests
