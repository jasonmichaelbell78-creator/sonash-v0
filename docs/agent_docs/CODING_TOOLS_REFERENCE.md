# Coding Tools Reference

<!-- prettier-ignore-start -->
**Document Version:** 1.0
**Last Updated:** 2026-04-12
**Status:** ACTIVE
<!-- prettier-ignore-end -->

Detailed tool preferences and code navigation guidance. Referenced from
CLAUDE.md Section 6.

---

## Code Navigation (LSP)

Native LSP is configured via `.lsp.json` (typescript-language-server). **Prefer
LSP tools over Grep for symbol lookups:**

- **Go-to-definition, find-references, rename** → Use LSP
- **Text/pattern search, regex matching** → Use Grep
- Do NOT use Grep to find class definitions, function implementations, or type
  declarations when LSP can resolve them directly

## CLI Tool Preferences

When these tools are available (checked at session start via tool manifest),
prefer them over defaults in Bash commands:

| Available Tool | Use Instead Of | When                                            |
| -------------- | -------------- | ----------------------------------------------- |
| `bat`          | `cat`          | Displaying file contents in Bash                |
| `fd`           | `find`         | File finding (Glob tool still preferred direct) |
| `eza`          | `ls`           | Directory listings in Bash                      |
| `difft`        | `diff`         | Structural code diffs                           |
| `yq`           | manual parsing | YAML/XML/CSV processing                         |
| `gron`         | —              | Exploring unknown JSON structures               |
| `htmlq`        | —              | HTML content extraction in Bash pipes           |

Tools configured automatically (no action needed): `delta` (git pager),
`starship` (prompt), `zoxide` (smart cd), `rg` (already used by Grep tool).

Interactive tools (suggest to user when appropriate): `lazygit`, `yazi`, `fzf`.
