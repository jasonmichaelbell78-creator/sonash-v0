# Verifier V2c -- Claims C-063 through C-070

**Phase:** 2.5 Post-Search Verification **Date:** 2026-04-07 **Verifier:**
claude-sonnet-4-6 **Scope:** Risk and architecture claims from claims.jsonl
lines 63-70

---

## Per-Claim Verdict Table

| Claim ID | Verdict  | Confidence | Method         | Notes                                                               |
| -------- | -------- | ---------- | -------------- | ------------------------------------------------------------------- |
| C-063    | VERIFIED | HIGH       | web            | Python+LLM API+Neo4j/Docker all confirmed                           |
| C-064    | VERIFIED | HIGH       | web            | 3 forks: LadybugDB, Vela-Engineering, Kineviz/bighorn               |
| C-065    | VERIFIED | HIGH       | web            | v0.1.9 pre-v1; solo maintainer; Windows DLL issues in open issues   |
| C-066    | VERIFIED | HIGH       | web            | AGPL v3 confirmed; legal interpretation accurate                    |
| C-067    | VERIFIED | MEDIUM     | web            | Single founder confirmed; funding unconfirmed (absence of evidence) |
| C-068    | VERIFIED | HIGH       | filesystem+web | D6-1-graphiti-schema.md:83 + S2-design-patterns.md:554 confirm      |
| C-069    | VERIFIED | MEDIUM     | web            | 30-50x within 10-100x documented range                              |
| C-070    | VERIFIED | MEDIUM     | web            | Dendron PMF failure confirmed; lesson is interpretive               |
