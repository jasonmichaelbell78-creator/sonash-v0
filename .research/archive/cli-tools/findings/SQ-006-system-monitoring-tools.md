# SQ-006: System Monitoring, Process Management & DevOps Observability CLI Tools

**Research Date:** 2026-03-23 **Search Profile:** web | Depth: L1 (Exhaustive)
**Focus:** Windows 11 compatibility for a Next.js/Firebase/Node.js developer
**Search Rounds:** 8 (system monitors, process managers, disk tools, network
tools, log viewers, benchmarking, Node.js profiling, terminal dashboards)

---

## Summary

Researched 28 tools across 8 categories. Windows support varies significantly --
system monitors and network tools historically target Linux/macOS, but the Rust
ecosystem has driven strong cross-platform adoption. Node.js process managers
and benchmarking tools have excellent Windows support by nature. Key finding:
**bottom (btm)**, **glances**, **duf**, **dust**, **trippy**, **bandwhich**,
**pm2**, **concurrently**, **hyperfine**, and **tailspin** all work natively on
Windows with no WSL required.

---

## Category 1: System Resource Monitors (TUI)

### btop4win

- **What:** Full-featured Windows port of btop++ -- CPU, memory, disk, network,
  GPU monitoring with colorful TUI graphs
- **URL:** https://github.com/aristocratos/btop4win
- **Install:** Download release from GitHub (no package manager); requires
  Windows Terminal for best experience
- **Stars/Activity:** 1,659 stars (parent btop: 31,138 stars); last commit Oct
  2025
- **Windows:** Yes (native) -- Windows 10 1607+ required. Two flavors: standard
  (with GPU via Libre Hardware Monitor) and OHMR (no GPU/temp). Needs Cascadia
  Code font for braille graph symbols.
- **Use case:** Full system dashboard replacing Task Manager -- CPU per-core,
  memory, swap, disk I/O, network, GPU all in one pane
- **Workflow fit:** Keep open in a terminal tab while developing to watch
  resource usage during Next.js builds, Firebase emulator runs, or heavy npm
  installs
- **Confidence:** HIGH

### bottom (btm)

- **What:** Cross-platform graphical process/system monitor with customizable
  widgets, written in Rust
- **URL:** https://github.com/ClementTsang/bottom
- **Install:** `scoop install bottom`, `winget install bottom`,
  `cargo install bottom`
- **Stars/Activity:** 13,064 stars; last commit Mar 2026 (very active)
- **Windows:** Yes (native, first-class) -- Windows is a primary target platform
- **Use case:** Lightweight alternative to btop with stronger graphing focus.
  Lower CPU usage than glances or btop. Interactive process management with kill
  signals.
- **Workflow fit:** Ideal lightweight monitor for a dev machine -- less resource
  overhead than alternatives, great for keeping open during long dev sessions
  without impacting performance
- **Confidence:** HIGH

### Glances

- **What:** Cross-platform top/htop alternative in Python with web UI, API, and
  adaptive terminal layout
- **URL:** https://github.com/nicolargo/glances
- **Install:** `pip install glances`, `scoop install glances`,
  `winget install glances`
- **Stars/Activity:** 32,140 stars; last commit Mar 2026 (very active)
- **Windows:** Yes (native) -- full cross-platform support including Windows
- **Use case:** Most feature-rich monitor: CPU, memory, disk, network, Docker
  containers, processes, sensors, file systems. Can export to
  InfluxDB/Prometheus. Web UI mode (`glances -w`) for browser-based monitoring.
- **Workflow fit:** Web UI mode is powerful for monitoring from a second
  screen/browser while terminal is occupied with dev work. Docker container
  monitoring useful if running Firebase emulators in containers.
- **Confidence:** HIGH
- **Note:** Higher CPU usage (~20%) compared to btm (~1-3%). Python dependency
  required.

### NTop

- **What:** htop-like system monitor built specifically for Windows with Vi
  keybindings
- **URL:** https://github.com/gsass1/NTop
- **Install:** Download release from GitHub; `scoop install ntop`
- **Stars/Activity:** 1,476 stars; last commit Dec 2024 (less active)
- **Windows:** Yes (Windows-native, built FOR Windows) -- uses Win32 API
  directly
- **Use case:** Lightweight Windows-native process viewer with familiar htop
  interface. No cross-platform abstraction overhead.
- **Workflow fit:** Quick process inspection when you just need to check what's
  eating CPU/memory without the weight of a full dashboard
- **Confidence:** MEDIUM (less actively maintained)

### Zenith

- **What:** htop-like monitor with zoom-able charts for CPU, GPU, network, and
  disk, written in Rust
- **URL:** https://github.com/bvaisvil/zenith
- **Install:** `cargo install zenith` (Linux/macOS primarily)
- **Stars/Activity:** 2,980 stars; last commit Mar 2026
- **Windows:** No -- failed to build on Windows historically. Linux-focused.
- **Use case:** Zoom-able historical charts for performance analysis
- **Workflow fit:** Not recommended for this user's Windows setup
- **Confidence:** LOW (Windows incompatible)

---

## Category 2: Process Managers (Node.js / Dev Server)

### PM2

- **What:** Production-grade Node.js process manager with built-in load
  balancer, monitoring dashboard, log management, and zero-downtime reloads
- **URL:** https://github.com/Unitech/pm2 / https://pm2.io
- **Install:** `npm install -g pm2`
- **Stars/Activity:** 43,005 stars; last commit Feb 2026
- **Windows:** Yes (native) -- cross-platform Node.js tool
- **Use case:** Keep Node.js processes alive, cluster mode for multi-core,
  built-in monitoring (`pm2 monit`), log aggregation, startup scripts. `pm2-dev`
  mode replaces nodemon for development.
- **Workflow fit:** Run Next.js dev server and Firebase emulators under PM2 for
  process supervision, log aggregation, and resource monitoring in one tool.
  `pm2 monit` gives a TUI dashboard of all managed processes. `pm2 logs` streams
  all process logs in one view.
- **Confidence:** HIGH

### nodemon

- **What:** File watcher that auto-restarts Node.js applications on file changes
- **URL:** https://github.com/remy/nodemon
- **Install:** `npm install -g nodemon` or `npm install --save-dev nodemon`
- **Stars/Activity:** 26,700 stars; last commit Mar 2026
- **Windows:** Yes (native) -- cross-platform Node.js tool
- **Use case:** Development-only auto-restart on file changes. Simpler than PM2
  for single-process dev workflows.
- **Workflow fit:** Already widely used in Node.js dev; Next.js has its own HMR
  so nodemon is more useful for backend scripts, Cloud Functions development, or
  custom Node.js servers
- **Confidence:** HIGH

### concurrently

- **What:** Run multiple commands concurrently with colored, labeled output and
  cross-platform support
- **URL:** https://github.com/open-cli-tools/concurrently
- **Install:** `npm install -g concurrently` or
  `npm install --save-dev concurrently`
- **Stars/Activity:** 7,715 stars; last commit Mar 2026
- **Windows:** Yes (native) -- specifically designed for cross-platform
  compatibility (unlike `&` operator which fails on cmd.exe)
- **Use case:** Run Next.js dev server + Firebase emulators + TypeScript
  compilation simultaneously from a single `npm run dev` command with colored,
  prefixed output
- **Workflow fit:** Essential for this user's workflow -- run
  `concurrently "next dev" "firebase emulators:start" "tsc --watch"` from a
  single terminal. Color-coded output distinguishes processes.
- **Confidence:** HIGH

### npm-run-all2

- **What:** Maintained fork of npm-run-all for running multiple npm scripts in
  parallel or sequentially
- **URL:** https://github.com/bcomnes/npm-run-all2
- **Install:** `npm install --save-dev npm-run-all2`
- **Stars/Activity:** 407 stars (original npm-run-all: 5,846 stars); last commit
  Mar 2026 (actively maintained)
- **Windows:** Yes (native) -- cross-platform, specifically solves the Windows
  `&` operator problem
- **Use case:** `run-p` for parallel, `run-s` for sequential npm script
  execution with glob patterns for script names
- **Workflow fit:** Alternative to concurrently if you prefer npm script
  orchestration. Lighter weight, focused on npm scripts rather than arbitrary
  commands. Requires Node >= 20.
- **Confidence:** HIGH

---

## Category 3: Disk Usage Analyzers

### dust

- **What:** Intuitive Rust replacement for `du` -- shows disk usage as a visual
  tree with bar charts
- **URL:** https://github.com/bootandy/dust
- **Install:** `winget install bootandy.dust`, `scoop install dust`,
  `cargo install du-dust`
- **Stars/Activity:** 11,451 stars; last commit Feb 2026
- **Windows:** Yes (native) -- available via winget, scoop, and cargo
- **Use case:** Instantly see which directories consume the most space. Visual
  tree output is far more readable than traditional `du`. Great for finding
  bloated `node_modules` or build output.
- **Workflow fit:** Run `dust node_modules` to understand dependency sizes,
  `dust .next` to see build output size, `dust` in project root to find space
  hogs
- **Confidence:** HIGH

### duf

- **What:** Modern replacement for `df` showing disk usage/free space in a
  beautiful table, written in Go
- **URL:** https://github.com/muesli/duf
- **Install:** `scoop install duf`, `winget install duf`, `choco install duf`
- **Stars/Activity:** 14,888 stars; last commit Jan 2026
- **Windows:** Yes (native) -- explicit Windows support documented
- **Use case:** At-a-glance view of all mounted filesystems with usage bars,
  device info, and mount points. Color-coded capacity warnings.
- **Workflow fit:** Quick disk space check when builds fill up, or when Firebase
  emulator data grows. Much more readable than PowerShell disk commands.
- **Confidence:** HIGH

### ncdu

- **What:** NCurses Disk Usage -- interactive file/directory size browser with
  navigation and deletion
- **URL:** https://dev.yorhel.nl/ncdu
- **Install:** Binary available for Windows; `scoop install ncdu`
- **Stars/Activity:** Hosted on codeberg.org (not GitHub-centric); long-standing
  project since 2007
- **Windows:** Partial -- Windows binary exists but ncurses support on Windows
  can be spotty. Works better via WSL.
- **Use case:** Interactive drill-down into directory sizes with ability to
  delete files in-place
- **Workflow fit:** Useful for deep cleanup sessions but dust provides similar
  value with better Windows support
- **Confidence:** MEDIUM (Windows support is secondary)

---

## Category 4: Network Monitoring & Diagnostics

### bandwhich

- **What:** Terminal bandwidth utilization tool showing real-time network usage
  by process, connection, and remote host, written in Rust
- **URL:** https://github.com/imsnif/bandwhich
- **Install:** `scoop install bandwhich`, `cargo install bandwhich` (requires
  npcap on Windows)
- **Stars/Activity:** 11,628 stars; last commit Mar 2026
- **Windows:** Yes (native) -- uses WinAPI for process-to-connection mapping.
  Requires npcap installation for packet capture.
- **Use case:** See which processes are using bandwidth, which remote hosts they
  connect to, and how much data flows. Identifies unexpected network activity.
- **Workflow fit:** Debug slow dev server responses by checking if something
  else is saturating bandwidth. See what Firebase emulators are talking to.
  Identify unexpected outbound connections from Node.js processes.
- **Confidence:** HIGH (requires npcap setup)

### Trippy

- **What:** Modern cross-platform network diagnostic tool combining traceroute +
  ping with a fancy TUI, written in Rust
- **URL:** https://github.com/fujiapple852/trippy / https://trippy.rs
- **Install:** `scoop install trippy`, `winget install trippy`,
  `cargo install trippy`
- **Stars/Activity:** 6,714 stars; last commit Mar 2026
- **Windows:** Yes (native, first-class since v0.7.0) -- full support for all
  tracing modes and protocols on Windows
- **Use case:** Network path analysis with visual TUI. Diagnose latency, packet
  loss, and routing issues between your machine and remote services (Firebase,
  APIs, CDNs).
- **Workflow fit:** Debug connectivity issues to Firebase services, investigate
  slow API responses, visualize network hops to deployment targets
- **Confidence:** HIGH

### psnet

- **What:** Windows-native real-time TUI network monitor with speed graphs, DNS
  resolution, packet inspection, and 9 interactive tabs
- **URL:** https://github.com/marlocarlo/psnet
- **Install:** `cargo install psnet` or download release binary
- **Stars/Activity:** 16 stars; last commit Mar 2026 (new project, actively
  developed)
- **Windows:** Yes (Windows-only) -- uses Windows-specific APIs (iphlpapi.dll,
  dnsapi.dll, ws2_32.dll). Zero external dependencies (no npcap needed).
- **Use case:** Deep Windows network monitoring: live speed graphs, active
  connections with DNS hostnames, Wireshark-like traffic log, LAN discovery,
  firewall management. Identifies 200+ server types via fingerprinting.
- **Workflow fit:** Most comprehensive Windows network monitor. No npcap
  dependency unlike bandwhich. Good for understanding what all your dev tools
  are doing on the network.
- **Confidence:** MEDIUM (very new, low adoption, but Windows-native is a strong
  advantage)

### doggo

- **What:** Modern command-line DNS client for humans, written in Go. Supports
  DNS-over-HTTPS, DNS-over-TLS, DNS-over-QUIC.
- **URL:** https://github.com/mr-karan/doggo
- **Install:** `scoop install doggo`,
  `go install github.com/mr-karan/doggo/cmd/doggo@latest`
- **Stars/Activity:** 4,189 stars; last commit Feb 2026
- **Windows:** Yes (native) -- Go cross-platform binary
- **Use case:** Modern replacement for `dig`/`nslookup` with colored output,
  multiple DNS protocol support, JSON output. Web UI mode available.
- **Workflow fit:** Debug DNS issues for Firebase custom domains, verify DNS
  propagation, test DNS-over-HTTPS configurations
- **Confidence:** HIGH

### dog

- **What:** Command-line DNS client with colorful output and DNS-over-TLS/HTTPS
  support, written in Rust
- **URL:** https://github.com/ogham/dog
- **Install:** `cargo install dog` or download binary
- **Stars/Activity:** 6,628 stars; last commit May 2024 (appears unmaintained)
- **Windows:** Partial -- Rust binary can compile for Windows but not actively
  tested/supported
- **Use case:** Similar to doggo but less actively maintained
- **Workflow fit:** Use doggo instead -- it's actively maintained and has better
  Windows support
- **Confidence:** LOW (unmaintained since 2024)

---

## Category 5: Log Viewers & Highlighters

### tailspin

- **What:** Zero-config log file highlighter that colorizes dates, IPs, URLs,
  numbers, severity levels, and more. Written in Rust.
- **URL:** https://github.com/bensadeh/tailspin
- **Install:** `scoop install tailspin`, `cargo install tailspin`
- **Stars/Activity:** 7,731 stars; last commit Mar 2026 (very active)
- **Windows:** Yes (native) -- available via scoop and cargo
- **Use case:** Pipe any log output through `tspin` for instant color
  highlighting without configuration. Works with stdin, files, and `less`
  integration.
- **Workflow fit:** Pipe Next.js or Firebase emulator output through tailspin
  for instant readability: `next dev 2>&1 | tspin`. Highlight build logs, error
  traces, API responses. No config needed -- just works.
- **Confidence:** HIGH

### lnav (Log File Navigator)

- **What:** Advanced ncurses-based log file viewer with auto-format detection,
  timeline merging, SQL queries, and filtering
- **URL:** https://github.com/tstack/lnav / https://lnav.org
- **Install:** Via WSL or Cygwin on Windows; native Linux/macOS
- **Stars/Activity:** 9,745 stars; last commit Mar 2026 (very active)
- **Windows:** Partial (WSL/Cygwin only) -- no native Windows binary
- **Use case:** Merge multiple log files into unified timeline, SQL-based log
  querying, auto-detect log formats (syslog, JSON, Apache, etc.), filter by
  level/time
- **Workflow fit:** Powerful for analyzing Firebase Cloud Function logs or
  server logs, but WSL requirement reduces convenience for quick use
- **Confidence:** MEDIUM (WSL-only on Windows)

### hl

- **What:** High-performance structured log viewer for JSON/logfmt with 2GiB/s
  parsing speed, written in Rust
- **URL:** https://github.com/pamburus/hl
- **Install:** `cargo install hl`
- **Stars/Activity:** 2,994 stars; last commit Mar 2026 (very active)
- **Windows:** Likely (Rust cross-platform, but need to verify)
- **Use case:** Blazing fast structured log processing. Converts JSON logs into
  human-readable format. Ideal for JSONL log files.
- **Workflow fit:** Process JSONL log output from Node.js applications, Firebase
  functions, or structured logging libraries. Speed matters for large log files.
- **Confidence:** MEDIUM (Windows support not explicitly confirmed in search
  results)

### klp

- **What:** Lightweight CLI viewer for structured logs (logfmt, JSONL, CSV, TSV,
  SQLite). Single-file Python script, zero dependencies.
- **URL:** https://github.com/dloss/klp
- **Install:** Download `klp.py` and run with Python 3.7+; successor Kelora is a
  Rust rewrite
- **Stars/Activity:** Small project; actively developed
- **Windows:** Yes -- Python script runs anywhere Python runs
- **Use case:** Quick structured log analysis with time-gap detection, level
  filtering, and Python expression filtering
- **Workflow fit:** Zero-install option for quick JSONL/logfmt log analysis.
  Good for inspecting Firebase or Node.js structured logs.
- **Confidence:** MEDIUM (small project, but zero-dependency is appealing)

---

## Category 6: Benchmarking & Profiling

### hyperfine

- **What:** Statistical command-line benchmarking tool with warmup runs,
  parameterized benchmarks, and export to CSV/JSON/Markdown. Written in Rust.
- **URL:** https://github.com/sharkdp/hyperfine
- **Install:** `scoop install hyperfine`, `winget install hyperfine`,
  `cargo install hyperfine`
- **Stars/Activity:** 27,744 stars; last commit Feb 2026
- **Windows:** Yes (native, first-class) -- uses cmd.exe as shell on Windows.
  Environment offset randomization available on Windows.
- **Use case:** Benchmark CLI commands with statistical rigor: warmup runs,
  multiple iterations, outlier detection, comparison mode. Export results for
  documentation.
- **Workflow fit:** Benchmark build times (`hyperfine "npm run build"`), compare
  script performance, measure startup times of different Node.js configurations.
  Essential for performance optimization work.
- **Confidence:** HIGH

### autocannon

- **What:** Fast HTTP/1.1 benchmarking tool written in Node.js with detailed
  latency histograms
- **URL:** https://github.com/mcollina/autocannon
- **Install:** `npm install -g autocannon`
- **Stars/Activity:** 8,416 stars; last commit Oct 2024
- **Windows:** Yes (native) -- Node.js cross-platform
- **Use case:** Load test HTTP servers with configurable concurrency, duration,
  and pipelining. Detailed percentile latency reporting.
- **Workflow fit:** Load test Next.js API routes and Cloud Functions locally
  before deployment. Integrates with Clinic.js for combined load + profiling.
- **Confidence:** HIGH

### Clinic.js

- **What:** Node.js performance diagnostic suite: Doctor (metrics), Flame
  (flamegraphs), Bubbleprof (async latency), HeapProfiler (memory)
- **URL:** https://github.com/clinicjs/node-clinic
- **Install:** `npm install -g clinic`
- **Stars/Activity:** 5,940 stars; last commit Sep 2024 (less active recently)
- **Windows:** Yes (native) -- Node.js cross-platform. 0x flamegraph tool
  underneath supports Windows.
- **Use case:** Diagnose Node.js performance bottlenecks with visual
  flamegraphs, identify async latency issues, track memory leaks. Integrates
  with autocannon for load-test-driven profiling.
- **Workflow fit:** Profile Next.js API routes and Cloud Functions for
  performance issues. `clinic flame -- node server.js` generates interactive
  flamegraphs. `clinic doctor` gives overall health assessment.
- **Confidence:** HIGH (though maintenance has slowed)

### 0x

- **What:** Single-command flamegraph profiling for Node.js processes
- **URL:** https://github.com/davidmarkclements/0x
- **Install:** `npm install -g 0x`
- **Stars/Activity:** 3,531 stars; last commit Sep 2025
- **Windows:** Yes (native) -- works on any platform Node.js runs on. Uses
  `$PORT` syntax on Windows for `--on-port`.
- **Use case:** Generate interactive flamegraphs from any Node.js process with a
  single command
- **Workflow fit:** Quick CPU profiling of Node.js scripts without the full
  Clinic.js suite. Good for one-off performance investigations.
- **Confidence:** HIGH

---

## Category 7: Process Inspection

### procs

- **What:** Modern replacement for `ps` with colored output, multi-column
  search, Docker awareness, and tree view. Written in Rust.
- **URL:** https://github.com/dalance/procs
- **Install:** `scoop install procs`, `cargo install procs`
- **Stars/Activity:** 5,979 stars; last commit Mar 2026
- **Windows:** Partial (experimental) -- listed as experimentally supported on
  Windows with some limitations
- **Use case:** Enhanced process listing with TCP/UDP port display, read/write
  throughput, tree view, and keyword search across all columns
- **Workflow fit:** Find which process is holding a port (`procs --tcp 3000`),
  inspect Node.js process trees, identify resource-heavy processes. More
  informative than Task Manager's process list.
- **Confidence:** MEDIUM (experimental Windows support)

---

## Category 8: Container Management & Terminal Dashboards

### lazydocker

- **What:** Terminal UI for managing Docker containers, images, volumes, and
  networks with keyboard/mouse navigation. Written in Go.
- **URL:** https://github.com/jesseduffield/lazydocker / https://lazydocker.com
- **Install:** `scoop install lazydocker`, `choco install lazydocker`; also
  works via WSL
- **Stars/Activity:** 50,300 stars; last commit Mar 2026
- **Windows:** Partial -- works via WSL2 with Docker Desktop. Native Windows
  terminal support depends on Docker Desktop WSL integration.
- **Use case:** Visual Docker management: see container logs, stats,
  restart/stop containers, manage images and volumes, all from a single TUI
- **Workflow fit:** If running Firebase emulators or dev databases in Docker,
  lazydocker gives instant visibility into container health, logs, and resource
  usage without remembering Docker CLI commands
- **Confidence:** HIGH (via WSL2/Docker Desktop)

### WTF (wtfutil)

- **What:** Personal information terminal dashboard with 50+ configurable
  modules for Git, GitHub, calendars, monitoring, and more. Written in Go.
- **URL:** https://github.com/wtfutil/wtf / https://wtfutil.com
- **Install:** Download release binary; `scoop install wtfutil`
- **Stars/Activity:** 16,798 stars; last commit Mar 2026
- **Windows:** Partial -- runs natively on Linux/macOS, via WSL on Windows
- **Use case:** Custom terminal dashboard combining GitHub PRs, calendar, Git
  status, system resources, todo lists, and external service status into one
  view
- **Workflow fit:** Build a morning dashboard showing GitHub issues, calendar,
  Git branch status, and system health. WSL requirement is a friction point.
- **Confidence:** MEDIUM (WSL-only on Windows)

---

## Windows Compatibility Summary

### Native Windows Support (no WSL needed)

| Tool         | Category            | Install Method        |
| ------------ | ------------------- | --------------------- |
| bottom (btm) | System monitor      | winget, scoop, cargo  |
| btop4win     | System monitor      | GitHub release        |
| Glances      | System monitor      | pip, scoop, winget    |
| NTop         | System monitor      | scoop, GitHub release |
| PM2          | Process manager     | npm                   |
| nodemon      | Process manager     | npm                   |
| concurrently | Process manager     | npm                   |
| npm-run-all2 | Process manager     | npm                   |
| dust         | Disk usage          | winget, scoop, cargo  |
| duf          | Disk usage          | scoop, winget, choco  |
| bandwhich    | Network monitor     | scoop, cargo (+npcap) |
| Trippy       | Network diagnostic  | scoop, winget, cargo  |
| psnet        | Network monitor     | cargo (Windows-only)  |
| doggo        | DNS client          | scoop, go install     |
| tailspin     | Log highlighter     | scoop, cargo          |
| hyperfine    | Benchmarking        | scoop, winget, cargo  |
| autocannon   | HTTP benchmark      | npm                   |
| Clinic.js    | Node.js profiler    | npm                   |
| 0x           | Flamegraph profiler | npm                   |

### WSL Required on Windows

| Tool          | Category       | Notes                              |
| ------------- | -------------- | ---------------------------------- |
| lnav          | Log viewer     | Full-featured but needs WSL/Cygwin |
| lazydocker    | Container TUI  | Works via WSL2 + Docker Desktop    |
| WTF (wtfutil) | Dashboard      | WSL for Windows                    |
| Zenith        | System monitor | Does not build on Windows          |

### Experimental/Partial Windows

| Tool  | Category       | Notes                            |
| ----- | -------------- | -------------------------------- |
| procs | Process viewer | Experimental Windows support     |
| ncdu  | Disk usage     | Binary exists but ncurses issues |
| dog   | DNS client     | Unmaintained since 2024          |

---

## Top Recommendations for This User's Workflow

### Immediate High-Value Installs

1. **bottom (btm)** -- lightweight system monitor, excellent Windows support,
   low overhead
2. **concurrently** -- run Next.js + Firebase emulators from one terminal
3. **dust** -- find what's eating disk space in node_modules and .next
4. **duf** -- quick disk space overview
5. **tailspin** -- instant log highlighting, pipe any output through it
6. **hyperfine** -- benchmark build times and script performance

### Worth Exploring

7. **PM2** -- if managing multiple long-running Node.js processes
8. **Trippy** -- when debugging network connectivity issues
9. **bandwhich** -- when something is eating bandwidth
10. **Glances** -- if you want a web UI dashboard for monitoring
11. **doggo** -- modern DNS debugging
12. **autocannon** -- load testing API routes

### Node.js Specific

13. **Clinic.js + autocannon** -- combined profiling and load testing for API
    performance
14. **0x** -- quick flamegraph generation for CPU bottleneck identification

---

## Sources

- [btop GitHub](https://github.com/aristocratos/btop)
- [btop4win GitHub](https://github.com/aristocratos/btop4win)
- [bottom GitHub](https://github.com/ClementTsang/bottom)
- [Glances GitHub](https://github.com/nicolargo/glances)
- [NTop GitHub](https://github.com/gsass1/NTop)
- [Zenith GitHub](https://github.com/bvaisvil/zenith)
- [PM2 Official](https://pm2.io/)
- [PM2 GitHub](https://github.com/Unitech/pm2)
- [nodemon GitHub](https://github.com/remy/nodemon)
- [concurrently GitHub](https://github.com/open-cli-tools/concurrently)
- [npm-run-all2 GitHub](https://github.com/bcomnes/npm-run-all2)
- [dust GitHub](https://github.com/bootandy/dust)
- [duf GitHub](https://github.com/muesli/duf)
- [ncdu Official](https://dev.yorhel.nl/ncdu)
- [bandwhich GitHub](https://github.com/imsnif/bandwhich)
- [Trippy GitHub](https://github.com/fujiapple852/trippy)
- [Trippy Official](https://trippy.rs/)
- [psnet GitHub](https://github.com/marlocarlo/psnet)
- [doggo GitHub](https://github.com/mr-karan/doggo)
- [dog GitHub](https://github.com/ogham/dog)
- [tailspin GitHub](https://github.com/bensadeh/tailspin)
- [lnav Official](https://lnav.org/)
- [lnav GitHub](https://github.com/tstack/lnav)
- [hl GitHub](https://github.com/pamburus/hl)
- [klp GitHub](https://github.com/dloss/klp)
- [hyperfine GitHub](https://github.com/sharkdp/hyperfine)
- [autocannon GitHub](https://github.com/mcollina/autocannon)
- [Clinic.js GitHub](https://github.com/clinicjs/node-clinic)
- [0x GitHub](https://github.com/davidmarkclements/0x)
- [lazydocker GitHub](https://github.com/jesseduffield/lazydocker)
- [WTF GitHub](https://github.com/wtfutil/wtf)
- [awesome-tuis GitHub](https://github.com/rothgar/awesome-tuis)
- [Terminal Trove](https://terminaltrove.com/categories/top/)
- [Modernizing Windows Server Monitoring (bandwhich + btop)](https://lalatenduswain.medium.com/modernizing-windows-server-monitoring-a-guide-to-installing-btop-and-bandwhich-4364271502c8)
- [Jeff Geerling - Top 10 Console Monitoring](https://www.jeffgeerling.com/blog/2025/top-10-ways-monitor-linux-console/)
- [Best Nodemon Alternatives](https://medium.com/@s.atmaramani/best-nodemon-alternatives-a-complete-guide-to-process-managers-for-node-js-7c0329192903)
- [duf for Linux/BSD/macOS/Windows](https://www.cyberciti.biz/open-source/command-line-hacks/duf-disk-usage-free-utility-for-linux-bsd-macos-windows/)
- [dust via winget](https://winstall.app/apps/bootandy.dust)
