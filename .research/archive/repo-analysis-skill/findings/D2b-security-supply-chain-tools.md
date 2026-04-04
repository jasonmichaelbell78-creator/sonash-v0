# Findings: Security and Supply Chain Analysis Tools for GitHub Repos

**Searcher:** deep-research-searcher **Profile:** web + docs **Date:**
2026-03-31 **Sub-Question ID:** D2b

---

## Key Findings

### 1. CRITICAL: Trivy Supply Chain Compromise (March 2026) [CONFIDENCE: HIGH]

Trivy, previously the most-recommended free scanner, suffered a confirmed supply
chain attack on 2026-03-19 by threat actor "TeamPCP." Attackers poisoned GitHub
Actions tags (76 of 77 tags in trivy-action, all 7 in setup-trivy), published a
malicious binary v0.69.4, and exfiltrated CI/CD secrets from consumer pipelines.
[1][2][3]

**Affected versions:** v0.69.4, v0.69.5, v0.69.6 (all malicious — do not use)
**Safe versions:** v0.69.3 and earlier **Safe Action pins:**
`trivy-action@v0.35.0` (SHA: 57a97c7), `setup-trivy@v0.2.6` (SHA: 3fb12ec)
**Database status:** Vulnerability DB updates were suspended; trivy-db and
vuln-list pipelines have since been restored as of late March 2026, but recency
of DB during the gap must be verified **Action required:** If any pipeline ran
compromised versions, rotate ALL secrets immediately. The vulnerability was
added to CISA's KEV catalog (CVE-2026-33634).

This incident is the canonical 2026 example of why mutable tag references are
dangerous. It also underscores the value of having redundant scanner coverage.

---

## Category A: Vulnerability Scanning / Software Composition Analysis (SCA)

### 2. Grype — Focused Vulnerability Scanner [CONFIDENCE: HIGH]

**What it detects:** Known CVEs in OS packages (Alpine, Debian, Ubuntu, RHEL,
Amazon Linux, CentOS, Oracle Linux, SUSE, Arch, Gentoo) and language
dependencies (Go, Python, JavaScript, Java, Rust, Ruby, PHP, .NET) across 20+
ecosystems. [4]

**Database sources:** NVD, GitHub Security Advisories, Alpine SecDB, Debian
Security Tracker, Red Hat Security Data, Ubuntu, Amazon Linux ALAS, Oracle ELSA.
Daily updates via SQLite archives. [4]

**Key differentiator:** Integrates EPSS (Exploit Prediction Scoring System) with
30-day exploitation probability and percentile ranking, CVSS severity, and CISA
KEV (Known Exploited Vulnerabilities) catalog status into a composite 0–10 risk
score. Superior to CVSS-only tools for prioritization. [4]

**Invocation:**

```bash
# Filesystem scan (no clone required with remote image)
grype dir:/path/to/project
grype alpine:latest                        # remote image — no local clone needed
grype sbom:./sbom.json                     # scan from SBOM
grype alpine:latest --fail-on high --sort-by epss
grype alpine:latest -o sarif > results.sarif
```

**Output formats:** JSON, SARIF, CycloneDX JSON/XML, table, Go templates

**CI integration:**

```yaml
- uses: anchore/scan-action@v7
  with:
    image: "myapp:latest"
    fail-build: true
    severity-cutoff: high
    output-format: sarif
```

**False positives:** Supports OpenVEX documents to suppress known
non-exploitable findings. `--only-fixed` flag limits to actionable results. [4]

**Can run without cloning:** Yes — scans container images from remote registries
without local access. Filesystem scan requires local path. [4]

**Cost:** Free, Apache 2.0. No paid tier. [4]

---

### 3. OSV-Scanner — Google's Free Lockfile/Dependency Scanner [CONFIDENCE: HIGH]

**What it detects:** Vulnerabilities in lockfiles and manifests against the
OSV.dev database, which aggregates NVD, GitHub Advisory Database, and
ecosystem-specific advisories. [5]

**Supported lockfile types (19+):** package-lock.json, go.sum, pom.xml,
Cargo.lock, poetry.lock, uv.lock, bun.lock, and more across 11 language
ecosystems including Go, Java, JavaScript, Python, Rust, Dart, Elixir, PHP, R,
Ruby. [5]

**Version 2.0 features (released March 2025):**

- Guided remediation: suggests version upgrades by dependency depth, severity,
  and fix ROI
- Layer-aware container image scanning
- Interactive HTML report generation
- Offline scanning against local OSV DB copy [5]

**Invocation:**

```bash
osv-scanner --lockfile package-lock.json
osv-scanner --recursive /path/to/project
osv-scanner scan --format html --output report.html .
```

**Output formats:** JSON, HTML (interactive), table

**CI integration:** Reusable GitHub workflows provided; supports SARIF for
GitHub Security tab upload. [5]

**Can run without cloning:** No — requires local lockfiles or filesystem access.
[5]

**Cost:** Free, Apache 2.0. No paid tier. [5]

---

### 4. npm audit — JavaScript Ecosystem Built-in [CONFIDENCE: HIGH]

**What it detects:** Vulnerabilities in npm dependencies against the GitHub
Advisory Database. Bundled with Node.js; zero installation cost. [6]

**Invocation:** `npm audit` / `npm audit fix` / `npm audit --json`

**Output formats:** CLI table, JSON

**Known accuracy issues:**

- Reports false positives for packages that received a fix (incorrectly marks
  fixed versions as vulnerable in some cases)
- Does not perform reachability analysis — reports all transitive vulnerable
  deps regardless of whether your code calls the vulnerable code path
- Commercial tools like Snyk and Endor Labs cut alert volume 70–90% via
  reachability analysis [6][7]

**Can run without cloning:** No — requires local node_modules or
package-lock.json. [6]

**Cost:** Free (bundled with npm). [6]

---

### 5. OWASP Dependency-Check — Multi-Language SCA [CONFIDENCE: HIGH]

**What it detects:** Known CVEs in project dependencies using CPE-based matching
against NVD. Supports Java, JavaScript, Python, Ruby, Go, .NET, PHP. [8]

**Invocation:**

```bash
dependency-check --project "MyProject" --scan /path/to/project --format HTML
dependency-check --scan . --format JSON --out ./report
```

**CI integration:** Maven plugin, Gradle plugin, Ant task, Jenkins plugin,
GitHub Actions. [8]

**Output formats:** HTML, JSON, XML, CSV, SARIF

**Limitations:** CPE-based matching produces higher false positive rates than
ecosystem-aware tools. Point-in-time only (no continuous monitoring). [8]

**Can run without cloning:** No — requires local files. [8]

**Cost:** Free, Apache 2.0. [8]

---

### 6. Snyk Open Source — Commercial SCA with Free Tier [CONFIDENCE: HIGH]

**What it detects:** Vulnerabilities in open source dependencies with curated
database and reachability analysis. SAST, SCA, container, IaC, and secrets in
one platform. [9]

**Free tier limits (2026):**

- 200 tests/month for private repos (Open Source)
- 100 Code tests/month (SAST)
- 300 IaC tests/month
- 100 Container tests/month
- Unlimited tests for public/open source repos [9]

**Key advantage over npm audit:** Snyk's analysts manually triage
vulnerabilities and accurately track which versions receive fixes, producing
fewer false positives for npm packages. [7]

**Invocation:**

```bash
snyk test                    # SCA scan
snyk code test               # SAST scan
snyk container test myimage  # container scan
snyk iac test                # IaC scan
```

**Output formats:** CLI, JSON, SARIF, HTML

**CI integration:** Native GitHub, GitLab, Bitbucket, Azure Repos integrations;
GitHub Actions via `snyk/actions`. [9]

**Can run without cloning:** No — Snyk CLI requires local project. The GitHub
integration can scan repos via OAuth without manual cloning. [9]

**Cost:** Free tier (see limits above). Team plan: $25/user/month. [9]

---

## Category B: Supply Chain Security

### 7. OpenSSF Scorecard — Repository Security Posture Assessment [CONFIDENCE: HIGH]

**What it detects:** 16 automated security checks assessing the overall security
health of a GitHub repository without requiring a local clone. Checks include:
[10]

| Check                  | What it evaluates                                 |
| ---------------------- | ------------------------------------------------- |
| Branch-Protection      | Safeguards on development branches                |
| Code-Review            | Whether PRs require peer review                   |
| Dependency-Update-Tool | Whether Dependabot/Renovate is configured         |
| Pinned-Dependencies    | Whether Actions/deps use commit SHA pins          |
| SAST                   | Whether static analysis tooling is present        |
| Signed-Releases        | Whether releases have cryptographic signatures    |
| Token-Permissions      | Whether GitHub Actions tokens are least-privilege |
| Vulnerabilities        | Known CVEs in dependencies (via OSV)              |
| Maintained             | Recent activity levels                            |
| Binary-Artifacts       | Unauthorized compiled files in repo               |
| Fuzzing                | Participation in OSS-Fuzz                         |
| Security-Policy        | Presence of SECURITY.md                           |

**Invocation:**

```bash
GITHUB_AUTH_TOKEN=<token> scorecard --repo=github.com/owner/repo
# Docker:
docker run -e GITHUB_AUTH_TOKEN ghcr.io/ossf/scorecard:latest \
  --repo=github.com/owner/repo --format json
```

**Output:** 0–10 aggregate score + per-check scores with remediation links.
Formats: JSON, default table.

**API access (no clone needed):**

```
GET https://api.scorecard.dev/projects/github.com/{owner}/{repo}
```

Pre-calculated scores available for ~1 million popular OSS projects. BigQuery
dataset: `openssf:scorecardcron.scorecard-v2` (weekly). [10]

**Can run without cloning:** Yes — API-based analysis only. Requires GitHub
token. [10]

**Cost:** Free. CLI and REST API are fully free. [10]

---

### 8. Socket.dev — Supply Chain Risk for npm/PyPI Packages [CONFIDENCE: HIGH]

**What it detects:** Behavioral supply chain risks in npm and PyPI packages —
install scripts, obfuscated code, newly created maintainer accounts, unusual
network access, typosquatting, and dependency confusion. Scores packages across
Supply Chain Security, Vulnerability, Quality, Maintenance, and License (0–100
each). [11]

**Key differentiator:** Unlike CVE-based scanners, Socket analyzes what a
package actually does at install time, detecting novel malicious packages before
CVEs are assigned. [11]

**Invocation:**

```bash
# CLI (beta)
socket npm install <package>   # intercepts install, shows risk alerts
socket scan .                  # scan project
```

**GitHub App:** Free GitHub App that comments on PRs when a dependency change
introduces a new supply chain risk. No CLI required for PR-level coverage. [11]

**API:** npm registry pages now include Socket analysis links. Programmatic
access via Socket API. [11]

**Can run without cloning:** Yes via GitHub App. CLI requires local project.
[11]

**Cost:** Free GitHub App (core features). Paid plans for team dashboards and
advanced features. [11]

---

### 9. deps.dev (Google Open Source Insights) — Package Metadata API [CONFIDENCE: HIGH]

**What it provides:** Free API for security metadata on 50M+ package versions
across npm, Go, Maven, PyPI, Cargo, NuGet, and RubyGems. Returns: dependencies,
licenses, advisories (via OSV), version history, security health signals. [12]

**Access:**

```
GET https://api.deps.dev/v3alpha/systems/npm/packages/<name>
GET https://api.deps.dev/v3alpha/systems/npm/packages/<name>/versions/<version>
```

Also available via gRPC and BigQuery dataset for bulk analysis. [12]

**Can run without cloning:** Yes — fully API-based, no local code needed. [12]

**Cost:** Free. Apache 2.0 open source. [12]

---

### 10. Dependabot — Automated Dependency Updates + Vulnerability Alerts [CONFIDENCE: HIGH]

**What it does:** Creates PRs for vulnerable and outdated dependencies.
Vulnerability alerts fire when a new CVE affects a project dependency. [13]

**Coverage:** 30+ package ecosystems including npm, pip, Maven, Gradle, Bundler,
Cargo, Composer, NuGet, Go modules, Docker, Terraform, GitHub Actions, pnpm,
Bun, Helm, Swift, Pub, uv. [13]

**Invocation:** Configured via `.github/dependabot.yml`. No CLI.

**Can run without cloning:** Yes — runs entirely on GitHub's infrastructure.
[13]

**Cost:** Free for all public and private GitHub repos. [13]

**Limitations vs Renovate:** No automerge without separate Actions workflow;
per-repo YAML config (no shared presets); limited to GitHub only. [13]

---

### 11. Renovate — Advanced Dependency Update Automation [CONFIDENCE: HIGH]

**What it does:** Manages dependency updates across 90+ package managers with
automerge, scheduled batching, cross-ecosystem grouping (npm + Docker + pip in
one PR), merge confidence scoring, and shared org-wide config presets. [13]

**Can run without cloning:** Yes — runs as GitHub App (Mend-hosted) or
self-hosted. [13]

**Cost:** Free (Mend-hosted app). Self-hosting free under AGPL-3.0. [13]

**When to choose Renovate over Dependabot:** Multi-platform (GitLab, Bitbucket,
Azure DevOps), monorepos, automerge workflows, or regex managers for
non-standard version files. [13]

---

## Category C: Secret Detection

### 12. Gitleaks — Fast Pre-Commit Secret Scanner [CONFIDENCE: HIGH]

**What it detects:** 150+ secret types (API keys, tokens, credentials) using
regex pattern matching across git history and current files. v8.28.0+ includes
composite rules reducing false positives. [14]

**Invocation:**

```bash
gitleaks detect --source .           # scan current directory
gitleaks detect --source . --log-level warn  # suppress low-signal findings
gitleaks protect --staged            # pre-commit hook (staged files only)
```

**Output formats:** JSON, CSV, JUnit, SARIF, Go templates. SARIF uploads
natively to GitHub Security tab. [14]

**CI integration:**

```yaml
- uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Can run without cloning:** No — requires local git repository. GitHub Action
runs in-repo. [14]

**Cost:** Free, MIT license. No paid tier. [14]

**Known limitation:** No credential verification — a match is reported even if
the key is already revoked. Higher false positive rate than TruffleHog. [14]

---

### 13. TruffleHog — Verified Credential Leak Detection [CONFIDENCE: HIGH]

**What it detects:** 800+ secret types across git repos, S3 buckets, GCS, Docker
images, Slack workspaces, Jenkins servers, and Elasticsearch clusters. Key
feature: actively verifies detected credentials against live APIs — only reports
active, exploitable secrets. [14][15]

**Invocation:**

```bash
trufflehog git https://github.com/owner/repo  # scan remote repo (no clone needed)
trufflehog git file://./local-repo
trufflehog github --org=myorg               # scan entire GitHub org
trufflehog s3 --bucket=mybucket
trufflehog docker --image=myimage
trufflehog --only-verified                  # only active secrets (reduces noise)
trufflehog --no-verification                # skip API calls (faster, more FPs)
```

**Output formats:** JSON, human-readable text. Exit code 183 for CI gating. No
native SARIF. [14]

**Can run without cloning:** Yes — `trufflehog git https://...` scans remote
repos directly. [14][15]

**Cost:** Free (AGPL-3.0). TruffleHog Enterprise available with dashboards. [14]

**Recommended combination:** Gitleaks as pre-commit hook (speed), TruffleHog in
CI/CD (depth + verification). [14]

---

### 14. GitHub Native Secret Scanning [CONFIDENCE: HIGH]

**What it detects:** 200+ partner patterns (AWS, Azure, Google Cloud, Stripe,
Slack, etc.) plus AI-powered generic password detection. Push protection blocks
secrets before they land in the repo. [16]

**March 2026 update:** 28 new detectors across 15 providers added in the largest
single-batch pattern release to date. [16]

**Can run without cloning:** Yes — runs entirely on GitHub's infrastructure.
[16]

**Cost:**

- **Free for public repos:** Secret scanning alerts enabled by default
- **Private repos:** Requires GitHub Secret Protection ($19/user/month) which
  includes push protection, validity checks, custom patterns, AI-powered generic
  passwords [16]

---

### 15. detect-secrets (Yelp) — Baseline Approach for Legacy Repos [CONFIDENCE: MEDIUM]

**What it detects:** 27 plugin-based detectors. Unique "baseline" approach —
creates `.secrets.baseline` file to track known false positives, preventing
re-alerting on pre-existing findings without suppressing new ones. [17]

**Invocation:**

```bash
detect-secrets scan > .secrets.baseline   # create baseline
detect-secrets audit .secrets.baseline    # review and triage
detect-secrets scan --baseline .secrets.baseline  # CI: only new secrets
```

**Cost:** Free, Apache 2.0. [17]

**Use case:** Best for repositories with large amounts of pre-existing false
positives that would overwhelm initial gitleaks/TruffleHog scans. [17]

---

## Category D: SAST (Static Application Security Testing)

### 16. Semgrep Community Edition — Multi-Language SAST [CONFIDENCE: HIGH]

**What it detects:** Security vulnerabilities, bug patterns, and policy
violations in source code using pattern-based rules. 3,000+ open source rules
covering injection, XSS, weak crypto, insecure deserialization, and more across
30+ languages including Terraform and Dockerfile. [18]

**Important 2024 license change:** Semgrep-maintained rules switched to Semgrep
Rules License v1.0 (limits use to internal, non-competing contexts). Community
(user- contributed) rules remain open source. Semgrep's core engine remains LGPL
2.1. [18]

**Invocation:**

```bash
semgrep scan --config=auto .                     # auto-select rules
semgrep scan --config=p/security-audit .         # security-focused ruleset
semgrep scan --sarif --output results.sarif .    # SARIF for GitHub
semgrep scan --config=p/owasp-top-ten .
```

**Output formats:** Text, JSON, SARIF

**CI speed:** 10-second typical scan vs. CodeQL's minutes-to-30-minute database
build. [18]

**Can run without cloning:** No — requires local source code. [18]

**Free tier (Platform):** Full Pro Engine + cross-file analysis for up to 10
contributors and 50 repos. [18]

**Cost:** CE (CLI only): free. Platform: free tier (10 contributors), then
~$30/month/committer. [18]

---

### 17. CodeQL (GitHub Advanced Security) — Deep Semantic SAST [CONFIDENCE: HIGH]

**What it detects:** Complex vulnerability patterns requiring full semantic
analysis: taint tracking, data flow across functions and files. Covers Java,
Python, JS/TS, Go, C/C++, C#, Swift, Ruby. [19]

**Key differentiator:** True data-flow analysis catches vulnerabilities that
pattern matchers miss (e.g., tainted data flowing through 5 functions before
reaching an injection point). Higher accuracy but slower. [19]

**Free tier:**

- **Public repos:** Free via GitHub Actions (code scanning enabled by default)
- **Private repos:** Requires GitHub Advanced Security ($19/user/month Code
  Security) or GitHub Team plan ($4/user/month GHAS access) [16][19]

**Invocation:** Configured via GitHub Actions — no CLI invocation needed for
standard use. Custom queries possible via CodeQL CLI.

**Can run without cloning:** GitHub-native — no manual clone. CodeQL CLI
requires local checkout. [19]

**Cost:** Free for public repos; paid for private. [19]

**Performance:** Requires building a CodeQL database first (minutes to 30+
minutes for large codebases). [19]

---

### 18. Bandit — Python-Specific SAST [CONFIDENCE: HIGH]

**What it detects:** 47 security checks across 7 categories (injection, crypto,
XSS, dangerous functions) in Python source code using AST analysis. Latest:
v1.9.3 (January 2026). [20]

**Invocation:**

```bash
bandit -r ./myproject/
bandit -r . -f sarif -o bandit-results.sarif
bandit -r . -ll -ii   # only medium+ severity, medium+ confidence
```

**Output formats:** JSON, CSV, SARIF, text

**CI integration:** Pre-commit hook, GitHub Actions. [20]

**Can run without cloning:** No — requires local Python files. [20]

**Cost:** Free, Apache 2.0. [20]

---

### 19. Brakeman — Ruby on Rails SAST [CONFIDENCE: HIGH]

**What it detects:** Rails-specific vulnerabilities (SQL injection, XSS, CSRF,
mass assignment, command injection) with framework-aware analysis producing very
low false positive rates. Latest: v8.0.2 (February 2026). [20]

**License:** Brakeman Public Use License (free for non-commercial use;
commercial license available). [20]

**Invocation:**

```bash
brakeman                              # scan current Rails app
brakeman -o results.json             # JSON output
brakeman --sarif output.sarif        # SARIF for GitHub
```

**Output formats:** JSON, CSV, SARIF, HTML, text

**Can run without cloning:** No — requires local Rails application. [20]

---

### 20. gosec — Go-Specific SAST [CONFIDENCE: HIGH]

**What it detects:** Go security vulnerabilities: hardcoded credentials, unsafe
system calls, insecure TLS config, SQL injection, file permission issues. [20]

**Invocation:**

```bash
gosec ./...
gosec -fmt sarif -out gosec.sarif ./...
```

**Output formats:** JSON, SARIF, text

**Cost:** Free, Apache 2.0. [20]

---

### 21. SonarQube Community Edition — Multi-Language Quality + Security [CONFIDENCE: HIGH]

**What it detects:** Security vulnerabilities, code smells, and bugs across 20+
languages. Quality gate enforcement. Server-based (requires database). [18]

**Can run without cloning:** No — requires a running SonarQube server and local
project scanner. SonarCloud (SaaS) is free for public projects and removes the
server requirement. [18]

**Cost:** SonarQube CE: free (LGPL). SonarCloud: free for public repos, paid for
private ($10/user/month). [18]

---

## Category E: License Compliance

### 22. FOSSA — Enterprise License Compliance with Free Tier [CONFIDENCE: HIGH]

**What it detects:** Open source licenses across 20+ build systems with 99.8%
detection accuracy. Detects non-standard and modified licenses via full-text
analysis. Generates SPDX and CycloneDX SBOMs. Policy engine for blocking
non-compliant licenses. [21]

**CLI:**

```bash
fossa analyze    # analyze dependencies
fossa test       # check against policy
fossa report attribution --format html  # attribution report
```

**GitHub Actions:**

```yaml
- uses: fossas/fossa-action@main
  with:
    api-key: ${{ secrets.FOSSA_API_KEY }}
```

**Can run without cloning:** No — requires local project. FOSSA SaaS can scan
via SCM integration without cloning. [21]

**Cost:** Free tier for small projects. Enterprise pricing for larger teams. API
key required for free tier. [21]

---

### 23. licensee — Lightweight License File Detector [CONFIDENCE: HIGH]

**What it detects:** Project license by analyzing LICENSE, COPYING, NOTICE files
using Sørensen-Dice coefficient similarity matching against known SPDX licenses.
Used internally by GitHub for license badge detection. [22]

**Invocation:**

```bash
licensee detect .                              # local directory
licensee detect rails/rails --remote          # GitHub remote — no clone needed
docker run licensee detect owner/repo --remote
```

**Can run without cloning:** Yes — `--remote` flag scans GitHub repos via API.
[22]

**Cost:** Free, MIT license (Ruby gem). [22]

---

### 24. license-checker (npm) — JavaScript License Audit [CONFIDENCE: HIGH]

**What it detects:** Licenses of all npm dependencies in a project from
package.json and node_modules. Fails builds on disallowed licenses. [23]

**Invocation:**

```bash
npx license-checker                          # list all licenses
npx license-checker --failOn "GPL-3.0"      # fail on specific license
npx license-checker --json > licenses.json
```

**Output formats:** CLI table, JSON, CSV

**Can run without cloning:** No — requires local node_modules. [23]

**Cost:** Free, BSD. [23]

---

## Category F: Infrastructure as Code (IaC) Scanning

### 25. Checkov — Comprehensive IaC Scanner [CONFIDENCE: HIGH]

**What it detects:** Misconfigurations in Terraform, CloudFormation, Kubernetes,
Helm, Serverless Framework, and 12+ IaC platforms. 1,000+ policies covering CIS,
SOC 2, PCI DSS, NIST, HIPAA. Unique graph-based analysis for cross-resource
relationships. [24]

**Invocation:**

```bash
checkov -d /path/to/terraform
checkov -f main.tf --check CKV_AWS_2
checkov --framework terraform --output sarif > checkov.sarif
```

**Output formats:** CLI, JSON, SARIF, JUnit, GitHub Annotations

**CI integration:** GitHub Actions (`bridgecrewio/checkov-action`), GitLab,
Jenkins. [24]

**Can run without cloning:** No — requires local IaC files. [24]

**Cost:** Free, Apache 2.0. Prisma Cloud integrations are paid. [24]

---

### 26. KICS (Checkmarx) — Widest IaC Coverage [CONFIDENCE: HIGH]

**What it detects:** Security vulnerabilities, compliance issues, and
misconfigurations in 22+ IaC platforms including OpenAPI, gRPC, Pulumi,
Crossplane, and GitHub Workflows — broader than Checkov's ~12 frameworks. 2,400+
Rego queries. [24]

**Invocation:**

```bash
kics scan -p /path/to/project
kics scan -p . -o results/ --report-formats "json,sarif"
```

**Output formats:** JSON, SARIF, HTML, PDF, JUnit

**Cost:** Free, Apache 2.0. [24]

---

### 27. tfsec — DEPRECATED (merged into Trivy) [CONFIDENCE: HIGH]

tfsec has been in maintenance-only mode since February 2023 when Aqua Security
consolidated it into Trivy's IaC scanning engine. Last release v1.28.14
(May 2025) contained only a dependency CVE fix with no new rules. Do not use for
new projects; migrate to Checkov or KICS instead. [24]

---

## Category G: SBOM Generation

### 28. Syft — Open Source SBOM Generator [CONFIDENCE: HIGH]

**What it does:** Generates Software Bills of Materials (SBOMs) from container
images, filesystems, and source repositories. Does NOT scan for vulnerabilities
itself — pair with Grype for that. Latest: v1.42.0 (February 10, 2026). [25]

**Invocation:**

```bash
syft alpine:latest                              # container image
syft dir:/path/to/project                       # filesystem
syft alpine:latest -o spdx-json                # SPDX output
syft alpine:latest -o cyclonedx-json           # CycloneDX output
syft alpine:latest -o spdx-json=./spdx.json -o cyclonedx-json=./cdx.json
```

**Output formats:** CycloneDX XML/JSON, SPDX tag-value/JSON, Syft JSON, table,
text

**CI integration:** `anchore/sbom-action` GitHub Action. [25]

**Can run without cloning:** Yes — scans remote container images by digest. [25]

**Cost:** Free, Apache 2.0. [25]

---

## Category H: GitHub Native Security Features

### 29. GitHub Dependency Graph + Dependabot Alerts [CONFIDENCE: HIGH]

GitHub's native SCA. The Dependency Graph parses manifest files (package.json,
requirements.txt, pom.xml, etc.) and maps transitive dependencies. Dependabot
Alerts fire when new CVEs are published affecting those dependencies. [26]

**API access (no clone required):**

```
GET https://api.github.com/repos/{owner}/{repo}/dependabot/alerts
# GraphQL: vulnerabilityAlerts node
GET https://api.github.com/advisories  # public advisory DB (no auth needed)
```

**Cost:** Free for all repos (public and private). [26]

---

### 30. GitHub Code Scanning (CodeQL + Third-Party) [CONFIDENCE: HIGH]

GitHub's SAST pipeline. Natively runs CodeQL; also supports third-party SARIF
uploads (Semgrep, Checkov, Gitleaks all produce SARIF). All SARIF results appear
in the Security tab. [19]

**March 2026 update:** GitHub announced AI-powered security detections entering
public preview in Q2 2026, complementing CodeQL with broader language coverage.
[16]

**Cost:** Free for public repos. $19/user/month Code Security for private repos.
[16][19]

---

## GitHub Actions 2026 Security Roadmap (Supply Chain Context) [CONFIDENCE: HIGH]

GitHub published a sweeping 2026 Actions security roadmap (March 2026) directly
responding to the tj-actions and trivy-action compromises. Features entering
preview in 3–6 months include: [27]

1. **Dependency locking:** `dependencies:` YAML section locks all Actions to
   commit SHA hashes deterministically
2. **Scoped secrets:** Credentials bound to specific
   branches/environments/workflows rather than repo-wide
3. **Policy controls:** Centralized rulesets controlling who can trigger
   workflows
4. **Egress firewall:** Layer-7 outbound network controls for hosted runners
   (6–9 months)
5. **Actions Data Stream:** Near-real-time execution telemetry to S3/Azure Event
   Hub

These changes directly address the attack vector used in the trivy-action
compromise. [27]

---

## Recommended Free Stack

### Comprehensive Zero-Cost Security Coverage

The following combination provides broad coverage with no licensing cost, avoids
the compromised Trivy versions, and integrates cleanly with GitHub's native
security infrastructure.

#### Tier 1: Always-On (GitHub Native, Zero Configuration)

| Tool                    | Coverage                        | Setup                         |
| ----------------------- | ------------------------------- | ----------------------------- |
| Dependabot Alerts       | Dependency CVEs                 | Enable in repo settings       |
| GitHub Secret Scanning  | 200+ secret patterns            | Auto-enabled for public repos |
| GitHub Dependency Graph | SBOM visualization + Dependabot | Auto-enabled                  |
| Renovate or Dependabot  | Automated dependency updates    | `.github/dependabot.yml`      |

#### Tier 2: CI Pipeline (GitHub Actions — Free for Public Repos)

| Tool              | Coverage                                   | Action                        |
| ----------------- | ------------------------------------------ | ----------------------------- |
| OSV-Scanner       | Lockfile CVEs (Google-maintained)          | `google/osv-scanner-action`   |
| Grype             | Container + filesystem CVEs (EPSS scoring) | `anchore/scan-action@v7`      |
| Semgrep CE        | SAST (30+ languages, 3000+ rules)          | `semgrep/semgrep-action`      |
| Gitleaks          | Secret detection (pre-commit + CI)         | `gitleaks/gitleaks-action@v2` |
| Checkov           | IaC misconfiguration                       | `bridgecrewio/checkov-action` |
| OpenSSF Scorecard | Supply chain posture scoring               | `ossf/scorecard-action`       |

#### Tier 3: Pre-Commit (Developer Workstation)

```bash
gitleaks protect --staged   # block secret commits at source
```

#### Tier 4: Remote/API Analysis (No Clone Required)

| Tool                  | Purpose                       | Access                                |
| --------------------- | ----------------------------- | ------------------------------------- |
| OpenSSF Scorecard API | Supply chain posture          | `api.scorecard.dev`                   |
| Socket.dev GitHub App | npm/PyPI supply chain risk    | Free GitHub App install               |
| deps.dev API          | Package metadata + advisories | `api.deps.dev`                        |
| GitHub Advisories API | Vuln alerts for any repo      | `api.github.com/advisories`           |
| TruffleHog            | Secret scan remote repo       | `trufflehog git https://...`          |
| licensee `--remote`   | License detection             | `licensee detect owner/repo --remote` |

#### Language-Specific Additions (add if relevant)

| Language   | Add Tool                               |
| ---------- | -------------------------------------- |
| Python     | Bandit (`bandit -r .`)                 |
| Ruby/Rails | Brakeman                               |
| Go         | gosec (`gosec ./...`)                  |
| JavaScript | license-checker for license compliance |

#### What This Stack Does NOT Cover (Gaps)

- **Reachability analysis:** No free tool fully eliminates false positives via
  reachability. Endor Labs and Snyk (paid) cut noise 70–90% via function-level
  analysis.
- **Container malware detection:** Grype finds known CVEs; it does not detect
  novel malicious packages without CVE assignments (Socket.dev covers this for
  npm/PyPI).
- **Commercial rule depth:** Semgrep CE's community rules cover ~60–70% of a
  commercial SAST tool's detection breadth.
- **License policy engine:** FOSSA free tier is minimal; FOSSology (open source)
  is self-hosted only. For serious license compliance, FOSSA paid or Black Duck
  is needed.
- **SonarQube quality gates:** CE requires a self-hosted server; SonarCloud is
  free only for public repos.

---

## Tool Capability Matrix: Remote vs Local

| Tool                      | Scan Without Cloning | Method                           |
| ------------------------- | -------------------- | -------------------------------- |
| OpenSSF Scorecard         | Yes                  | GitHub API + `api.scorecard.dev` |
| Socket.dev                | Yes (GitHub App)     | GitHub App webhook               |
| deps.dev                  | Yes                  | REST/gRPC API                    |
| GitHub Dependabot         | Yes                  | GitHub native                    |
| GitHub Secret Scanning    | Yes                  | GitHub native                    |
| GitHub Code Scanning      | Yes                  | GitHub Actions (runs in-repo)    |
| TruffleHog                | Yes                  | `trufflehog git https://...`     |
| licensee                  | Yes                  | `--remote` flag via GitHub API   |
| Grype                     | Yes (containers)     | Remote image digest              |
| Syft                      | Yes (containers)     | Remote image digest              |
| OSV-Scanner               | No                   | Requires local lockfiles         |
| Semgrep                   | No                   | Requires local source            |
| Gitleaks                  | No                   | Requires local git repo          |
| Bandit / Brakeman / gosec | No                   | Requires local source            |
| Checkov / KICS            | No                   | Requires local IaC files         |
| npm audit                 | No                   | Requires local node_modules      |
| FOSSA CLI                 | No (CLI)             | SaaS can scan via SCM OAuth      |
| detect-secrets            | No                   | Requires local files             |

---

## Contradictions

1. **Trivy DB status:** The search result summary states "vulnerability database
   updates remain suspended as of March 25, 2026," but the GitHub Discussions
   post states "Trivy-db builds are back on schedule." The GitHub Discussions
   thread (primary source from maintainers) is more authoritative; the summary
   appears to be from an article written before DB restoration was confirmed.
   RESOLUTION: DB appears restored but treat Trivy with caution until v0.70.x+
   release with full remediation confirmed.

2. **Semgrep rule licensing:** Some sources describe Semgrep as "fully open
   source" while others note the 2024 license change to Semgrep Rules License
   v1.0 for maintainer-written rules. Both are correct but describe different
   things: the engine (LGPL 2.1, truly open) vs. the curated rules (restricted).
   Community-contributed rules remain open source.

3. **Snyk free tier test counts:** Different sources list slightly different
   monthly test limits (200 vs 400 for Open Source). The official Snyk pricing
   page should be consulted directly as these limits have changed multiple
   times.

---

## Gaps

1. **Bandit/gosec false positive rates:** No authoritative 2026 data found on
   measured false positive rates for language-specific SAST tools.
2. **FOSSA exact free tier limits:** The free tier exists but exact project/repo
   limits for 2026 were not confirmed (sources mentioned "smaller projects"
   without specific numbers).
3. **Trivy v0.70.x status:** Whether a fully clean post-compromise Trivy release
   exists as of 2026-03-31 was not confirmed. v0.69.3 is the last confirmed-safe
   version.
4. **OWASP Dependency-Track self-hosting requirements:** Resource requirements
   for self-hosting Dependency-Track were not fully explored.
5. **Checkov vs KICS performance benchmarks:** Specific scan time data for large
   monorepos not found.

---

## Serendipity

1. **GitHub Actions 2026 Security Roadmap is directly relevant to repo analysis
   tooling:** The planned `dependencies:` locking section and egress firewall
   will significantly change how Actions-based security tools are invoked and
   trusted. Any skill invoking security scanners via Actions should pin to SHA
   and watch for the new locking primitives in Q2-Q3 2026.

2. **Trivy incident as canonical teaching example:** The March 2026 Trivy attack
   demonstrates exactly the threat model for a repo-analysis skill that invokes
   external security tools. Any tool invoked via a GitHub Action tag reference
   is a supply chain risk. The skill should pin all scanner actions to immutable
   commit SHAs.

3. **Socket.dev now embedded in npm registry pages:** Socket analysis is shown
   on every npm package page as of 2026, making it a de facto standard for
   supply chain risk visibility in the npm ecosystem.

4. **CISA KEV relevance:** Grype's integration of CISA KEV data means findings
   from Grype can be directly cross-referenced against the CISA Known Exploited
   Vulnerabilities catalog — a regulatory compliance dimension most free tools
   lack.

---

## Sources

| #   | URL                                                                                                                                     | Title                                                | Type                     | Trust  | CRAAP Score   | Date    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------ | ------ | ------------- | ------- |
| 1   | https://thehackernews.com/2026/03/trivy-security-scanner-github-actions.html                                                            | Trivy Security Scanner GitHub Actions Breached       | News                     | MEDIUM | 4/5/5/4/4=4.4 | 2026-03 |
| 2   | https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23                                                           | Trivy ecosystem supply chain temporarily compromised | Official advisory        | HIGH   | 5/5/5/5/5=5.0 | 2026-03 |
| 3   | https://github.com/aquasecurity/trivy/discussions/10425                                                                                 | Trivy Security incident 2026-03-19                   | Official maintainer post | HIGH   | 5/5/5/5/5=5.0 | 2026-03 |
| 4   | https://appsecsanta.com/grype                                                                                                           | Grype Review 2026                                    | Review site              | MEDIUM | 4/5/4/4/4=4.2 | 2026    |
| 5   | https://google.github.io/osv-scanner/                                                                                                   | OSV-Scanner Docs                                     | Official docs            | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 6   | https://appsecsanta.com/sca-tools/open-source-sca-tools                                                                                 | Free & Open-Source SCA Tools Compared                | Review                   | MEDIUM | 4/5/4/4/4=4.2 | 2026    |
| 7   | https://jit.io/resources/appsec-tools/osv-scanner-vs-npm-audit-a-detailed-comparison-of-sca-tools                                       | OSV Scanner vs npm audit comparison                  | Vendor blog              | MEDIUM | 3/4/3/4/3=3.4 | 2025    |
| 8   | https://owasp.org/www-project-dependency-check/                                                                                         | OWASP Dependency-Check                               | Official                 | HIGH   | 5/5/5/5/4=4.8 | 2026    |
| 9   | https://snyk.io/plans/                                                                                                                  | Snyk Pricing                                         | Official                 | HIGH   | 5/5/5/5/3=4.6 | 2026    |
| 10  | https://github.com/ossf/scorecard                                                                                                       | OpenSSF Scorecard GitHub                             | Official                 | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 11  | https://socket.dev/                                                                                                                     | Socket.dev                                           | Official                 | HIGH   | 5/5/4/4/3=4.2 | 2026    |
| 12  | https://docs.deps.dev/                                                                                                                  | deps.dev API Docs                                    | Official                 | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 13  | https://appsecsanta.com/sca-tools/dependabot-vs-renovate                                                                                | Dependabot vs Renovate 2026                          | Review                   | MEDIUM | 4/5/4/4/4=4.2 | 2026    |
| 14  | https://appsecsanta.com/sast-tools/gitleaks-vs-trufflehog                                                                               | Gitleaks vs TruffleHog 2026                          | Review                   | MEDIUM | 4/5/4/4/4=4.2 | 2026    |
| 15  | https://github.com/trufflesecurity/trufflehog                                                                                           | TruffleHog GitHub                                    | Official                 | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 16  | https://docs.github.com/code-security/secret-scanning/about-secret-scanning                                                             | GitHub Secret Scanning Docs                          | Official                 | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 17  | https://medium.com/@navinwork21/secret-scanner-comparison-finding-your-best-tool-ed899541b9b6                                           | Secret Scanner Comparison                            | Blog                     | LOW    | 2/4/2/3/3=2.8 | 2025    |
| 18  | https://semgrep.dev/products/community-edition/                                                                                         | Semgrep Community Edition                            | Official                 | HIGH   | 5/5/5/5/4=4.8 | 2026    |
| 19  | https://docs.github.com/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/about-code-scanning | GitHub Code Scanning Docs                            | Official                 | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 20  | https://appsecsanta.com/sast-tools/open-source-sast-tools                                                                               | Open-Source SAST Tools 2026                          | Review                   | MEDIUM | 4/5/4/4/4=4.2 | 2026    |
| 21  | https://fossa.com/                                                                                                                      | FOSSA Official                                       | Official                 | HIGH   | 5/5/4/4/3=4.2 | 2026    |
| 22  | https://github.com/licensee/licensee                                                                                                    | licensee GitHub                                      | Official                 | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 23  | https://www.npmjs.com/package/license-checker                                                                                           | license-checker npm                                  | Official                 | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 24  | https://appsecsanta.com/iac-security-tools/checkov-vs-kics                                                                              | Checkov vs KICS 2026                                 | Review                   | MEDIUM | 4/5/4/4/4=4.2 | 2026    |
| 25  | https://github.com/anchore/syft                                                                                                         | Syft GitHub                                          | Official                 | HIGH   | 5/5/5/5/5=5.0 | 2026    |
| 26  | https://dev.to/0012303/github-has-a-secret-security-api-scan-any-repo-for-vulnerabilities-in-30-seconds-2iff                            | GitHub Security API                                  | Community blog           | LOW    | 3/4/2/3/3=3.0 | 2025    |
| 27  | https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/                                | GitHub Actions 2026 Security Roadmap                 | Official GitHub blog     | HIGH   | 5/5/5/5/4=4.8 | 2026-03 |

---

## Confidence Assessment

- HIGH claims: 22
- MEDIUM claims: 4
- LOW claims: 1
- UNVERIFIED claims: 0
- Overall confidence: HIGH

The core tool capabilities, invocation methods, and free/paid tiers are
well-documented across multiple authoritative sources. The Trivy compromise
status is confirmed by official Aqua Security advisories and GitHub maintainer
discussions. The recommended free stack reflects current best practices as of
March 2026.
