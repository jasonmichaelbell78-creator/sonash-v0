# Gap Research: Cursor Memory Removal + Tool Negative Evidence

**Research date:** 2026-03-31 **Confidence:** HIGH (G1), MEDIUM-HIGH (G7)
**Sources:** Cursor forums, GitHub APIs, project issue trackers, web search

---

## G1: Cursor Memories — Ship, Test, Remove

### Timeline

| Date     | Version | Event                                                                                                                     |
| -------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| May 2025 | 0.51    | Memories announced as beta feature                                                                                        |
| Jun 2025 | 1.0     | Memories shipped — beta toggle in Settings > Rules                                                                        |
| Jul 2025 | 1.2     | Memories reached GA; improved generation quality, added user approval for background-generated memories                   |
| Nov 2025 | 2.1     | **Memories intentionally removed** alongside Custom Modes                                                                 |
| Jan 2026 | 2.1.x   | Confirmed permanent: "The Memories feature was intentionally removed starting from version 2.1.x" (Cursor staff: deanrie) |
| Mar 2026 | current | Still removed; old memories still haunt agents if not manually cleared                                                    |

**Lifespan: ~5 months from beta to removal. ~3 months at GA.**

### Why It Was Removed (Reconstructed)

No official post-mortem exists. Cursor staff provided only terse confirmations
("Custom modes are being removed in 2.1" -- condor). The reasons must be
reconstructed from converging evidence:

**1. Privacy mode incompatibility (structural blocker)** Memories required
Privacy Mode to be OFF. Cursor's justification (staff: Dan Perks): "knowledge
about your codebase can end up in these memories, and we want to ensure that
there is no possible vector for information about sensitive codebases to be
stored in the training data." This was an irreconcilable tension -- enterprise
users who needed privacy mode (the majority of paying customers) could not use
Memories at all. Users repeatedly pointed out that local-first MCP servers
(Mem0/OpenMemory, etc.) solve this without requiring code sharing.

**2. Functional redundancy with Rules** Staff stated memories were "almost no
different than .mdc files." The migration path was explicit: export memories via
Cmd+Shift+P > "Export memories" > save to .mdc > convert to Rules. Rules are
version-controlled, team-shareable, and work in all privacy modes. The feature
was consolidated, not abandoned.

**3. Quality/reliability problems pre-removal** Even before 2.1, the feature was
unstable:

- Memories deleted on window reload (losing 30+ saved items)
- Memories toggle not updating in UI
- "Cursor memory doesn't longer work" reports
- 73% of manual memories reportedly auto-converted to temporary context that
  vanished after 24 hours (per user reports)

**4. Architectural simplification for agents** Version 2.1 also introduced
Commands as a replacement for Custom Modes. The pattern suggests Cursor
consolidated from three persistence mechanisms (Memories + Custom Modes + Rules)
to one (Rules + Commands). This reduces the surface area for bugs and the
cognitive overhead for users.

### User Impact

Community response was overwhelmingly negative:

- Power users reported workflow breakage, some switching to competing IDEs
- Users who built "competitive advantage" memory collections lost access
- Old memories persist as phantom context -- agents still reference them, but
  there is no UI to manage or delete them without downgrading to v2.0.77
- The "Can't clear memories" bug report (forum thread #148254) remains active in
  March 2026

### Implications for Multi-Layer Memory Design

This is the single strongest market signal in the research:

1. **Server-side memory with privacy trade-offs will fail.** Enterprise adoption
   requires local-first storage. Any system that routes memory through a remote
   server or requires disabling privacy guarantees will face the same backlash.

2. **Auto-generated memories without user approval erode trust.** Cursor 1.2
   added approval workflows for background memories, but by then damage was
   done. Memory writes must be explicit and auditable from day one.

3. **Memory must survive version upgrades.** Cursor's removal stranded user
   data. Memory stored in version-controlled files (like .claude/memory/) is
   inherently more durable than opaque internal databases.

4. **Consolidation toward rules-files is the industry direction.** Both Cursor
   (Rules/.mdc) and Claude Code (CLAUDE.md) converge on version-controlled
   instruction files as the persistence layer. Memories that augment rather than
   replace this pattern have a better survival path.

5. **5 months is not enough validation.** A feature that ships, reaches GA, and
   dies in one quarter was either insufficiently planned or hit a structural
   constraint (privacy mode incompatibility) that should have been caught
   pre-ship.

---

## G7: Tool Negative Evidence

### codebase-memory-mcp (DeusData)

**Repository stats (live, 2026-03-31):**

- Stars: 1,105 | Forks: 130 | License: MIT
- Created: 2026-02-24 (5 weeks old)
- Last push: 2026-03-31
- Latest release: v0.5.7 (2026-03-26)
- Open issues: 49 (GitHub count, includes PRs); 12 pure issues (excl. PRs)
- Closed issues: 30+
- Language: C (single static binary, zero dependencies)

**Known failures and bugs (open):**

| #   | Title                                                                  | Severity      |
| --- | ---------------------------------------------------------------------- | ------------- |
| 187 | SQLite writer crashes on oversized cells during indexing               | crash         |
| 185 | Process remains running after VS Code exit                             | resource leak |
| 182 | Cannot install on AlmaLinux 9.7                                        | platform      |
| 180 | ES/TS module specifiers produce zero IMPORTS edges                     | parsing       |
| 178 | Nested .gitignore patterns not respected during indexing               | correctness   |
| 169 | Layout endpoint O(n\*e) edge mapping causes timeouts on large projects | perf          |
| 159 | cbm_find_cli() fails on Windows: wrong PATH delimiter                  | Windows       |
| 158 | install -y writes wrong binary path on Windows                         | Windows       |
| 154 | Database location not configurable, global only                        | architecture  |
| 142 | Update command re-downloads even when on latest version                | UX            |
| 188 | PreToolUse hook blocks Read/Grep on non-code files                     | integration   |

**Index size concerns:**

- Default auto-index limit: 50,000 files
- Linux kernel (28M LOC, 75K files): 3 minutes to index
- AOSP-scale repos: crash reported (#141, now closed but indicates ceiling)
- Database stored at `~/.cache/codebase-memory-mcp/` -- not configurable (#154)
- v0.5.7 fixed a bug where the watcher opened every indexed project's DB on
  startup, causing OOM on machines with many projects

**Windows-specific issues:**

- Two open bugs (#158, #159) for Windows PATH and binary installation
- SmartScreen warnings on unsigned binaries (documented workaround)
- v0.5.7 release notes include fixes for Windows indexing failures and
  path-with-spaces handling, indicating recent instability on that platform

**Concurrency bug (fixed in v0.5.7):** Three threads (MCP handler, autoindex,
watcher) could corrupt the database through improper file operations. Fixed by
eliminating unsafe `rename()` operations. This was a data-loss risk in all
versions before v0.5.7.

**Assessment:** The project is 5 weeks old and iterating fast (v0.4.8 to v0.5.7
in 2 weeks). It shows strong engineering (soak testing, VirusTotal scanning,
SLSA provenance), but the issue velocity indicates it has not yet stabilized.
Windows support is a known weak point. The Cypher query subset limitation (no
WITH, COLLECT, OPTIONAL MATCH, mutations) constrains advanced graph queries. For
this project's needs (SoNash, Windows primary), adoption risk is MODERATE --
wait for v0.6+ and confirm Windows issues are resolved.

---

### Engram (Gentleman-Programming)

**Repository stats (live, 2026-03-31):**

- Stars: 2,113 | Forks: 222 | License: MIT
- Created: 2026-02-16 (6 weeks old)
- Last push: 2026-03-30
- Latest release: v1.11.0 (2026-03-30)
- Open issues: 30 (GitHub count); 26 pure issues (excl. PRs)
- Closed issues: 30+
- Language: Go (single binary, SQLite + FTS5, zero dependencies)

**Known failures and bugs (open):**

| #   | Title                                                          | Severity    |
| --- | -------------------------------------------------------------- | ----------- |
| 132 | mem_save via MCP saves empty observations (parameter mismatch) | data loss   |
| 131 | UserPromptSubmit hook fails when Windows username has spaces   | Windows     |
| 128 | Sub-agents enter infinite loop of session lifecycle calls      | perf/hang   |
| 125 | Intermittent SQLITE_BUSY / database is locked on writes        | concurrency |
| 122 | normalizeScope() silently drops 'global' scope                 | data loss   |
| 99  | FTS5 trigram tokenizer causes SQL logic error on UPDATE/DELETE | crash       |
| 93  | Windows binary flagged as malware by Defender (false positive) | Windows     |
| 88  | --help output shows wrong configuration example                | UX          |
| 48  | Session end lifecycle missing for OpenCode, Gemini CLI, Codex  | integration |

**Windows-specific issues:**

- **Antivirus false positives** (#93): Windows Defender, ESET, and Brave flag
  the prebuilt binary as Trojan:Script/Wacatac.H!ml. Workaround: `go install`
  from source. This is a significant adoption barrier for non-technical users.
- **Path with spaces** (#131): Hook fails when Windows username contains spaces
  (extremely common on Windows consumer installations).
- v1.10.3 fixed MCP process resolution on Windows, indicating earlier versions
  had startup failures.

**Concurrency / scale concerns:**

- SQLITE_BUSY (#125) is an inherent SQLite limitation under concurrent writes.
  Engram uses a single SQLite file per install. Multiple Claude Code sessions
  writing simultaneously will hit this. A separate developer built a WAL-mode
  fork to address this, suggesting the mainline does not yet use WAL.
- Pre-filtered retrieval caps embedding scans at 500 candidates (configurable),
  but no published benchmarks for databases with 10K+ memories.
- Sub-agent infinite loop (#128) means Engram can cause runaway API costs when
  used with agent orchestration systems.

**Data integrity concerns:**

- mem_save parameter mismatch (#132) means memories can be silently empty -- the
  most dangerous kind of bug (writes succeed but store nothing).
- normalizeScope drops 'global' scope (#122) -- global observations cannot be
  created or updated, silently failing.
- Project name drift (#136, fixed in v1.11.0) caused duplicate entries for the
  same project under different names.

**Assessment:** Engram is 6 weeks old, more popular than codebase-memory-mcp (2x
stars), and iterates even faster (50+ releases). The Go binary + SQLite
architecture is sound for single-user local-first use. However, three issues are
blockers for this project:

1. **Windows antivirus false positives** make installation friction high.
   Recommending `go install` as a workaround requires Go toolchain on the
   machine.
2. **SQLITE_BUSY under concurrent sessions** is a design-level issue, not a bug.
   Multi-session Claude Code workflows will trigger this.
3. **Silent data loss** (empty saves, dropped scopes) means you cannot trust
   that what you wrote was actually stored.

Adoption risk is MODERATE-HIGH for production use today. Wait for SQLITE_BUSY
fix (WAL mode adoption), Windows false-positive resolution, and mem_save
parameter fix before recommending.

---

## Summary: Risk Matrix

| Factor          | codebase-memory-mcp           | Engram                             |
| --------------- | ----------------------------- | ---------------------------------- |
| Project age     | 5 weeks                       | 6 weeks                            |
| Maturity        | Pre-stable (v0.5.x)           | Pre-stable (v1.11.x)               |
| Windows support | 2 open bugs, SmartScreen      | AV false positive, path-spaces bug |
| Data integrity  | DB corruption fixed in v0.5.7 | Silent empty saves, scope drops    |
| Concurrency     | Fixed in v0.5.7               | SQLITE_BUSY still open             |
| Scale ceiling   | AOSP crash, 50K file default  | No published benchmarks >500       |
| Adoption risk   | MODERATE                      | MODERATE-HIGH                      |
| Recommendation  | Wait for v0.6+                | Wait for WAL + mem_save fix        |

Both tools are promising but neither is production-ready for a Windows-primary,
multi-session workflow. The original research recommendation to adopt these
tools was based on pitch-deck analysis. Real-world evidence shows both carry
material risks that must be mitigated before integration.
