# Deep Read: iawia002/lux

**Analyzed:** 2026-04-12 | **Depth:** Standard

## Internal Artifacts Found and Read

### Primary Documentation

1. **README.md** (692 lines) -- Installation (7 methods: go install, Homebrew,
   Arch, Void, Scoop, Chocolatey, Cask), getting started (13 subsections),
   options reference (60+ flags), supported sites table (46 sites with
   capability matrix), known issues.
2. **CONTRIBUTING.md** (23 lines) -- Minimal: gofmt, linter, go build. No
   extractor dev guide.
3. **Issue templates** -- can-not-download-video.md, support-a-new-website.md.

### CI/CD Infrastructure (49 workflows)

4. **ci.yml** -- Main CI: golangci-lint + go test -race -coverpkg + Codecov
   upload. Ubuntu + macOS, Go 1.24. Weekly schedule.
5. **builder.yml** -- 26-platform build matrix
   (linux/windows/darwin/freebsd/openbsd/dragonfly x amd64/386/arm/arm64/mips).
6. **goreleaser.yml** -- Release automation with static binaries
   (CGO_ENABLED=0), version injection.
7. **45 stream\_\*.yml** -- Per-extractor test workflows (auto-generated via
   script/generate_github_action_template.js). Each extractor has its own CI
   badge.
8. **.golangci.yml** -- 13 linters configured (bodyclose, errcheck, goconst,
   gofmt, goimports, gosimple, govet, ineffassign, misspell, nilerr,
   staticcheck, typecheck, unconvert, unparam, unused, whitespace).

### Code Architecture (key files read)

9. **extractors/extractors.go** -- Central registry: thread-safe map with
   Register(domain, Extractor), domain routing, universal fallback.
10. **app/register.go** -- Blank imports trigger init() registration for all 46
    extractors.
11. **test/utils.go** -- Custom test harness: Args, CheckData(), Check(),
    CheckError() helpers.
12. **request/request.go** -- Shared HTTP client with cookie handling, retry,
    user-agent spoofing, compression.

### No Architecture Documentation

- No architecture.md, no design docs, no data flow diagrams
- No extractor development guide (biggest gap for a plugin-based project)
- Plugin pattern discoverable only from reading code

## Knowledge Not Visible From Code Alone

1. **init()-based plugin registration** -- Elegant Go pattern: each extractor
   registers itself in init(), blank imports in register.go trigger loading.
   Zero boilerplate. Compile-time discovery.
2. **Per-site CI monitoring** -- 45 individual workflows mean each extractor has
   its own CI badge. Breakage in youtube extractor is visible independently from
   bilibili.
3. **Live API test dependency** -- Tests hit real video site APIs. Many fail
   with 404s on tested URLs. No mocks, no fixtures. Fragile but real.
4. **Auto-generated workflows** -- script/generate_github_action_template.js
   generates the 45 per-site workflows from a template. Meta-tooling for CI.
5. **Static binary releases** -- CGO_ENABLED=0 with -trimpath and debug symbol
   stripping. Truly portable binaries across 26 platforms.

## Referenced External Resources

- Codecov.io integration (coverage)
- Go Report Card (code quality)
- GoReleaser (release automation)
- urfave/cli (CLI framework)
- goquery (HTML parsing)
- goja (JavaScript execution for site extraction)
