# Deep Read — Y2Z/monolith

**Read on:** 2026-04-18 · **Depth:** standard · **Repo version:** 2.11.0

## Artifacts scanned

| Artifact | Read? | Knowledge not in code |
|---|---|---|
| README.md (293 lines, 29 sections) | Yes | Full value proposition, 18 install channels, CLI examples covering whitelisting/authentication/proxies/Apify, design intent ("gazillion tabs → gazillion .html files") |
| Cargo.toml | Yes | Author list (6 maintainers), dep pinning strategy (strict `=` versions), optional `gui` feature flag, crate categories (`command-line-utilities`, `web-programming`) |
| Cargo.lock (361 entries) | Metadata only | Full resolved dep tree — supply-chain surface |
| Makefile | Yes | Build / install / test / lint / format targets for both CLI and GUI binaries |
| Dockerfile | Yes | Multi-stage build (musl-rust builder → alpine runtime), supply-chain caveat: downloads latest release via unpinned `curl → api.github.com/releases/latest` |
| .github/workflows/ (6 workflows) | Yes | CI matrix: ubuntu/macos/windows + netbsd + CD. Format + test + build gated per PR. Clean path-ignore for docs-only changes. |
| src/*.rs (11 modules) | Structure only | Domain decomposition: main/lib/core + cache/cookies/css/gui/html/js/session/url |
| tests/ (50 files, 8 domains) | Structure only | Per-module mirroring: tests/{cli,core,html,css,js,cookies,url,session} + `_data_/` fixtures. CLI tests include base_url, basic, data_url, local_files, noscript, unusual_encodings. |
| assets/icon/ | Listed | Icon asset only — minor |
| dist/run-in-container.sh | Yes | Docker invocation helper — distribution polish |
| snap/snapcraft.yaml | Yes | Snap packaging config — one of many packaging formats |
| monolith.nuspec | Yes | Chocolatey package spec |
| LICENSE (CC0-1.0) | Yes | Public domain dedication — unusual for tools, zero-friction adoption/extraction |
| No CONTRIBUTING.md | Absent | — |
| No SECURITY.md | Absent | — |
| No CODE_OF_CONDUCT.md | Absent | — |
| No docs/ | Absent | All docs live in README — mono-doc pattern |

## Key insights not visible from code alone

1. **Packaging as a first-class concern.** 18 distinct install channels (Cargo, Homebrew, Chocolatey, Scoop, Winget, MacPorts, Snapcraft, Guix, Nix, Flox, Pacman, aports, XBPS, FreeBSD pkg/ports, pkgsrc, Docker, pre-built binaries). The maintainer treats "reach" as a product dimension.
2. **Strict dependency pinning.** `Cargo.toml` uses `=X.Y.Z` for every dep — reproducibility > auto-upgrade. Contrasts with typical `^X.Y` / `~X.Y`. Design statement about supply-chain predictability.
3. **CC0-1.0 license.** Public-domain dedication — zero friction for extraction, forking, or embedding. Rare for production tooling; signals "take it, improve it, don't ask."
4. **Six maintainers, not a solo project.** Cargo.toml authors list reveals a distributed maintainer set behind what looks like a solo tool.
5. **Monolithic README philosophy.** No docs/ tree. Everything in README: install, usage, options, whitelist/blacklist, dynamic content, authentication, proxies, Apify, contributing, license. Demonstrates "one document, searchable, forkable" style.
6. **NetBSD-class portability.** Dedicated `ci-netbsd.yml` signals portability discipline beyond the Big Three.
7. **Docker supply-chain weakness** — the Dockerfile fetches `releases/latest` via unpinned curl, so any Docker rebuild produces a different binary. Tension with the strict Cargo pinning inside.

## Referenced external resources (catalog for Phase 3.5)

None: this is an application repo with README pointing to package registries and install docs only. No research papers, linked datasets, or tutorials. Content Eval will be minimal (package registry links only).
